import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaDiscord } from 'react-icons/fa';
import { MdApps, MdAutoAwesome, MdClose, MdLocationOn, MdNorthEast, MdPalette, MdPublic, MdSearch, MdWbSunny } from 'react-icons/md';
import { useTheme } from '../utils/theme.js';
import { DEFAULT_SEARCH_ENGINE_ID, getSearchEngine, getSearchEngineIcon, SEARCH_ENGINE_STORAGE_KEY } from '../utils/searchEngines.js';
import { SiteSuggestionIcon, useSearchSuggestions } from '../utils/searchSuggestions.js';

const GDELT_API = 'https://api.gdeltproject.org/api/v2/doc/doc';
const NEWS_CACHE_KEY = 'bluefox_news_cache_v3';
const NEWS_CACHE_MAX_AGE = 15 * 60 * 1000;
const NEWS_MAX_AGE = 36 * 60 * 60 * 1000;
const NEWS_LANGUAGE_CONFIG = {
  fr: { query: 'sourcelang:french', sourceLanguage: 'french' },
  en: { query: 'sourcelang:english', sourceLanguage: 'english' }
};
const getNewsCacheKey = (language) => `${NEWS_CACHE_KEY}_${language}`;
const GDELT_MAX_RECORDS = 250;

// Only show established editorial sources instead of arbitrary sites surfaced by GDELT.
const TRUSTED_NEWS_SOURCES = [
  ['leparisien.fr', 'Le Parisien'],
  ['lachainemeteo.com', 'La Chaîne Météo'],
  ['france24.com', 'France 24'],
  ['rfi.fr', 'RFI'],
  ['francetvinfo.fr', 'franceinfo'],
  ['20minutes.fr', '20 Minutes'],
  ['lemonde.fr', 'Le Monde'],
  ['lefigaro.fr', 'Le Figaro'],
  ['liberation.fr', 'Libération'],
  ['bfmtv.com', 'BFMTV'],
  ['lesechos.fr', 'Les Échos'],
  ['ouest-france.fr', 'Ouest-France'],
  ['sudouest.fr', 'Sud Ouest'],
  ['ladepeche.fr', 'La Dépêche'],
  ['lavoixdunord.fr', 'La Voix du Nord'],
  ['leprogres.fr', 'Le Progrès'],
  ['actu.fr', 'Actu.fr'],
  ['rtl.fr', 'RTL'],
  ['radiofrance.fr', 'Radio France'],
  ['francebleu.fr', 'France Bleu'],
  ['europe1.fr', 'Europe 1'],
  ['courrierinternational.com', 'Courrier international'],
  ['lexpress.fr', "L'Express"],
  ['lepoint.fr', 'Le Point'],
  ['marianne.net', 'Marianne'],
  ['numerama.com', 'Numerama'],
  ['futura-sciences.com', 'Futura'],
  ['lesnumeriques.com', 'Les Numériques'],
  ['01net.com', '01net'],
  ['frandroid.com', 'Frandroid'],
  ['euronews.com', 'Euronews'],
  ['bbc.com', 'BBC'],
  ['bbc.co.uk', 'BBC'],
  ['cnn.com', 'CNN'],
  ['reuters.com', 'Reuters'],
  ['apnews.com', 'Associated Press'],
  ['theguardian.com', 'The Guardian'],
  ['nytimes.com', 'The New York Times'],
  ['washingtonpost.com', 'The Washington Post'],
  ['npr.org', 'NPR'],
  ['techcrunch.com', 'TechCrunch'],
  ['wired.com', 'Wired'],
  ['nationalgeographic.com', 'National Geographic'],
  ['cnbc.com', 'CNBC'],
  ['time.com', 'TIME']
];

const getTrustedNewsSource = (domain = '') => {
  const normalizedDomain = domain.toLowerCase();
  return TRUSTED_NEWS_SOURCES.find(([trustedDomain]) => (
    normalizedDomain === trustedDomain || normalizedDomain.endsWith(`.${trustedDomain}`)
  ));
};

