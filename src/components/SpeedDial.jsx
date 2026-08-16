import React, { useEffect, useRef, useState } from 'react';
import { FaDiscord } from 'react-icons/fa';
import { MdLanguage, MdMusicNote, MdSecurity } from 'react-icons/md';
import ThemeToggle from './ThemeToggle';

const GDELT_API = 'https://api.gdeltproject.org/api/v2/doc/doc';
const NEWS_CACHE_KEY = 'bluefox_news_cache_v2';
const NEWS_CACHE_MAX_AGE = 15 * 60 * 1000;
const NEWS_MAX_AGE = 36 * 60 * 60 * 1000;
const GDELT_QUERY = 'sourcelang:french';
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
  ['euronews.com', 'Euronews']
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

const FavoriteTile = ({ title, url, iconUrl, isSponsored, onNavigate }) => {
  const logo = iconUrl || getFaviconUrl(url);
  const domain = title;

  return (
    <button type="button" onClick={() => onNavigate(url)} aria-label={`${title}${isSponsored ? ' · Sponsorisé' : ''}`} className="group flex min-w-0 flex-col items-center gap-1.5 rounded-[10px] p-2 text-center text-[#202124] transition-colors duration-200 hover:bg-[#e8e8e8]">
      <span className="flex h-[60px] w-[60px] items-center justify-center rounded-[9px] border border-[#e3e3e6] bg-[#f7f7f8] p-3 shadow-none transition-colors duration-200 group-hover:bg-[#eeeeef]">
        <img src={logo} alt="" className="h-full w-full object-contain" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
      </span>
      <span className="max-w-[100px] truncate text-[11px] font-medium text-[#55565b] group-hover:text-[#202124]">{domain}</span>
      {isSponsored && <span className="bluefox-sponsored-badge rounded-full bg-[#e6f1fb] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.04em] text-[#137b8b]">Sponsorisé</span>}
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
      {article.image ? <img src={article.image} alt="" loading="lazy" onError={hideArticleImage} className="h-full w-full rounded-[4px] object-cover" /> : <span className="text-xl font-semibold text-[#9b9ca1]">{article.source?.charAt(0).toUpperCase()}</span>}
    </div>
  </a>
);

const SpeedDial = ({ onNavigate, isAiMode, onModeChange, onMusicOpen }) => {
  const [shortcuts, setShortcuts] = useState(readHomeShortcuts);
  const [articles, setArticles] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState(false);
  const [articleOffset, setArticleOffset] = useState(0);
  const requestInFlight = useRef(false);

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

  const normalizeArticles = (loadedArticles) => {
    const uniqueArticles = Array.from(
      new Map(loadedArticles.filter((article) => article.link).map((article) => [article.link, article])).values()
    ).filter((article) => {
      const age = Date.now() - (article.date || 0);
      const trustedSource = getTrustedNewsSource(article.domain || getArticleDomain(article.link, ''));
      return trustedSource
        && hasUsableArticleTitle(article.title, article.link)
        && article.language?.toLowerCase() === 'french'
        && age >= 0
        && age <= NEWS_MAX_AGE;
    }).map((article) => ({
      ...article,
      source: getTrustedNewsSource(article.domain || getArticleDomain(article.link, ''))[1]
    })).sort((first, second) => second.date - first.date);

    return diversifyArticles(uniqueArticles);
  };

  const readNewsCache = () => {
    try {
      const cached = JSON.parse(localStorage.getItem(NEWS_CACHE_KEY) || 'null');
      if (!cached?.articles?.length) return null;
      return cached;
    } catch {
      return null;
    }
  };

  const saveNewsCache = (nextArticles) => {
    try {
      localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), articles: nextArticles.slice(0, 120) }));
    } catch {
      // News remain available for the current session when storage is unavailable.
    }
  };

  const loadNews = async () => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    const cached = readNewsCache();
    const cachedArticles = normalizeArticles(cached?.articles || []);

    if (cachedArticles.length) {
      setArticles(cachedArticles);
      setNewsLoading(false);
      setNewsError(false);
    } else {
      setNewsLoading(true);
      setNewsError(false);
    }

    try {
      // GDELT is free/open data; the language query and 24h window keep results recent and French.
      if (cached && cachedArticles.length && Date.now() - cached.savedAt < NEWS_CACHE_MAX_AGE) return;

      const params = new URLSearchParams({
        query: GDELT_QUERY,
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
      const uniqueArticles = normalizeArticles([...cachedArticles, ...loadedArticles]);

      if (!uniqueArticles.length) throw new Error('No French articles returned by GDELT');
      setArticles(uniqueArticles);
      saveNewsCache(uniqueArticles);
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
  }, []);

  const visibleSuggestions = articles.length > 0
    ? Array.from({ length: Math.min(9, articles.length) }, (_, index) => articles[(articleOffset + index) % articles.length])
    : [];

  return (
    <div className="bluefox-reference-home relative h-full w-full overflow-y-auto bg-white text-[#202124]">
      <button type="button" onClick={onMusicOpen} className="fixed bottom-5 left-5 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-[#d8d7d4] bg-white/90 text-[#66676b] shadow-sm backdrop-blur-sm transition-colors hover:bg-[#f0efed] hover:text-[#292929]" aria-label="Ouvrir BlueMusic" title="Ouvrir BlueMusic">
        <MdMusicNote className="text-[21px]" />
      </button>
      <div className="absolute left-5 top-4 z-20 flex items-center gap-2">
        <ThemeToggle />
        <a
          href="https://discord.gg/z3bUt3hCya"
          onClick={(event) => { event.preventDefault(); onNavigate('https://discord.gg/z3bUt3hCya'); }}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d8d7d4] bg-white/90 text-[#5865f2] shadow-sm backdrop-blur-sm transition-colors hover:bg-[#eef0ff]"
          aria-label="Rejoindre le serveur Discord BlueFox"
          title="Discord BlueFox"
        >
          <FaDiscord className="text-[18px]" />
        </a>
        <a
          href="https://bluefoxbrowser.pages.dev/"
          onClick={(event) => { event.preventDefault(); onNavigate('https://bluefoxbrowser.pages.dev/'); }}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d8d7d4] bg-white/90 text-[#137b8b] shadow-sm backdrop-blur-sm transition-colors hover:bg-[#e8f5f7]"
          aria-label="Ouvrir le site BlueFox"
          title="Site BlueFox"
        >
          <MdLanguage className="text-[19px]" />
        </a>
      </div>
      <div className="mx-auto flex min-h-full w-full max-w-[1040px] flex-col px-6 py-8 sm:px-10 sm:py-10">
        <div className="absolute right-5 top-4 z-20">
          <button
            type="button"
            role="switch"
            aria-checked={isAiMode}
            aria-label="Basculer entre le mode web et le mode IA"
            title={isAiMode ? 'Mode IA' : 'Mode normal'}
            onClick={() => onModeChange(!isAiMode)}
            className={`bluefox-mode-switch relative flex h-8 w-[104px] cursor-pointer items-center rounded-full border p-1 text-[10px] font-semibold tracking-wide shadow-sm transition-colors duration-200 ${isAiMode ? 'border-[#707070] bg-[#707070] text-white' : 'border-[#707070] bg-[#707070] text-white'}`}
          >
            <span className={`absolute left-1 top-1 h-6 w-[48px] rounded-full bg-white shadow-sm transition-transform duration-200 ease-out ${isAiMode ? 'translate-x-[48px]' : 'translate-x-0'}`} />
            <span className={`bluefox-mode-label ${!isAiMode ? 'bluefox-mode-label-active' : 'bluefox-mode-label-inactive'} relative z-10 flex w-1/2 justify-center`}>WEB</span>
            <span className={`bluefox-mode-label ${isAiMode ? 'bluefox-mode-label-active' : 'bluefox-mode-label-inactive'} relative z-10 flex w-1/2 justify-center`}>IA</span>
          </button>
        </div>

        <section className="mb-12">
          <h1 className="mb-5 text-[21px] font-semibold tracking-[-0.02em] text-[#202124]">Favoris</h1>
          <div className="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-9 sm:gap-x-4">
            {shortcuts.map(({ title, url, iconUrl, isSponsored }) => <FavoriteTile key={url} title={title} url={url} iconUrl={iconUrl} isSponsored={isSponsored} onNavigate={onNavigate} />)}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-[21px] font-semibold tracking-[-0.02em] text-[#202124]">Rapport de confidentialité</h2>
          <div className="flex min-h-[58px] items-center gap-3 rounded-[10px] border border-[#e3e3e6] bg-[#f8f8f9] px-5 text-sm text-[#202124] shadow-none">
            <MdSecurity className="bluefox-privacy-icon shrink-0 text-lg text-[#164e86]" />
            <span className="text-lg font-semibold">0</span>
            <span className="text-[12px] text-[#66676c]">BlueFox n’enregistre pas votre historique de navigation.</span>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-[21px] font-semibold tracking-[-0.02em] text-[#202124]">Suggestions Foxy IA</h2>
          {newsLoading && <div className="grid grid-cols-1 gap-3 md:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-[96px] animate-pulse rounded-[10px] border border-[#e6e6e8] bg-[#f7f7f8]" />)}</div>}
          {!newsLoading && visibleSuggestions.length > 0 && <div className="grid grid-cols-1 gap-3 md:grid-cols-3">{visibleSuggestions.map((article) => <SuggestionCard key={article.id} article={article} />)}</div>}
          {!newsLoading && newsError && <div className="rounded-[10px] border border-[#e3e3e6] bg-[#f8f8f9] px-4 py-4 text-sm text-[#66676c]">Les suggestions ne sont pas disponibles pour le moment.</div>}
        </section>
      </div>
    </div>
  );
};

export default SpeedDial;
