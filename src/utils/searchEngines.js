export const DEFAULT_SEARCH_ENGINE_ID = 'google';
export const SEARCH_ENGINE_STORAGE_KEY = 'bluefox_search_engine_v1';
export const SAFE_SEARCH_STORAGE_KEY = 'bluefox_safe_search_v1';
export const CUSTOM_SEARCH_ENGINES_STORAGE_KEY = 'bluefox_custom_search_engines_v1';

const SAFE_SEARCH_PARAMS = {
  google: 'safe=active',
  bing: 'adlt=strict',
  duckduckgo: 'kp=1',
  qwant: 'safesearch=1',
  ecosia: 'safesearch=1',
  brave: 'safesearch=strict',
  yahoo: 'vm=r',
  kagi: 'safe=1',
  mojeek: 'safe=1'
};

export const SEARCH_ENGINES = [
  {
    id: 'google',
    name: 'Google',
    domain: 'google.com',
    template: 'https://www.google.com/search?q={query}',
    description: 'Le moteur de recherche web de Google et son index mondial.',
    strength: 'Rapidité et couverture générale du Web.'
  },
  {
    id: 'bing',
    name: 'Bing',
    domain: 'bing.com',
    template: 'https://www.bing.com/search?q={query}',
    description: 'Le moteur de recherche de Microsoft, avec recherche web, images et réponses assistées.',
    strength: 'Recherche visuelle et intégration aux services Microsoft.'
  },
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    domain: 'duckduckgo.com',
    template: 'https://duckduckgo.com/?q={query}',
    description: 'Un moteur de recherche centré sur la protection de la vie privée.',
    strength: 'Pas de profil public créé à partir de vos recherches.'
  },
  {
    id: 'qwant',
    name: 'Qwant',
    domain: 'qwant.com',
    template: 'https://www.qwant.com/?q={query}',
    description: 'Le moteur de recherche européen qui met en avant la confidentialité.',
    strength: 'Recherche privée et approche européenne.'
  },
  {
    id: 'ecosia',
    name: 'Ecosia',
    domain: 'ecosia.org',
    template: 'https://www.ecosia.org/search?q={query}',
    description: 'Le moteur de recherche qui finance des projets climatiques grâce à ses revenus.',
    strength: 'Un usage du Web associé à un impact environnemental.'
  },
  {
    id: 'brave',
    name: 'Brave Search',
    domain: 'search.brave.com',
    template: 'https://search.brave.com/search?q={query}',
    description: 'Le moteur de recherche de Brave, conçu autour de la vie privée et d’un index indépendant.',
    strength: 'Index indépendant et absence de profilage publicitaire.'
  },
  {
    id: 'startpage',
    name: 'Startpage',
    domain: 'startpage.com',
    template: 'https://www.startpage.com/sp/search?query={query}',
    description: 'Un service de recherche privée qui protège vos recherches personnelles.',
    strength: 'Résultats familiers avec une meilleure protection de la vie privée.'
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    domain: 'perplexity.ai',
    template: 'https://www.perplexity.ai/search?q={query}',
    description: 'Un moteur de réponse IA qui synthétise les informations du Web et cite ses sources.',
    strength: 'Réponses expliquées avec des sources consultables.'
  },
  {
    id: 'you',
    name: 'You.com',
    domain: 'you.com',
    template: 'https://you.com/search?q={query}',
    description: 'Un moteur de recherche IA qui combine recherche Web et assistants personnalisables.',
    strength: 'Recherche configurable avec des outils IA.'
  },
  {
    id: 'kagi',
    name: 'Kagi',
    domain: 'kagi.com',
    template: 'https://kagi.com/search?q={query}',
    description: 'Un moteur de recherche premium sans publicité ni suivi publicitaire.',
    strength: 'Expérience épurée et résultats sans publicité.'
  },
  {
    id: 'mojeek',
    name: 'Mojeek',
    domain: 'mojeek.com',
    template: 'https://www.mojeek.com/search?q={query}',
    description: 'Un moteur de recherche indépendant qui possède son propre index.',
    strength: 'Indépendance vis-à-vis des grands index et respect de la vie privée.'
  },
  {
    id: 'yahoo',
    name: 'Yahoo',
    domain: 'search.yahoo.com',
    template: 'https://search.yahoo.com/search?p={query}',
    description: 'Le portail Yahoo avec recherche Web, actualités et services associés.',
    strength: 'Recherche intégrée à l’écosystème Yahoo.'
  },
  {
    id: 'wikipedia',
    name: 'Wikipédia',
    domain: 'fr.wikipedia.org',
    template: 'https://fr.wikipedia.org/w/index.php?search={query}',
    description: 'L’encyclopédie libre et collaborative de la Wikimedia Foundation.',
    strength: 'Connaissances de référence, articles détaillés et sources citées.'
  },
  {
    id: 'yandex',
    name: 'Yandex',
    domain: 'yandex.com',
    template: 'https://yandex.com/search/?text={query}',
    description: 'Un moteur international avec recherche Web, images et actualités.',
    strength: 'Recherche multimédia et couverture internationale.'
  },
  {
    id: 'baidu',
    name: 'Baidu',
    domain: 'baidu.com',
    template: 'https://www.baidu.com/s?wd={query}',
    description: 'Le moteur de recherche généraliste le plus utilisé en Chine.',
    strength: 'Résultats et services adaptés au Web chinois.'
  },
  {
    id: 'naver',
    name: 'Naver',
    domain: 'naver.com',
    template: 'https://search.naver.com/search.naver?query={query}',
    description: 'Le portail et moteur de recherche sud-coréen.',
    strength: 'Recherche locale et contenus coréens.'
  },
  {
    id: 'swisscows',
    name: 'Swisscows',
    domain: 'swisscows.com',
    template: 'https://swisscows.com/en/web?query={query}',
    description: 'Un moteur européen axé sur la confidentialité et la protection familiale.',
    strength: 'Recherche privée avec filtrage familial.'
  },
  {
    id: 'metager',
    name: 'MetaGer',
    domain: 'metager.org',
    template: 'https://metager.org/meta/meta.ger3?eingabe={query}',
    description: 'Un métamoteur allemand qui combine plusieurs sources de recherche.',
    strength: 'Résultats issus de plusieurs moteurs et respect de la vie privée.'
  },
  {
    id: 'wolframalpha',
    name: 'WolframAlpha',
    domain: 'wolframalpha.com',
    template: 'https://www.wolframalpha.com/input?i={query}',
    description: 'Un moteur computationnel pour obtenir des réponses calculées.',
    strength: 'Calculs, données scientifiques et réponses structurées.'
  },
  {
    id: 'ask',
    name: 'Ask.com',
    domain: 'ask.com',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Ask.com_Logo.svg',
    template: 'https://www.ask.com/web?q={query}',
    description: 'Un moteur généraliste orienté questions et réponses.',
    strength: 'Recherche formulée sous forme de questions.'
  },
  {
    id: 'yep',
    name: 'Yep',
    domain: 'yep.com',
    template: 'https://yep.com/web?q={query}',
    description: 'Un moteur indépendant qui met en avant la confidentialité.',
    strength: 'Recherche Web sans profilage publicitaire personnalisé.'
  }
];