const hasUsableArticleTitle = (title, link = '') => {
  const normalizedTitle = stripHtml(title);
  const normalizedLink = link.toLowerCase();
  const titleKey = normalizedTitle.toLowerCase().replace(/[\\W_]+/g, '');
  const linkKey = normalizedLink.replace(/[\\W_]+/g, '');
  const genericTitle = /^(article|actualite|actualites|news|sans titre|untitled)$/i.test(normalizedTitle);

  return normalizedTitle.length >= 20
    && /[a-zà-ÿ]{4}/i.test(normalizedTitle)
    && !genericTitle
    && !linkKey.endsWith(titleKey);
};

const DEFAULT_SHORTCUTS = [
  { title: 'Google', url: 'https://www.google.com' },
  { title: 'YouTube', url: 'https://www.youtube.com' },
  { title: 'Yahoo Mail', url: 'https://mail.yahoo.com' },
  { title: 'Facebook', url: 'https://www.facebook.com' },
  { title: 'Google Maps', url: 'https://maps.google.com' },
  { title: 'Amazon', url: 'https://www.amazon.fr' },
  { title: 'Netflix', url: 'https://www.netflix.com' },
  { title: 'Nookup', url: 'https://nookup.me/', iconUrl: 'https://nookup.me/assets/favicon.png', isSponsored: true },
  { title: 'Météo-France', url: 'https://meteofrance.com' }
];
const HOME_SHORTCUTS_KEY = 'bluefox_home_shortcuts_v1';
const HOME_BACKGROUND_KEY = 'bluefox_home_background_v1';
const DEFAULT_HOME_BACKGROUND = '';
const HOME_TAB_COLOR_KEY = 'bluefox_home_tab_color_v1';
const DEFAULT_HOME_TAB_COLOR = '#f3f2f0';

