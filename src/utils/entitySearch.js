const ENTITY_CACHE = new Map();

const normalizeText = (value = '') => String(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const weatherPattern = /\b(meteo|météo|weather|forecast|previsions|prévisions|temperature|température)\b/i;
const placeDescriptionPattern = /ville|commune|city|town|village|municipalit|capitale|localit|settlement|district|county|province/i;
const personDescriptionPattern = /personne|acteur|actrice|chanteur|chanteuse|joueur|joueuse|auteur|autrice|politicien|scientifique|artiste|person|actor|singer|player|author|politician|scientist/i;
const gameDescriptionPattern = /jeu vidéo|jeu video|video game|game series|franchise de jeux/i;
const subjectDescriptionPattern = /plante|fleur|arbre|animal|espèce|espece|montagne|monument|plant|flower|tree|animal|species|mountain|monument/i;
const osmBusinessPattern = /amenity|shop|office|craft|tourism|leisure|restaurant|cafe|fast_food|company|commercial/i;

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

const fetchWikipediaImage = async (title, language, signal) => {
  const languages = [language, 'fr', 'en'].filter((value, index, list) => value && list.indexOf(value) === index);
  for (const currentLanguage of languages) {
    try {
      const response = await fetch(`https://${currentLanguage}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, { signal });
      if (!response.ok) continue;
      const summary = await response.json();
      const image = summary.thumbnail?.source || summary.originalimage?.source || '';
      if (image) return image;
    } catch {
      // Continue with another language or without an image.
    }
  }
  return '';
};

const fetchEntityData = async (id, signal) => {
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
      limit: '10',
      format: 'json',
      origin: '*'
    });
    const response = await fetch(`https://www.wikidata.org/w/api.php?${params}`, { signal });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.search || []).map((item) => ({ ...item, language, source: 'wikidata' }));
  }));

  const candidates = responses.flat();
  const normalizedQuery = normalizeText(query);
  const uniqueCandidates = [...new Map(candidates.map((item) => [item.id, item])).values()];
  const exact = uniqueCandidates.find((candidate) => normalizeText(candidate.label) === normalizedQuery);
  const candidate = exact || uniqueCandidates.find((item) => normalizeText(item.label).length >= 3);
  if (!candidate) return null;

  const entity = await fetchEntityData(candidate.id, signal);
  const claims = entity?.claims || {};
  const website = typeof getClaimValue(claims, 'P856') === 'string' ? getClaimValue(claims, 'P856') : '';
  const label = entity?.labels?.fr?.value || entity?.labels?.en?.value || candidate.label;
  const description = entity?.descriptions?.fr?.value || entity?.descriptions?.en?.value || candidate.description || '';
  const normalizedLabel = normalizeText(label);
  const exactMatch = normalizedLabel === normalizedQuery;
  const queryWordCount = normalizedQuery.split(' ').length;
  if (!exactMatch && queryWordCount > 5) return null;

  return {
    source: 'wikidata',
    id: candidate.id,
    title: label,
    description,
    website,
    imageFile: typeof getClaimValue(claims, 'P18') === 'string' ? getClaimValue(claims, 'P18') : '',
    language: candidate.language || 'fr',
    exact: exactMatch,
    score: (exactMatch ? 100 : 45) + (website ? 8 : 0)
  };
};

const searchWikipedia = async (query, signal) => {
  const languages = ['fr', 'en'];
  const responses = await Promise.all(languages.map(async (language) => {
    const params = new URLSearchParams({
      action: 'query',
      list: 'search',
      srsearch: query,
      srlimit: '5',
      srprop: 'snippet',
      format: 'json',
      origin: '*'
    });
    const response = await fetch(`https://${language}.wikipedia.org/w/api.php?${params}`, { signal });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.query?.search || []).map((item) => ({ ...item, language, source: 'wikipedia' }));
  }));

  const candidates = responses.flat();
  const normalizedQuery = normalizeText(query);
  const candidate = candidates.find((item) => normalizeText(item.title) === normalizedQuery) || candidates[0];
  if (!candidate) return null;
  const exact = normalizeText(candidate.title) === normalizedQuery;
  if (!exact && normalizedQuery.split(' ').length > 5) return null;
  return {
    source: 'wikipedia',
    title: candidate.title,
    description: candidate.snippet?.replace(/<[^>]+>/g, '').replace(/&quot;/g, '"') || '',
    website: '',
    language: candidate.language,
    exact,
    score: exact ? 82 : 34
  };
};