export const readCustomSearchEngines = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(CUSTOM_SEARCH_ENGINES_STORAGE_KEY) || '[]');
    return Array.isArray(stored) ? stored.filter((engine) => engine?.id && engine?.name && engine?.domain && engine?.template) : [];
  } catch {
    return [];
  }
};

export const getSearchEngines = () => [...SEARCH_ENGINES, ...readCustomSearchEngines()];

const SEARCH_ENGINE_ORIGINS = {
  google: 'US',
  bing: 'US',
  duckduckgo: 'US',
  qwant: 'FR',
  ecosia: 'DE',
  brave: 'US',
  startpage: 'NL',
  perplexity: 'US',
  you: 'US',
  kagi: 'CH',
  mojeek: 'GB',
  yahoo: 'US',
  wikipedia: 'US',
  yandex: 'RU',
  baidu: 'CN',
  naver: 'KR',
  swisscows: 'CH',
  metager: 'DE',
  wolframalpha: 'US',
  ask: 'US',
  yep: 'US'
};

export const getSearchEngineOrigin = (engine, language = 'fr') => {
  if (engine.isCustom) return language.startsWith('en') ? 'Custom' : 'Personnalisé';
  const region = SEARCH_ENGINE_ORIGINS[engine.id];
  if (!region) return language.startsWith('en') ? 'International' : 'International';
  try { return new Intl.DisplayNames([language.startsWith('en') ? 'en-US' : 'fr-FR'], { type: 'region' }).of(region) || region; } catch { return region; }
};

