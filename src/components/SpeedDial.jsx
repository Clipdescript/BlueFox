import React, { useEffect, useRef, useState } from 'react';
import { MdSecurity } from 'react-icons/md';
import ThemeToggle from './ThemeToggle';

const RSS_API = 'https://api.rss2json.com/v1/api.json?rss_url=';

const NEWS_SOURCES = [
  { name: 'France 24', feed: 'https://www.france24.com/fr/rss', domain: 'france24.com' },
  { name: 'RFI', feed: 'https://www.rfi.fr/fr/rss', domain: 'rfi.fr' },
  { name: 'Franceinfo', feed: 'https://www.francetvinfo.fr/titres.rss', domain: 'francetvinfo.fr' },
  { name: '20 Minutes', feed: 'https://www.20minutes.fr/feeds/rss-une.xml', domain: '20minutes.fr' },
  { name: 'Euronews', feed: 'https://fr.euronews.com/rss?format=mrss', domain: 'fr.euronews.com' },
  { name: "L'Équipe", feed: 'https://dwh.lequipe.fr/api/edito/rss?path=/', domain: 'lequipe.fr' },
  { name: 'Ouest-France', feed: 'https://www.ouest-france.fr/rss/une', domain: 'ouest-france.fr' },
  { name: "L'Obs", feed: 'https://www.nouvelobs.com/rss.xml', domain: 'nouvelobs.com' }
];

const SHORTCUTS = [
  ['Google', 'https://www.google.com'],
  ['YouTube', 'https://www.youtube.com'],
  ['Yahoo Mail', 'https://mail.yahoo.com'],
  ['Facebook', 'https://www.facebook.com'],
  ['Google Maps', 'https://maps.google.com'],
  ['Amazon', 'https://www.amazon.fr'],
  ['Netflix', 'https://www.netflix.com'],
  ['Doctolib', 'https://www.doctolib.fr'],
  ['Météo-France', 'https://meteofrance.com']
];

