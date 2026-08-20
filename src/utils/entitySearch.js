const ENTITY_CACHE = new Map();

const normalizeText = (value = '') => String(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const weatherPattern = /\b(meteo|météo|weather|forecast|previsions|prévisions|temperature|température)\b/i;

const getWeatherContext = (value = '') => {
  const query = String(value).trim();
  const weatherIntent = weatherPattern.test(query);
  const locationQuery = query
    .replace(/^(quelle est la|donne moi|donne-moi|what is the|what's the|show me|affiche|voir)?\s*(meteo|météo|weather|forecast|previsions|prévisions|temperature|température)?\s*(a|à|in|of|for|de|pour)?\s*/i, '')
    .replace(/\s+(aujourd'hui|aujourd hui|demain|today|tomorrow|ce soir|this week|cette semaine).*$/i, '')
    .trim();
  return { weatherIntent, locationQuery: locationQuery || query };
};

const getFavicon = (website) => {
  try {
    const hostname = new URL(website).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
  } catch {
    return '';
  }
};

const getClaimValue = (claims, property) => {
  const claim = claims?.[property]?.find((item) => item.rank !== 'deprecated');
  return claim?.mainsnak?.datavalue?.value;
};

const getEntityData = async (id, signal) => {
  const params = new URLSearchParams({
    action: 'wbgetentities',
    ids: id,
    props: 'claims|labels|descriptions',
    languages: 'fr|en',
    format: 'json',
    origin: '*'
  });
  const response = await fetch(`https://www.wikidata.org/w/api.php?${params}`, { signal });
  if (!response.ok) return null;
  const data = await response.json();
  return data.entities?.[id] || null;
};

const searchWikidata = async (query, signal) => {
  const languages = /[àâçéèêëîïôùûüÿœ]/i.test(query) ? ['fr', 'en'] : ['fr', 'en', 'de', 'es'];
  const responses = await Promise.all(languages.map(async (language) => {
    const params = new URLSearchParams({
      action: 'wbsearchentities',
      search: query,
      language,
      uselang: language,
      type: 'item',
      limit: '5',
      format: 'json',
      origin: '*'
    });
    const response = await fetch(`https://www.wikidata.org/w/api.php?${params}`, { signal });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.search || []).map((item) => ({ ...item, language }));
  }));

  const candidates = responses.flat();
  const normalizedQuery = normalizeText(query);
  const exact = candidates.find((candidate) => normalizeText(candidate.label) === normalizedQuery);
  const candidate = exact || candidates.find((item) => normalizeText(item.label).length >= 3) || null;
  if (!candidate) return null;

  const entity = await getEntityData(candidate.id, signal);
  const claims = entity?.claims || {};
  const website = typeof getClaimValue(claims, 'P856') === 'string' ? getClaimValue(claims, 'P856') : '';
  const imageFile = typeof getClaimValue(claims, 'P18') === 'string' ? getClaimValue(claims, 'P18') : '';
  const label = entity?.labels?.fr?.value || entity?.labels?.en?.value || candidate.label;
  const description = entity?.descriptions?.fr?.value || entity?.descriptions?.en?.value || candidate.description || '';
  const exactMatch = normalizeText(label) === normalizedQuery;
  const shortQuery = normalizedQuery.split(' ').length <= 4;

  if (!exactMatch && !shortQuery) return null;
  return {
    id: candidate.id,
    label,
    description,
    website,
    imageFile,
    language: candidate.language || 'fr'
  };
};

const getWikipediaImage = async (title, language, signal) => {
  const languages = [language, 'fr', 'en'].filter((value, index, list) => value && list.indexOf(value) === index);
  for (const currentLanguage of languages) {
    try {
      const response = await fetch(`https://${currentLanguage}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, { signal });
      if (!response.ok) continue;
      const summary = await response.json();
      const image = summary.thumbnail?.source || summary.originalimage?.source || '';
      if (image) return image;
    } catch {
      // Try the next language or continue without an image.
    }
  }
  return '';
};

const getWeatherResult = async (query, locationQuery, signal) => {
  const params = new URLSearchParams({ name: locationQuery, count: '1', language: 'fr', format: 'json' });
  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`, { signal });
  if (!response.ok) return null;
  const data = await response.json();
  const location = data.results?.[0];
  if (!location) return null;

  let weather = null;
  try {
    const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,weather_code&timezone=auto`, { signal });
    if (weatherResponse.ok) {
      const current = await weatherResponse.json();
      const code = Number(current.current?.weather_code);
      const description = code === 0 ? 'Ciel dégagé' : [1, 2].includes(code) ? 'Éclaircies' : code === 3 ? 'Nuageux' : [45, 48].includes(code) ? 'Brouillard' : [71, 73, 75, 77, 85, 86].includes(code) ? 'Neige' : [95, 96, 99].includes(code) ? 'Orages' : 'Pluie';
      weather = {
        temperature: Number.isFinite(Number(current.current?.temperature_2m)) ? Math.round(Number(current.current.temperature_2m)) : null,
        description
      };
    }
  } catch {
    // The location card can still be shown when the forecast endpoint is unavailable.
  }

  return {
    kind: 'weather',
    title: location.name,
    country: location.country || '',
    admin: location.admin1 || '',
    image: '',
    favicon: '',
    weather,
    target: '',
    searchQuery: query
  };
};

const classifyEntity = (description = '') => {
  if (/ville|commune|city|town|village|municipalit|capitale|localit|settlement/i.test(description)) return 'city';
  if (/personne|acteur|actrice|chanteur|chanteuse|joueur|joueuse|auteur|autrice|politicien|scientifique|artiste/i.test(description)) return 'person';
  if (/jeu vidéo|jeu video|video game|game series/i.test(description)) return 'game';
  if (/plante|fleur|arbre|animal|espèce|espece|montagne|monument/i.test(description)) return 'subject';
  return 'entity';
};

export const findSmartSearchResult = async (query, { signal } = {}) => {
  const cleanQuery = String(query || '').trim();
  if (cleanQuery.length < 3) return null;
  const cacheKey = cleanQuery.toLocaleLowerCase();
  if (ENTITY_CACHE.has(cacheKey)) return ENTITY_CACHE.get(cacheKey);

  const { weatherIntent, locationQuery } = getWeatherContext(cleanQuery);
  let result = null;

  try {
    if (weatherIntent) {
      result = await getWeatherResult(cleanQuery, locationQuery, signal);
    } else {
      const entity = await searchWikidata(cleanQuery, signal);
      if (entity) {
        const kind = classifyEntity(entity.description);
        const image = await getWikipediaImage(entity.label, entity.language, signal);
        result = {
          kind: entity.website ? 'site' : kind,
          title: entity.label,
          country: '',
          admin: entity.description || 'Résultat reconnu',
          image,
          favicon: entity.website ? getFavicon(entity.website) : '',
          weather: null,
          target: entity.website || '',
          searchQuery: cleanQuery
        };
      }
    }
  } catch {
    result = null;
  }

  ENTITY_CACHE.set(cacheKey, result);
  return result;
};