export const addCustomSearchEngine = ({ name, template }) => {
  const parsedUrl = new URL(template.replace('{query}', 'bluefox'));
  if (!/^https?:$/i.test(parsedUrl.protocol) || !template.includes('{query}')) throw new Error('URL de recherche invalide');
  const customEngine = {
    id: `custom-${Date.now()}`,
    name: name.trim(),
    domain: parsedUrl.hostname,
    template: template.trim(),
    description: 'Moteur de recherche personnalisé ajouté localement.',
    strength: 'URL personnalisée pour vos recherches.',
    isCustom: true
  };
  const nextEngines = [...readCustomSearchEngines(), customEngine];
  localStorage.setItem(CUSTOM_SEARCH_ENGINES_STORAGE_KEY, JSON.stringify(nextEngines));
  window.dispatchEvent(new CustomEvent('bluefox-search-engines-changed'));
  return customEngine;
};

export const getSearchEngine = (id) => getSearchEngines().find((engine) => engine.id === id) || SEARCH_ENGINES[0];

export const extractSearchQuery = (url) => {
  try {
    const parsedUrl = new URL(url);
    const knownEngine = getSearchEngines().find((engine) => parsedUrl.hostname === engine.domain || parsedUrl.hostname.endsWith(`.${engine.domain}`));
    if (!knownEngine) return '';
    return parsedUrl.searchParams.get('q')
      || parsedUrl.searchParams.get('query')
      || parsedUrl.searchParams.get('p')
      || parsedUrl.searchParams.get('search')
      || '';
  } catch {
    return '';
  }
};

export const buildSearchUrl = (engineId, query, safeSearchEnabled = true) => {
  const engine = getSearchEngine(engineId);
  const selectedLanguage = (() => {
    try { return localStorage.getItem('bluefox_language')?.startsWith('en') ? 'en' : 'fr'; } catch { return 'fr'; }
  })();
  let template = engine.template;
  if (engine.id === 'wikipedia' && selectedLanguage === 'en') template = 'https://en.wikipedia.org/w/index.php?search={query}';
  const url = template.replace('{query}', encodeURIComponent(query));
  const safeParam = safeSearchEnabled ? SAFE_SEARCH_PARAMS[engine.id] : '';
  const languageParam = selectedLanguage === 'en'
    ? ({
      google: 'hl=en&lr=lang_en',
      bing: 'setlang=en-US',
      duckduckgo: 'kl=us-en',
      qwant: 'locale=en_US',
      ecosia: 'language=en',
      brave: 'language=en',
      yahoo: 'b=1&guccounter=1'
    }[engine.id] || '')
    : '';
  const params = [safeParam, languageParam].filter(Boolean).join('&');
  return params ? `${url}${url.includes('?') ? '&' : '?'}${params}` : url;
};

export const getSearchEngineIcon = (engine) => engine.icon || `https://www.google.com/s2/favicons?domain=${engine.domain}&sz=64`;