const normalizeHomeShortcut = (shortcut) => {
  const candidate = Array.isArray(shortcut)
    ? { title: shortcut[0], url: shortcut[1], iconUrl: shortcut[2], isSponsored: shortcut[3] }
    : shortcut;
  const title = String(candidate?.title || '').trim().slice(0, 80);
  const url = String(candidate?.url || '').trim();
  if (!title || !/^https?:\/\//i.test(url)) return null;
  return {
    title,
    url,
    iconUrl: String(candidate?.iconUrl || '').trim(),
    isSponsored: Boolean(candidate?.isSponsored)
  };
};

const readHomeBackground = () => {
  try {
    return localStorage.getItem(HOME_BACKGROUND_KEY) || DEFAULT_HOME_BACKGROUND;
  } catch {
    return DEFAULT_HOME_BACKGROUND;
  }
};

const readHomeShortcuts = () => {
  try {
    const stored = localStorage.getItem(HOME_SHORTCUTS_KEY);
    if (stored === null) return DEFAULT_SHORTCUTS;
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return DEFAULT_SHORTCUTS;
    return parsed.map(normalizeHomeShortcut).filter(Boolean);
  } catch {
    return DEFAULT_SHORTCUTS;
  }
};

const getFaviconUrl = (url) => {
  try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=128`; } catch { return ''; }
};

const stripHtml = (value = '') => {
  const element = document.createElement('div');
  element.innerHTML = value;
  return (element.textContent || '').replace(/\s+/g, ' ').trim();
};

const getArticleImage = (item) => item.socialimage || item.image || item.thumbnail || item.enclosure?.thumbnail || item.enclosure?.link || '';

const parseGdeltDate = (value) => {
  const match = String(value || '').match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/);
  if (match) return Date.parse(`${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}Z`);
  const parsed = Date.parse(value || '');
  return Number.isNaN(parsed) ? 0 : parsed;
};

const getArticleDomain = (url, fallback = 'Source inconnue') => {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return fallback; }
};

const diversifyArticles = (loadedArticles) => {
  const articlesByDomain = new Map();
  loadedArticles.forEach((article) => {
    const domain = article.domain || getArticleDomain(article.link);
    const domainArticles = articlesByDomain.get(domain) || [];
    domainArticles.push({ ...article, domain });
    articlesByDomain.set(domain, domainArticles);
  });

  const diversified = [];
  for (let index = 0; ; index += 1) {
    let addedArticle = false;
    articlesByDomain.forEach((domainArticles) => {
      if (domainArticles[index]) {
        diversified.push(domainArticles[index]);
        addedArticle = true;
      }
    });
    if (!addedArticle) break;
  }
  return diversified;
};

const hideArticleImage = (event) => {
  event.currentTarget.style.display = 'none';
};

const QuickLinkFavicon = ({ url, fallback: Fallback }) => {
  const [hasError, setHasError] = useState(false);
  if (hasError) return <Fallback className="text-[24px]" aria-hidden="true" />;
  return <img src={getFaviconUrl(url)} alt="" className="h-7 w-7 object-contain" onError={() => setHasError(true)} />;
};

const FavoriteTile = ({ title, url, iconUrl, isSponsored, onNavigate }) => {
  const { t } = useTranslation('common');
  const logo = iconUrl || getFaviconUrl(url);
  const domain = title;
  const [faviconError, setFaviconError] = useState(false);

  useEffect(() => {
    setFaviconError(false);
  }, [logo]);

  return (
    <button type="button" onClick={() => onNavigate(url)} aria-label={`${title}${isSponsored ? ` · ${t('home.sponsored')}` : ''}`} className="bluefox-home-favorite-tile bluefox-image-favorite-tile group flex min-w-0 flex-col items-center gap-1.5 rounded-[10px] p-2 text-center text-[#202124] transition-colors duration-200 hover:bg-[#e8e8e8]">
      <span className="bluefox-home-favorite-icon bluefox-image-favorite-icon flex h-[60px] w-[60px] items-center justify-center rounded-[9px] border border-[#e3e3e6] bg-[#f7f7f8] p-3 shadow-none transition-colors duration-200 group-hover:bg-[#eeeeef]">
        {faviconError ? <MdPublic className="h-8 w-8 text-[#6d747b]" aria-label="" /> : <img src={logo} alt="" className="h-full w-full object-contain" onError={() => setFaviconError(true)} />}
      </span>
      <span className="max-w-[100px] truncate text-[11px] font-medium text-[#55565b] group-hover:text-[#202124]">{domain}</span>
      {isSponsored && <span className="bluefox-home-favorite-sponsored">{t('home.sponsored')}</span>}
    </button>
  );
};

const SuggestionCard = ({ article }) => (
  <a
    href={article.link}
    target="_blank"
    rel="noreferrer"
    className="group bluefox-article-card relative flex h-[96px] min-w-0 items-center overflow-hidden rounded-[10px] border border-[#e3e3e6] bg-[#f8f8f9] px-3.5 text-left text-[#202124] shadow-none transition-colors duration-200 hover:bg-[#f0f0f1]">
    <div className="min-w-0 flex-1 pr-16">
      <p className="bluefox-article-title line-clamp-2 text-[13px] font-medium leading-[1.35] text-[#292a2d] transition-colors duration-200 group-hover:text-[#164e86]">{article.title}</p>
      <span className="bluefox-article-source mt-2 flex items-center gap-1.5 truncate text-[11px] text-[#77787c]">
        <img src={article.logo || getFaviconUrl(article.link)} alt="" className="h-4 w-4 shrink-0 rounded-[3px] object-contain" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
        <span className="truncate">{article.source}</span>
      </span>
    </div>
    <div className="absolute right-2.5 flex h-14 w-14 items-center justify-center overflow-hidden rounded-[6px] border border-[#e1e1e4] bg-white p-1.5">
      {article.image ? <img src={article.image} alt="" loading="lazy" onError={hideArticleImage} className="h-full w-full rounded-[4px] object-cover" /> : <img src={article.logo || getFaviconUrl(article.link)} alt={article.source || ''} className="h-8 w-8 object-contain" onError={hideArticleImage} />}
    </div>
  </a>
);

const SpeedDial = ({ onNavigate, onAskFoxy, tabColor, onTabColorChange, isPersonalizationOpen = false, onPersonalizationChange, homeBackground }) => {
  const { resolvedTheme } = useTheme();
  const { t, i18n } = useTranslation('common');
  const selectedNewsLanguage = i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'fr';
  const [shortcuts, setShortcuts] = useState(readHomeShortcuts);
  const [homeSearch, setHomeSearch] = useState('');
  const [searchEngineId, setSearchEngineId] = useState(() => localStorage.getItem(SEARCH_ENGINE_STORAGE_KEY) || DEFAULT_SEARCH_ENGINE_ID);
  const [isHomeSearchFocused, setIsHomeSearchFocused] = useState(false);
  const [homeSearchFocusOffset, setHomeSearchFocusOffset] = useState(12);
  const [articles, setArticles] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState(false);
  const [articleOffset, setArticleOffset] = useState(0);
  const [isQuickLinksOpen, setIsQuickLinksOpen] = useState(false);
  const [isQuickLinksVisible, setIsQuickLinksVisible] = useState(false);
  const [isQuickLinksClosing, setIsQuickLinksClosing] = useState(false);
  const quickLinksRef = useRef(null);
  const quickLinksCloseTimer = useRef(null);
  const homeFavoritesRef = useRef(null);
  const homeSearchRef = useRef(null);
  const requestInFlight = useRef(false);

  const openQuickLinks = () => {
    if (quickLinksCloseTimer.current) {
      window.clearTimeout(quickLinksCloseTimer.current);
      quickLinksCloseTimer.current = null;
    }
    setIsQuickLinksClosing(false);
    setIsQuickLinksVisible(true);
    setIsQuickLinksOpen(true);
  };

  const closeQuickLinks = () => {
    if (!isQuickLinksVisible || isQuickLinksClosing) return;
    setIsQuickLinksOpen(false);
    setIsQuickLinksClosing(true);
    quickLinksCloseTimer.current = window.setTimeout(() => {
      setIsQuickLinksVisible(false);
      setIsQuickLinksClosing(false);
      quickLinksCloseTimer.current = null;
    }, 180);
  };

  useEffect(() => {
    if (!isQuickLinksOpen) return undefined;

    const handleOutsidePointerDown = (event) => {
      if (!quickLinksRef.current?.contains(event.target)) {
        closeQuickLinks();
      }
    };

    document.addEventListener('pointerdown', handleOutsidePointerDown);
    return () => document.removeEventListener('pointerdown', handleOutsidePointerDown);
  }, [isQuickLinksOpen, isQuickLinksVisible, isQuickLinksClosing]);

  useEffect(() => () => {
    if (quickLinksCloseTimer.current) window.clearTimeout(quickLinksCloseTimer.current);
  }, []);

  useEffect(() => {
    if (!isHomeSearchFocused) return undefined;

    const handleHomeSearchOutsidePointerDown = (event) => {
      if (!homeSearchRef.current?.contains(event.target)) {
        setIsHomeSearchFocused(false);
        setHomeSearch('');
        clearHomeSuggestions();
      }
    };

    document.addEventListener('pointerdown', handleHomeSearchOutsidePointerDown);
    return () => document.removeEventListener('pointerdown', handleHomeSearchOutsidePointerDown);
  }, [isHomeSearchFocused]);

  useEffect(() => {
    const handleSearchEngineChange = (event) => {
      setSearchEngineId(event.detail || DEFAULT_SEARCH_ENGINE_ID);
    };
    window.addEventListener('bluefox-search-engine-changed', handleSearchEngineChange);
    return () => window.removeEventListener('bluefox-search-engine-changed', handleSearchEngineChange);
  }, []);

  useEffect(() => {
    const publishShortcuts = () => {
      localStorage.setItem(HOME_SHORTCUTS_KEY, JSON.stringify(shortcuts));
      window.electron?.updateHomeShortcuts?.(shortcuts);
    };
    publishShortcuts();
  }, [shortcuts]);

  useEffect(() => {
    const refreshShortcuts = () => setShortcuts(readHomeShortcuts());
    window.addEventListener('storage', refreshShortcuts);
    window.addEventListener('bluefox-home-shortcuts-changed', refreshShortcuts);
    return () => {
      window.removeEventListener('storage', refreshShortcuts);
      window.removeEventListener('bluefox-home-shortcuts-changed', refreshShortcuts);
    };
  }, []);

  const normalizeArticles = (loadedArticles, language = selectedNewsLanguage) => {
    const uniqueArticles = Array.from(
      new Map(loadedArticles.filter((article) => article.link).map((article) => [article.link, article])).values()
    ).filter((article) => {
      const age = Date.now() - (article.date || 0);
      return hasUsableArticleTitle(article.title, article.link)
        && article.language?.toLowerCase() === NEWS_LANGUAGE_CONFIG[language].sourceLanguage
        && age >= 0
        && age <= NEWS_MAX_AGE;
    }).map((article) => ({
      ...article,
      source: getTrustedNewsSource(article.domain || getArticleDomain(article.link, ''))?.[1] || article.domain || getArticleDomain(article.link)
    })).sort((first, second) => second.date - first.date);

    return diversifyArticles(uniqueArticles);
  };

  const readNewsCache = (language = selectedNewsLanguage) => {
    try {
      const cached = JSON.parse(localStorage.getItem(getNewsCacheKey(language)) || 'null');
      if (!cached?.articles?.length) return null;
      return cached;
    } catch {
      return null;
    }
  };

  const saveNewsCache = (nextArticles, language = selectedNewsLanguage) => {
    try {
      localStorage.setItem(getNewsCacheKey(language), JSON.stringify({ savedAt: Date.now(), language, articles: nextArticles.slice(0, 120) }));
    } catch {
      // News remain available for the current session when storage is unavailable.
    }
  };

  const loadNews = async () => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    const languageConfig = NEWS_LANGUAGE_CONFIG[selectedNewsLanguage];
    const cached = readNewsCache(selectedNewsLanguage);
    const cachedArticles = normalizeArticles(cached?.articles || [], selectedNewsLanguage);

    if (cachedArticles.length) {
      setArticles(cachedArticles);
      setNewsLoading(false);
      setNewsError(false);
    } else {
      setNewsLoading(true);
      setNewsError(false);
    }

    try {
      // GDELT is free/open data; the language query and 24h window keep results recent and localized.
      if (cached && cachedArticles.length && Date.now() - cached.savedAt < NEWS_CACHE_MAX_AGE) return;

      const params = new URLSearchParams({
        query: languageConfig.query,
        mode: 'artlist',
        format: 'json',
        maxrecords: String(GDELT_MAX_RECORDS),
        sort: 'datedesc',
        timespan: '24h'
      });
      const response = await fetch(`${GDELT_API}?${params.toString()}`);
      if (!response.ok) throw new Error(`GDELT request failed: ${response.status}`);

      const data = await response.json();
      const loadedArticles = (data.articles || []).map((item) => {
        const link = item.url || item.url_mobile || '';
        const domain = getArticleDomain(link, item.domain);
        const trustedSource = getTrustedNewsSource(domain);
        return {
          id: `${domain}-${link}`,
          title: stripHtml(item.title),
          link,
          image: getArticleImage(item),
          source: trustedSource?.[1] || domain,
          domain,
          logo: getFaviconUrl(link),
          language: item.language,
          date: parseGdeltDate(item.seendate || item.date)
        };
      });
      const uniqueArticles = normalizeArticles([...cachedArticles, ...loadedArticles], selectedNewsLanguage);

      if (!uniqueArticles.length) throw new Error(`No ${languageConfig.sourceLanguage} articles returned by GDELT`);
      setArticles(uniqueArticles);
      saveNewsCache(uniqueArticles, selectedNewsLanguage);
      setNewsError(false);
      setArticleOffset((currentOffset) => currentOffset % uniqueArticles.length);
    } catch {
      // Cached articles remain visible when GDELT is temporarily unavailable.
      setNewsError(!cachedArticles.length);
    } finally {
      setNewsLoading(false);
      requestInFlight.current = false;
    }
  };

  useEffect(() => {
    let refreshTimer;
    const loadWhenIdle = () => {
      void loadNews();
      refreshTimer = setInterval(() => { void loadNews(); }, NEWS_CACHE_MAX_AGE);
    };
    const idleHandle = typeof window.requestIdleCallback === 'function'
      ? window.requestIdleCallback(loadWhenIdle, { timeout: 1500 })
      : window.setTimeout(loadWhenIdle, 250);

    return () => {
      if (typeof window.cancelIdleCallback === 'function' && typeof idleHandle === 'number') {
        window.cancelIdleCallback(idleHandle);
      } else {
        window.clearTimeout(idleHandle);
      }
      if (refreshTimer) clearInterval(refreshTimer);
    };
  }, [selectedNewsLanguage]);

  const visibleSuggestions = articles.length > 0
    ? Array.from({ length: Math.min(9, articles.length) }, (_, index) => articles[(articleOffset + index) % articles.length])
    : [];

  const {
    suggestions: homeSuggestions,
    smartSuggestion: homeSmartSuggestion,
    isLoading: isHomeSuggestionsLoading,
    highlightedIndex: homeHighlightedIndex,
    highlightedSuggestion: homeHighlightedSuggestion,
    moveHighlight: moveHomeHighlight,
    clearSuggestions: clearHomeSuggestions
  } = useSearchSuggestions({ query: homeSearch, focused: isHomeSearchFocused, searchEngineId });

  const activateHomeSearch = () => {
    if (!isHomeSearchFocused) {
      const favorites = homeFavoritesRef.current;
      if (favorites) {
        const styles = window.getComputedStyle(favorites);
        const marginBottom = Number.parseFloat(styles.marginBottom) || 0;
        setHomeSearchFocusOffset(favorites.getBoundingClientRect().height + marginBottom + 12);
      }
      setHomeSearch('');
    }
    setIsHomeSearchFocused(true);
  };

  const submitHomeSearchValue = (value) => {
    const query = String(value || '').trim();
    if (!query) return;
    setIsHomeSearchFocused(false);
    clearHomeSuggestions();
    onNavigate(query);
  };

  const submitHomeSearchSuggestion = (suggestion) => {
    if (!suggestion) return;
    setHomeSearch(suggestion.label || homeSearch);
    submitHomeSearchValue(suggestion.value || suggestion.searchQuery || homeSearch);
  };

  const handleHomeSearchKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      moveHomeHighlight(event.key === 'ArrowDown' ? 1 : -1);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      clearHomeSuggestions();
      setIsHomeSearchFocused(false);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      submitHomeSearchValue(homeHighlightedSuggestion?.value || homeSearch);
    }
  };

  const submitHomeSearch = (event) => {
    event.preventDefault();
    submitHomeSearchValue(homeSearch);
  };
  const activeSearchEngine = getSearchEngine(searchEngineId);
  const activeSearchEngineIcon = getSearchEngineIcon(activeSearchEngine);

  return (
    <div
      className={`bluefox-reference-home relative h-full w-full overflow-y-auto bg-white text-[#202124] ${homeBackground ? 'bluefox-home-customized' : ''}`}
      style={homeBackground ? { '--bluefox-home-background': homeBackground } : undefined}
    >
      <button
        type="button"
        onClick={() => onPersonalizationChange?.(!isPersonalizationOpen)}
        className={`bluefox-home-floating-button bluefox-image-glass-control bluefox-customize-trigger fixed bottom-5 z-40 flex h-10 w-10 items-center justify-center rounded-full border bg-white/90 shadow-[0_5px_18px_rgba(32,33,36,0.18)] backdrop-blur-sm transition-[right,transform,background-color,color] duration-300 hover:bg-[#f0efed] ${isPersonalizationOpen ? 'bluefox-customize-trigger-open' : ''}`}
        aria-label={isPersonalizationOpen ? t('personalization.close') : t('personalization.customize')}
        title={t('personalization.customize')}
      >
        <MdPalette className="bluefox-home-control-icon text-[21px]" />
      </button>

      <div ref={quickLinksRef} className="absolute right-5 top-4 z-30">
        <button
          type="button"
          onClick={() => (isQuickLinksOpen ? closeQuickLinks() : openQuickLinks())}
          className="bluefox-home-floating-button bluefox-image-glass-control flex h-9 w-9 items-center justify-center rounded-full border border-[#d8d7d4] bg-white/90 text-[#55565b] shadow-sm backdrop-blur-sm transition-colors hover:bg-[#f0efed] hover:text-[#202124]"
          aria-label={isQuickLinksOpen ? t('home.closeLinks') : t('home.openLinks')}
          aria-expanded={isQuickLinksOpen}
          title={t('topbar.addons')}
        >
          {isQuickLinksOpen ? <MdClose className="text-[20px]" /> : <MdApps className="text-[20px]" />}
        </button>

        {isQuickLinksVisible && (
          <div className={`bluefox-home-quick-links absolute right-0 top-11 ${isQuickLinksClosing ? 'is-closing' : ''}`}>
            <div className="bluefox-home-quick-links-heading">{t('topbar.addons')}</div>
            <div className="bluefox-home-quick-links-grid">
              <button type="button" onClick={() => { onNavigate('https://discord.gg/z3bUt3hCya'); closeQuickLinks(); }} className="bluefox-home-quick-link" aria-label={t('topbar.connectedWithDiscord')}>
                <span className="bluefox-home-quick-link-icon discord"><QuickLinkFavicon url="https://discord.gg/z3bUt3hCya" fallback={FaDiscord} /></span>
                <span className="bluefox-home-quick-link-label">Discord</span>
              </button>
              <button type="button" onClick={() => { onNavigate('https://bluefoxbrowser.pages.dev/'); closeQuickLinks(); }} className="bluefox-home-quick-link" aria-label={t('topbar.downloads')}>
                <span className="bluefox-home-quick-link-icon download"><img src={`${import.meta.env.BASE_URL}Logo.ico`} alt="BlueFox" className="h-7 w-7 object-contain" /></span>
                <span className="bluefox-home-quick-link-label">{t('topbar.downloads')}</span>
              </button>
              <button type="button" onClick={() => { onNavigate('https://bluefox-add-ons.pages.dev/'); closeQuickLinks(); }} className="bluefox-home-quick-link" aria-label={t('topbar.addons')}>
                <span className="bluefox-home-quick-link-icon extensions"><img src={`${import.meta.env.BASE_URL}Logo.ico`} alt="BlueFox" className="h-7 w-7 object-contain" /></span>
                <span className="bluefox-home-quick-link-label">{t('home.extensions')}</span>
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="mx-auto flex min-h-full w-full max-w-[1040px] flex-col px-6 py-8 sm:px-10 sm:py-10">
        <section ref={homeFavoritesRef} className={`bluefox-home-favorites mb-8 ${isHomeSearchFocused ? 'is-search-hidden' : ''}`}>
          <h1 className="mb-5 text-[21px] font-semibold tracking-[-0.02em] text-[#202124]">{t('home.favorites')}</h1>
          <div className="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-9 sm:gap-x-4">
            {shortcuts.map(({ title, url, iconUrl, isSponsored }) => <FavoriteTile key={url} title={title} url={url} iconUrl={iconUrl} isSponsored={isSponsored} onNavigate={onNavigate} />)}
          </div>
        </section>

        <section ref={homeSearchRef} style={{ '--bluefox-home-search-focus-offset': `${homeSearchFocusOffset}px` }} className={`bluefox-home-search-section ${resolvedTheme === 'dark' ? 'is-dark' : ''} mb-10 ${isHomeSearchFocused ? 'is-focused' : ''}`}>
          <form className="bluefox-home-search-bar" onSubmit={submitHomeSearch}>

            <input
              type="text"
              value={homeSearch}
              onChange={(event) => setHomeSearch(event.target.value)}
              onKeyDown={handleHomeSearchKeyDown}
              placeholder={t('topbar.addressPlaceholders.0')}
              aria-label={t('home.searchWeb')}
              onFocus={activateHomeSearch}
            />
            <button type="submit" aria-label={t('topbar.search')} title={`Rechercher avec ${activeSearchEngine.name}`}>
              <img src={activeSearchEngineIcon} alt={activeSearchEngine.name} title={`Rechercher avec ${activeSearchEngine.name}`} />
            </button>
          </form>
          {isHomeSearchFocused && (homeSearch.trim() || homeSuggestions.length > 0 || homeSmartSuggestion || isHomeSuggestionsLoading) && (
            <div className="bluefox-home-search-results" role="listbox" aria-label={t('home.suggestions')}>
              {homeSearch.trim() && (
                <button
                  type="button"
                  role="option"
                  aria-selected="false"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => submitHomeSearchValue(homeSearch)}
                >
                  <MdNorthEast aria-hidden="true" />
                  <span><strong>{homeSearch.trim()}</strong></span>
                </button>
              )}
              {homeSmartSuggestion && <button
                type="button"
                className={`bluefox-home-smart-result ${homeHighlightedIndex === 0 ? 'is-highlighted' : ''}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => submitHomeSearchValue(homeSmartSuggestion.target || homeSmartSuggestion.searchQuery || homeSearch)}
              >
                <span className="bluefox-address-smart-image">
                  {homeSmartSuggestion.kind === 'weather' && !homeSmartSuggestion.favicon && !homeSmartSuggestion.image ? (
                    <MdLocationOn aria-hidden="true" />
                  ) : (
                    <SiteSuggestionIcon
                      src={homeSmartSuggestion.favicon || homeSmartSuggestion.image}
                      imageClassName="relative z-[1] h-full w-full object-cover"
                      fallbackClassName="bluefox-address-smart-fallback"
                    />
                  )}
                </span>
                <span className="bluefox-address-smart-copy">
                  <small>{homeSmartSuggestion.kind === 'site' ? t('home.site') : homeSmartSuggestion.kind === 'weather' ? t('home.weather') : homeSmartSuggestion.kind === 'person' ? t('home.person') : homeSmartSuggestion.kind === 'game' ? t('home.game') : homeSmartSuggestion.kind === 'subject' ? t('home.subject') : t('home.recognized')}</small>
                  <strong>{homeSmartSuggestion.title}{homeSmartSuggestion.country ? ` · ${homeSmartSuggestion.country}` : ''}</strong>
                  <span>{homeSmartSuggestion.weather?.temperature !== null && homeSmartSuggestion.weather ? `${homeSmartSuggestion.weather.temperature} °C · ${homeSmartSuggestion.weather.description}` : homeSmartSuggestion.admin || t('home.seeWeb')}</span>
                </span>
                {homeSmartSuggestion.weather ? <MdWbSunny className="bluefox-address-smart-status" aria-hidden="true" /> : <MdNorthEast className="bluefox-address-smart-status" aria-hidden="true" />}
              </button>}
              {homeSuggestions.map((suggestion, index) => (
                <button
                  type="button"
                  key={suggestion.id}
                  role="option"
                  aria-selected={homeHighlightedIndex === (homeSmartSuggestion ? index + 1 : index)}
                  className={homeHighlightedIndex === (homeSmartSuggestion ? index + 1 : index) ? 'is-highlighted' : ''}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => submitHomeSearchSuggestion(suggestion)}
                >
                  {suggestion.kind === 'history' ? (
                    <SiteSuggestionIcon
                      src={suggestion.favicon}
                      imageClassName="h-[19px] w-[19px] object-contain"
                      fallbackClassName="h-[19px] w-[19px] text-[#30343a]"
                    />
                  ) : (
                    <MdSearch aria-hidden="true" />
                  )}
                  <span><strong>{suggestion.label}</strong><small>{suggestion.kind === 'history' ? t('home.history') : suggestion.detail}</small></span>
                </button>
              ))}
              {isHomeSuggestionsLoading && <div className="bluefox-home-search-status" role="status">{t('topbar.searchSuggestionsLoading')}</div>}
              {homeSearch.trim() && <button
                type="button"
                className="bluefox-home-search-foxy-action"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  const question = homeSearch.trim();
                  setIsHomeSearchFocused(false);
                  clearHomeSuggestions();
                  onAskFoxy?.(question);
                }}
              >
                <MdAutoAwesome aria-hidden="true" />
                <span><strong>{t('topbar.askFoxy')}</strong><small>{t('topbar.aiMode')}</small></span>
              </button>}
            </div>
          )}
        </section>

        <section className={`bluefox-home-news ${isHomeSearchFocused ? 'is-search-hidden' : ''}`}>
          <h2 className="mb-4 text-[21px] font-semibold tracking-[-0.02em] text-[#202124]">{t('home.foxySuggestions')}</h2>
          {newsLoading && <div className="grid grid-cols-1 gap-3 md:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-[96px] animate-pulse rounded-[10px] border border-[#e6e6e8] bg-[#f7f7f8]" />)}</div>}
          {!newsLoading && visibleSuggestions.length > 0 && <div className="grid grid-cols-1 gap-3 md:grid-cols-3">{visibleSuggestions.map((article) => <SuggestionCard key={article.id} article={article} />)}</div>}
          {!newsLoading && newsError && <div className="rounded-[10px] border border-[#e3e3e6] bg-[#f8f8f9] px-4 py-4 text-sm text-[#66676c]">{t('home.noNews')}</div>}
        </section>
      </div>
    </div>
  );
};

export default SpeedDial;