const getOsmTitle = (item) => item.namedetails?.name || item.name || String(item.display_name || '').split(',')[0].trim();
const getOsmWebsite = (item) => item.extratags?.website || item.extratags?.['contact:website'] || item.extratags?.url || '';
const getOsmDescription = (item) => {
  const type = item.type || item.class || 'lieu';
  const city = item.address?.city || item.address?.town || item.address?.village || item.address?.municipality || '';
  return `${type.replace(/_/g, ' ')}${city ? ` · ${city}` : ''}`;
};

const searchOpenStreetMap = async (query, signal) => {
  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    addressdetails: '1',
    extratags: '1',
    namedetails: '1',
    limit: '8',
    'accept-language': 'fr,en'
  });
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { signal });
  if (!response.ok) return null;
  const data = await response.json();
  const normalizedQuery = normalizeText(query);
  const candidates = (data || []).map((item) => {
    const title = getOsmTitle(item);
    const exact = normalizeText(title) === normalizedQuery;
    const website = getOsmWebsite(item);
    const isBusiness = osmBusinessPattern.test(`${item.class || ''} ${item.type || ''}`);
    return {
      source: 'osm',
      title,
      description: getOsmDescription(item),
      website,
      country: item.address?.country || '',
      admin: item.address?.state || item.address?.county || item.address?.city || item.address?.town || '',
      exact,
      isBusiness,
      score: (exact ? 90 : 38) + (isBusiness ? 14 : 0) + (website ? 6 : 0)
    };
  }).filter((item) => item.title);
  return candidates.sort((first, second) => second.score - first.score)[0] || null;
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
  if (placeDescriptionPattern.test(description)) return 'city';
  if (personDescriptionPattern.test(description)) return 'person';
  if (gameDescriptionPattern.test(description)) return 'game';
  if (subjectDescriptionPattern.test(description)) return 'subject';
  return 'entity';
};

const chooseCandidate = (candidates, query) => {
  const normalizedQuery = normalizeText(query);
  return candidates
    .filter(Boolean)
    .sort((first, second) => {
      const firstExact = normalizeText(first.title) === normalizedQuery ? 1 : 0;
      const secondExact = normalizeText(second.title) === normalizedQuery ? 1 : 0;
      return (secondExact - firstExact) || ((second.score || 0) - (first.score || 0));
    })[0] || null;
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
      const simplifiedQuery = cleanQuery
        .replace(/\b(entreprise|entreprises|société|societe|company|site|magasin|restaurant|landais|landaise|français|francaise)\b/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      const lookupQueries = [...new Set([cleanQuery, simplifiedQuery].filter((value) => value.length >= 3))];
      const lookups = await Promise.all(lookupQueries.flatMap((lookupQuery) => [
        searchWikidata(lookupQuery, signal),
        searchWikipedia(lookupQuery, signal),
        searchOpenStreetMap(lookupQuery, signal)
      ].map((request) => Promise.resolve(request).catch(() => null))));
      const candidate = chooseCandidate(lookups, cleanQuery);

      if (candidate) {
        const image = candidate.source === 'wikipedia'
          ? await fetchWikipediaImage(candidate.title, candidate.language, signal)
          : await fetchWikipediaImage(candidate.title, candidate.language || 'fr', signal);
        const kind = candidate.website ? 'site' : candidate.source === 'osm' && candidate.isBusiness ? 'site' : classifyEntity(candidate.description);
        result = {
          kind,
          title: candidate.title,
          country: candidate.country || '',
          admin: candidate.admin || candidate.description || 'Résultat reconnu',
          image,
          favicon: candidate.website ? getFavicon(candidate.website) : '',
          weather: null,
          target: candidate.website || '',
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