const getFaviconUrl = (url) => {
  try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=128`; } catch { return ''; }
};

const stripHtml = (value = '') => {
  const element = document.createElement('div');
  element.innerHTML = value;
  return (element.textContent || '').replace(/\s+/g, ' ').trim();
};

const getArticleImage = (item) => item.thumbnail || item.enclosure?.thumbnail || item.enclosure?.link || '';

const FavoriteTile = ({ title, url, onNavigate }) => {
  const logo = getFaviconUrl(url);
  const domain = title;

  return (
    <button type="button" onClick={() => onNavigate(url)} className="group flex min-w-0 flex-col items-center gap-2 text-center text-[#202124]">
      <span className="flex h-[60px] w-[60px] items-center justify-center rounded-[9px] border border-[#e3e3e6] bg-[#f7f7f8] p-3 shadow-none transition-colors duration-200 group-hover:bg-[#eeeeef]">
        <img src={logo} alt="" className="h-full w-full object-contain" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
      </span>
      <span className="max-w-[100px] truncate text-[11px] font-medium text-[#55565b] group-hover:text-[#202124]">{domain}</span>
    </button>
  );
};

const SuggestionCard = ({ article }) => (
  <a href={article.link} target="_blank" rel="noreferrer" className="group relative flex h-[82px] min-w-0 items-center overflow-hidden rounded-[10px] border border-[#e3e3e6] bg-[#f8f8f9] px-3.5 text-left text-[#202124] shadow-none transition-colors duration-200 hover:bg-[#f0f0f1]">
    <div className="min-w-0 flex-1 pr-14">
      <p className="line-clamp-2 text-[11px] font-medium leading-[1.35] text-[#292a2d]">{article.title}</p>
      <span className="mt-1 block truncate text-[10px] text-[#77787c]">{article.source}</span>
    </div>
    <div className="absolute right-2.5 flex h-12 w-12 items-center justify-center overflow-hidden rounded-[6px] border border-[#e1e1e4] bg-white p-1.5">
      {article.image ? <img src={article.image} alt="" loading="lazy" className="h-full w-full rounded-[4px] object-cover" /> : <img src={article.logo} alt="" className="h-8 w-8 object-contain" />}
    </div>
  </a>
);

const SpeedDial = ({ onNavigate, isAiMode, onModeChange }) => {
  const [articles, setArticles] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState(false);
  const [articleOffset, setArticleOffset] = useState(0);
  const hasLoadedNews = useRef(false);

  const loadNews = async () => {
    setNewsLoading(true);
    setNewsError(false);
    const results = await Promise.allSettled(NEWS_SOURCES.map(async (source) => {
      const response = await fetch(`${RSS_API}${encodeURIComponent(source.feed)}`);
      if (!response.ok) throw new Error(`${source.name} RSS unavailable`);
      const data = await response.json();
      if (data.status !== 'ok') throw new Error(`${source.name} RSS invalid`);
      return (data.items || []).slice(0, 3).map((item) => ({
        id: `${source.name}-${item.guid || item.link}`,
        title: stripHtml(item.title),
        link: item.link,
        image: getArticleImage(item),
        source: source.name,
        logo: data.feed?.image || getFaviconUrl(source.feed),
        date: item.pubDate
      }));
    }));

    const loadedArticles = results.flatMap((result) => result.status === 'fulfilled' ? result.value : []);
    setArticles(loadedArticles);
    setNewsError(loadedArticles.length === 0);
    const isFirstLoad = !hasLoadedNews.current;
    hasLoadedNews.current = true;
    setArticleOffset((currentOffset) => {
      if (!loadedArticles.length || isFirstLoad) return 0;
      return (currentOffset + 3) % loadedArticles.length;
    });
    setNewsLoading(false);
  };

  useEffect(() => {
    loadNews();
    const refreshTimer = setInterval(loadNews, 5 * 60 * 1000);
    return () => clearInterval(refreshTimer);
  }, []);

  const visibleSuggestions = articles.length > 0
    ? Array.from({ length: Math.min(6, articles.length) }, (_, index) => articles[(articleOffset + index) % articles.length])
    : [];

  return (
    <div className="bluefox-reference-home relative h-full w-full overflow-y-auto bg-white text-[#202124]">
      <div className="absolute left-5 top-4 z-20">
        <ThemeToggle />
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
          <h1 className="mb-5 text-[21px] font-semibold tracking-[-0.02em] text-[#202124]">Favorites</h1>
          <div className="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-9 sm:gap-x-4">
            {SHORTCUTS.map(([title, url]) => <FavoriteTile key={url} title={title} url={url} onNavigate={onNavigate} />)}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-[21px] font-semibold tracking-[-0.02em] text-[#202124]">Privacy Report</h2>
          <div className="flex min-h-[58px] items-center gap-3 rounded-[10px] border border-[#e3e3e6] bg-[#f8f8f9] px-5 text-sm text-[#202124] shadow-none">
            <MdSecurity className="shrink-0 text-lg" />
            <span className="text-lg font-semibold">0</span>
            <span className="text-[12px] text-[#66676c]">BlueFox n’enregistre pas votre historique de navigation.</span>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-[21px] font-semibold tracking-[-0.02em] text-[#202124]">Foxy Suggestions</h2>
          {newsLoading && <div className="grid grid-cols-1 gap-3 md:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((index) => <div key={index} className="h-[82px] animate-pulse rounded-[10px] border border-[#e6e6e8] bg-[#f7f7f8]" />)}</div>}
          {!newsLoading && visibleSuggestions.length > 0 && <div className="grid grid-cols-1 gap-3 md:grid-cols-3">{visibleSuggestions.map((article) => <SuggestionCard key={article.id} article={article} />)}</div>}
          {!newsLoading && newsError && <div className="rounded-[10px] border border-[#e3e3e6] bg-[#f8f8f9] px-4 py-4 text-sm text-[#66676c]">Les suggestions ne sont pas disponibles pour le moment.</div>}
        </section>
      </div>
    </div>
  );
};

export default SpeedDial;
