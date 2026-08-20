import React, { Suspense, useState, useRef, useEffect, useCallback } from 'react';
import { SidebarPanel } from './components/Sidebar';
import TopBar from './components/TopBar';
import TabBar from './components/TabBar';
import SpeedDial from './components/SpeedDial';
import { MdClose, MdPublic, MdSearch, MdSkipNext } from 'react-icons/md';
import { useTheme } from './utils/theme.js';
import './styles/music.css';
import { buildSearchUrl, DEFAULT_SEARCH_ENGINE_ID, extractSearchQuery, SAFE_SEARCH_STORAGE_KEY, SEARCH_ENGINE_STORAGE_KEY } from './utils/searchEngines.js';

const SettingsPage = React.lazy(() => import('./components/SettingsPage'));
const PersonalizationPanel = React.lazy(() => import('./components/PersonalizationPanel'));
const AiPage = React.lazy(() => import('./components/AiPage'));
const AiSidebar = React.lazy(() => import('./components/AiSidebar'));
const PdfEditor = React.lazy(() => import('./components/PdfEditor'));
const OfflineGame = React.lazy(() => import('./components/OfflineGame'));
const SETTINGS_URL = 'bluefox://parametres';
const BROWSER_HISTORY_STORAGE_KEY = 'bluefox_history';
const DISCORD_PROFILE_STORAGE_KEY = 'bluefox_discord_profile_v1';

const readBrowserHistory = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(BROWSER_HISTORY_STORAGE_KEY) || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
};

// Local development servers commonly omit a domain suffix (for example,
// "localhost:3000"). Treat them as addresses rather than search queries.
const isLocalDevelopmentAddress = (value) => /^(?:https?:\/\/)?(?:localhost|127(?:\.\d{1,3}){3}|0\.0\.0\.0|\[::1\])(?::\d{1,5})?(?:[/?#].*)?$/i.test(value);
const isNetworkLoadError = (event) => {
  const networkErrorCodes = new Set([-7, -105, -106, -102, -118, -100, -109]);
  return networkErrorCodes.has(Number(event?.errorCode)) || /internet|network|name_not_resolved|timed_out|connection/i.test(String(event?.errorDescription || ''));
};

const readDiscordProfile = () => {
  try {
    const profile = JSON.parse(localStorage.getItem(DISCORD_PROFILE_STORAGE_KEY) || 'null');
    return profile?.id && profile?.avatarUrl ? profile : null;
  } catch {
    return null;
  }
};

const createSettingsTab = () => ({
  id: Date.now(),
  title: 'Paramètres',
  url: SETTINGS_URL,
  isSearching: false,
  isAi: false,
  isSettings: true,
  isGame: false,
  favicon: '',
  isLoading: false
});

const createGameTab = () => ({
  id: Date.now(),
  title: 'Tetris',
  url: 'bluefox://tetris',
  isSearching: false,
  isAi: false,
  isSettings: false,
  isGame: true,
  favicon: '',
  isLoading: false
});

const createHomeTab = () => ({
  id: Date.now(),
  title: 'Accès rapide',
  url: '',
  isSearching: false,
  isAi: false,
  favicon: '',
  isLoading: false
});

function App() {
  const { resolvedTheme } = useTheme();
  const hasCleanStartup = localStorage.getItem('bluefox_clean_startup_v1') === 'true';
  const savedTabs = hasCleanStartup ? localStorage.getItem('bluefox_tabs') : null;
  const savedActiveId = hasCleanStartup ? localStorage.getItem('bluefox_active_tab_id') : null;
  const restoredTabs = savedTabs
    ? JSON.parse(savedTabs).filter((tab) => !tab.isMusic).map((tab) => ({
        ...tab,
        initialUrl: tab.initialUrl || tab.url,
        isAi: Boolean(tab.isAi || (!tab.isSearching && tab.title === 'Foxy IA')),
        isPdf: Boolean(tab.isPdf),
        pdfPath: tab.pdfPath || '',
        isSettings: Boolean(tab.isSettings || tab.url === SETTINGS_URL || tab.title === 'Paramètres'),
        isGame: Boolean(tab.isGame || tab.url === 'bluefox://tetris' || tab.url === 'bluefox://chrome-dino' || tab.title === 'Tetris' || tab.title === 'Chrome Dino' || tab.title === 'Dig Dug')
      }))
    : [];
  const initialTabs = restoredTabs.length > 0 ? restoredTabs : [createHomeTab()];
  const restoredActiveId = savedActiveId ? parseInt(savedActiveId, 10) : null;

  const [tabs, setTabs] = useState(() => initialTabs);
  const [activeTabId, setActiveTabId] = useState(() => (
    restoredActiveId && initialTabs.some((tab) => tab.id === restoredActiveId)
      ? restoredActiveId
      : initialTabs[0]?.id ?? null
  ));
  const [isAiMode, setIsAiMode] = useState(false);
  const [searchEngineId, setSearchEngineId] = useState(() => localStorage.getItem(SEARCH_ENGINE_STORAGE_KEY) || DEFAULT_SEARCH_ENGINE_ID);
  const [safeSearchEnabled, setSafeSearchEnabled] = useState(() => localStorage.getItem(SAFE_SEARCH_STORAGE_KEY) !== 'false');
  const [aiInitialPrompt, setAiInitialPrompt] = useState('');
  const [aiInitialPromptTabId, setAiInitialPromptTabId] = useState(null);
  const [aiSidebarTabs, setAiSidebarTabs] = useState({});
  const [isSpotifyOpen, setIsSpotifyOpen] = useState(false);
  const [isYouTubeOpen, setIsYouTubeOpen] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [discordProfile, setDiscordProfile] = useState(readDiscordProfile);
  const [personalizationTabs, setPersonalizationTabs] = useState({});
  const [isCompactLayout, setIsCompactLayout] = useState(() => window.innerWidth <= 640);
  const [homeBackground, setHomeBackground] = useState(() => localStorage.getItem('bluefox_home_background_v1') || '');
  const [isAddSiteOpen, setIsAddSiteOpen] = useState(false);
  const [customSites, setCustomSites] = useState([]);
  const [openCustomSiteId, setOpenCustomSiteId] = useState(null);
  const [addUrl, setAddUrl] = useState('');
  const [isWhatsAppOnline, setIsWhatsAppOnline] = useState(false);
  const [showMiniPlayer, setShowMiniPlayer] = useState(false);
  const [miniPos, setMiniPos] = useState({ x: 960, y: 540 });
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [miniSrc, setMiniSrc] = useState('');
  const ytWebviewRef = useRef(null);
  const waWebviewRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(() => Boolean(initialTabs.find((tab) => tab.id === activeTabId)?.isSettings));
  const [settingsSection, setSettingsSection] = useState('general');
  const [history, setHistory] = useState(readBrowserHistory);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [connectionNotice, setConnectionNotice] = useState(null);
  const connectionNoticeTimerRef = useRef(null);
  const connectionStatusRef = useRef(navigator.onLine);
  const keyboardActionsRef = useRef({ handleNewTab: null, handleReload: null });
  const [zoomFactor, setZoomFactor] = useState(1);
  const [musicAdAvailable, setMusicAdAvailable] = useState(false);
  const [musicPlayback, setMusicPlayback] = useState(null);
  const [activeSidebarApps, setActiveSidebarApps] = useState(new Set());
  const [tabColor, setTabColor] = useState(() => localStorage.getItem('bluefox_home_tab_color_v1') || (resolvedTheme === 'dark' ? '#1d2026' : '#f3f2f0'));
  const [tabBackground, setTabBackground] = useState(() => localStorage.getItem('bluefox_tab_background_v1') || '');
  // Keep the clean-startup migration for tabs, but preserve the real browsing history.
  useEffect(() => {
     if (!hasCleanStartup) {
         localStorage.removeItem('bluefox_tabs');
         localStorage.removeItem('bluefox_active_tab_id');
         localStorage.setItem('bluefox_clean_startup_v1', 'true');
     }
  }, [hasCleanStartup]);

  const recordHistoryVisit = useCallback((entry) => {
    if (!entry?.url || !String(entry.url).startsWith('http')) return;
    setHistory((currentHistory) => {
      const nextEntry = {
        id: `${Date.now()}-${entry.url}`,
        url: entry.url,
        title: entry.title && !String(entry.title).startsWith('http') ? entry.title : '',
        favicon: entry.favicon || '',
        timestamp: Date.now(),
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      };
      const nextHistory = [nextEntry, ...currentHistory.filter((item) => item.url !== nextEntry.url)].slice(0, 500);
      localStorage.setItem(BROWSER_HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
      window.dispatchEvent(new CustomEvent('bluefox-history-changed'));
      return nextHistory;
    });
  }, []);

  const updateHistoryEntry = useCallback((entry) => {
    if (!entry?.url) return;
    setHistory((currentHistory) => {
      let changed = false;
      const nextHistory = currentHistory.map((item) => {
        if (item.url !== entry.url) return item;
        changed = true;
        return {
          ...item,
          title: entry.title && !String(entry.title).startsWith('http') ? entry.title : item.title,
          favicon: entry.favicon || item.favicon
        };
      });
      if (!changed) return currentHistory;
      localStorage.setItem(BROWSER_HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
      window.dispatchEvent(new CustomEvent('bluefox-history-changed'));
      return nextHistory;
    });
  }, []);

  const showConnectionNotice = useCallback((status) => {
    if (connectionNoticeTimerRef.current) window.clearTimeout(connectionNoticeTimerRef.current);
    setConnectionNotice({ status, id: Date.now() });
    connectionNoticeTimerRef.current = window.setTimeout(() => {
      setConnectionNotice(null);
      connectionNoticeTimerRef.current = null;
    }, 9000);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let requestTimeout;

    const publishConnectionStatus = (nextStatus) => {
      if (cancelled || connectionStatusRef.current === nextStatus) return;
      connectionStatusRef.current = nextStatus;
      setIsOnline(nextStatus);
      showConnectionNotice(nextStatus ? 'online' : 'offline');
    };

    const checkConnection = async () => {
      let connected = navigator.onLine;
      if (connected) {
        const controller = new AbortController();
        requestTimeout = window.setTimeout(() => controller.abort(), 2500);
        try {
          await fetch('https://www.gstatic.com/generate_204', {
            cache: 'no-store',
            mode: 'no-cors',
            signal: controller.signal
          });
        } catch {
          connected = false;
        } finally {
          window.clearTimeout(requestTimeout);
        }
      }
      publishConnectionStatus(connected);
    };

    const handleOnline = () => publishConnectionStatus(true);
    const handleOffline = () => publishConnectionStatus(false);
    const interval = window.setInterval(checkConnection, 4000);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    if (!navigator.onLine) showConnectionNotice('offline');
    checkConnection();

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.clearTimeout(requestTimeout);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connectionNoticeTimerRef.current) window.clearTimeout(connectionNoticeTimerRef.current);
    };
  }, [showConnectionNotice]);

  useEffect(() => {
    const handleHistoryChanged = () => setHistory(readBrowserHistory());
    const handleSearchEngineChange = (event) => {
      const nextEngineId = event.detail || DEFAULT_SEARCH_ENGINE_ID;
      const safeSearch = localStorage.getItem(SAFE_SEARCH_STORAGE_KEY) !== 'false';
      setSearchEngineId(nextEngineId);
      setTabs((currentTabs) => currentTabs.map((tab) => {
        if (!tab.isSearching) return tab;
        const query = extractSearchQuery(tab.url || tab.initialUrl || '');
        if (!query) return tab;
        const nextUrl = buildSearchUrl(nextEngineId, query, safeSearch);
        return { ...tab, url: nextUrl, initialUrl: nextUrl, title: query, isLoading: true, loadCount: (tab.loadCount || 0) + 1 };
      }));
    };
    const handleSafeSearchChange = (event) => {
      setSafeSearchEnabled(event.detail !== false);
    };
    window.addEventListener('bluefox-history-changed', handleHistoryChanged);
    window.addEventListener('bluefox-search-engine-changed', handleSearchEngineChange);
    window.addEventListener('bluefox-safe-search-changed', handleSafeSearchChange);
    return () => {
      window.removeEventListener('bluefox-history-changed', handleHistoryChanged);
      window.removeEventListener('bluefox-search-engine-changed', handleSearchEngineChange);
      window.removeEventListener('bluefox-safe-search-changed', handleSafeSearchChange);
    };
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'F5') {
        event.preventDefault();
        keyboardActionsRef.current.handleReload?.();
        return;
      }

      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 't':
            event.preventDefault();
            keyboardActionsRef.current.handleNewTab?.();
            break;
          case 'r':
            event.preventDefault();
            keyboardActionsRef.current.handleReload?.();
            break;
          default:
            break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleSidebarApp = (appName, isOpen, setIsOpen) => {
    if (!isOpen) {
      setActiveSidebarApps(prev => new Set(prev).add(appName));
    }
    setIsOpen(!isOpen);
  };
  
  const activeTab = tabs.find(t => t.id === activeTabId) || null;
  const isPersonalizationOpen = activeTabId !== null && Boolean(personalizationTabs[activeTabId]);
  const [shouldMountBackgroundTabs, setShouldMountBackgroundTabs] = useState(false);
  const activeAiSidebar = activeTabId === null ? null : aiSidebarTabs[activeTabId] || null;
  const isAiSidebarVisible = Boolean(activeAiSidebar?.open);
  const [aiPageContext, setAiPageContext] = useState(null);
  const webviewRefs = useRef({});

  useEffect(() => {
    const pageUrl = activeTab?.url || '';
    if (!isAiSidebarVisible || activeTab?.isSettings || activeTab?.isPdf || !/^https?:\/\//i.test(pageUrl)) {
      setAiPageContext(null);
      return undefined;
    }

    let cancelled = false;
    let retryTimer = null;
    const readPageContext = async (attempt = 0) => {
      if (cancelled) return;
      const webview = webviewRefs.current[activeTabId];
      if (!webview?.executeJavaScript) {
        if (attempt < 12) retryTimer = window.setTimeout(() => readPageContext(attempt + 1), 350);
        return;
      }
      try {
        const context = await webview.executeJavaScript(`(() => {
          const clean = (value, max) => String(value || '').replace(/\\s+/g, ' ').trim().slice(0, max);
          const description = document.querySelector('meta[name="description"]')?.content || document.querySelector('meta[property="og:description"]')?.content || '';
          const headings = [...document.querySelectorAll('h1, h2, h3')].map((element) => element.innerText).filter(Boolean).join(' · ');
          const main = document.querySelector('main, article, [role="main"]') || document.body;
          return {
            url: location.href,
            title: clean(document.title, 240),
            description: clean(description, 1000),
            text: clean((headings ? headings + ' · ' : '') + (main?.innerText || document.body?.innerText || ''), 6000)
          };
        })()`, true);
        if (!cancelled && context?.url && (context.url.startsWith('http://') || context.url.startsWith('https://'))) setAiPageContext(context);
      } catch {
        if (attempt < 12) retryTimer = window.setTimeout(() => readPageContext(attempt + 1), 350);
      }
    };

    readPageContext();
    return () => {
      cancelled = true;
      if (retryTimer) window.clearTimeout(retryTimer);
    };
  }, [activeTab?.isPdf, activeTab?.isSettings, activeTab?.url, activeTabId, isAiSidebarVisible]);

  useEffect(() => {
    if (!activeTab?.isSearching || activeTab.isSettings || activeTab.isPdf || activeTab.offlineFallback || activeTab.pageError) return undefined;

    let cancelled = false;
    let attempts = 0;
    let blankChecks = 0;
    let retryTimer = null;
    const inspectLoadedPage = async () => {
      if (cancelled) return;
      const webview = webviewRefs.current[activeTabId];
      if (!webview) {
        if (attempts < 20) retryTimer = window.setTimeout(inspectLoadedPage, 350);
        attempts += 1;
        return;
      }

      try {
        const renderedUrl = typeof webview.getURL === 'function' ? webview.getURL() : '';
        const isChromiumErrorPage = /^chrome-error:\/\//i.test(renderedUrl);
        const pageError = isChromiumErrorPage ? { description: 'La page interne d’erreur Chromium n’a pas pu charger le site.' } : await webview.executeJavaScript?.(`(() => {
          const text = (document.body?.innerText || '').slice(0, 5000);
          const meaningful = [...document.querySelectorAll('h1, h2, h3, p, a, img, video, canvas, iframe, main, article, [role="main"], [role="application"]')].some((element) => {
            const rect = element.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0 && (Boolean(element.innerText?.trim()) || ['IMG', 'VIDEO', 'CANVAS', 'IFRAME'].includes(element.tagName));
          });
          // Do not classify arbitrary page copy as an error: services such as
          // YouTube can contain these words in hidden templates or help text.
          const isError = /HTTP ERROR [45]\\d{2}/i.test(text);
          const hasRenderedBody = Boolean(document.body?.children.length);
          return { isError, isBlank: document.readyState === 'complete' && !text.trim() && !meaningful && !hasRenderedBody };
        })()`, true);
        if (pageError?.isError || isChromiumErrorPage) {
          setTabs((currentTabs) => currentTabs.map((tab) => tab.id === activeTabId
            ? { ...tab, isLoading: false, offlineFallback: false, pageError: typeof pageError === 'object' ? pageError : { description: 'Page web introuvable.' } }
            : tab));
          return;
        }
        if (pageError?.isBlank) blankChecks += 1;
        else blankChecks = 0;
        // A blank body can be a normal intermediate state for React, canvas and
        // iframe applications. Only treat it as an error after it stays empty
        // across several completed inspections.
        if (blankChecks >= 5) {
          setTabs((currentTabs) => currentTabs.map((tab) => tab.id === activeTabId
            ? { ...tab, isLoading: false, offlineFallback: false, pageError: { isBlank: true, description: 'La page est restée vide.' } }
            : tab));
          return;
        }
      } catch {
        // The webview may still be starting; try again briefly.
      }

      attempts += 1;
      if (attempts < 20 && !cancelled) retryTimer = window.setTimeout(inspectLoadedPage, 350);
    };

    inspectLoadedPage();
    return () => {
      cancelled = true;
      if (retryTimer) window.clearTimeout(retryTimer);
    };
  }, [activeTab?.isPdf, activeTab?.isSearching, activeTab?.isSettings, activeTab?.loadCount, activeTab?.offlineFallback, activeTab?.pageError, activeTabId]);

  useEffect(() => {
    setIsAiMode(Boolean(activeTab?.isAi));
  }, [activeTabId]);

  useEffect(() => {
    // Keep the first paint focused on the visible tab. Background pages are
    // mounted shortly afterward so startup does not launch every webview at once.
    const timer = window.setTimeout(() => setShouldMountBackgroundTabs(true), 350);
    return () => window.clearTimeout(timer);
  }, []);

  const handleTabClick = useCallback((id) => {
    const nextTab = tabs.find((tab) => tab.id === id);
    setActiveTabId(id);
    setIsSettingsOpen(Boolean(nextTab?.isSettings));
    setIsAiMode(Boolean(nextTab?.isAi));
  }, [tabs]);

  const handleTabsReorder = useCallback((draggedId, targetIndex) => {
    setTabs((currentTabs) => {
      const currentIndex = currentTabs.findIndex((tab) => tab.id === draggedId);
      if (currentIndex < 0 || currentIndex === targetIndex) return currentTabs;

      const nextTabs = [...currentTabs];
      const [draggedTab] = nextTabs.splice(currentIndex, 1);
      nextTabs.splice(Math.max(0, Math.min(targetIndex, nextTabs.length)), 0, draggedTab);
      return nextTabs;
    });
  }, []);

  // Tab Hibernation Logic - OPTIMIZED FOR SPEED
  useEffect(() => {
    const interval = setInterval(() => {
      setTabs(currentTabs => {
        // Only hibernate if we have more than 10 tabs to save memory, otherwise keep them alive for SPEED
        if (currentTabs.length < 10) return currentTabs;

        return currentTabs.map(tab => {
          if (tab.id === activeTabId || !tab.url || !tab.isSearching) return { ...tab, hibernated: false };
          // Hibernate only if really necessary
          return tab;
        });
      });
    }, 300000); // Check every 5 minutes instead of 1 minute
    return () => clearInterval(interval);
  }, [activeTabId]);

  useEffect(() => {
    localStorage.setItem('bluefox_home_tab_color_v1', tabColor);
    window.electron?.setTabColor?.(tabColor);
  }, [tabColor]);

  useEffect(() => {
    if (!localStorage.getItem('bluefox_home_tab_color_v1')) {
      setTabColor(resolvedTheme === 'dark' ? '#1d2026' : '#f3f2f0');
    }
    window.electron?.setTabColor?.(tabColor);
  }, [resolvedTheme]);

  useEffect(() => {
    const updateCompactLayout = () => setIsCompactLayout(window.innerWidth <= 640);
    window.addEventListener('resize', updateCompactLayout);
    return () => window.removeEventListener('resize', updateCompactLayout);
  }, []);

  useEffect(() => {
    if (homeBackground) localStorage.setItem('bluefox_home_background_v1', homeBackground);
    else localStorage.removeItem('bluefox_home_background_v1');
  }, [homeBackground]);

  useEffect(() => {
    if (tabBackground) localStorage.setItem('bluefox_tab_background_v1', tabBackground);
    else localStorage.removeItem('bluefox_tab_background_v1');
  }, [tabBackground]);

  useEffect(() => {
    // Wake up active tab
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, hibernated: false } : t));
  }, [activeTabId]);

  useEffect(() => {
    if (tabs.length === 0) {
        localStorage.removeItem('bluefox_tabs');
        localStorage.removeItem('bluefox_active_tab_id');
        return;
    }
    const tabsToSave = tabs.map(({ id, title, url, isSearching, favicon, isAi, isPdf, pdfPath, isSettings, isGame }) => ({
        id, title, url, isSearching, favicon, isAi: Boolean(isAi), isPdf: Boolean(isPdf), ...(isPdf && pdfPath ? { pdfPath } : {}), isSettings: Boolean(isSettings), isGame: Boolean(isGame), isLoading: false
    }));
    localStorage.setItem('bluefox_tabs', JSON.stringify(tabsToSave));
    if (activeTabId !== null) {
        localStorage.setItem('bluefox_active_tab_id', activeTabId.toString());
    }
  }, [tabs, activeTabId]);

  const handleModeChange = useCallback((nextMode) => {
    setIsAiMode(nextMode);
    setTabs((currentTabs) => currentTabs.map((tab) => {
      if (tab.id !== activeTabId || tab.isSearching) return tab;
      const nextTitle = nextMode ? 'Foxy IA' : 'Accès rapide';
      return tab.isAi === nextMode && tab.title === nextTitle
        ? tab
        : { ...tab, isAi: nextMode, title: nextTitle };
    }));
  }, [activeTabId]);

  const handleNewTab = useCallback(() => {
    setIsSettingsOpen(false);
    setIsAiMode(false);
    const newId = Date.now();
    setTabs(prev => [...prev, { id: newId, title: 'Accès rapide', url: '', initialUrl: '', isSearching: false, isAi: false, isGame: false, favicon: '', isLoading: false }]);
    setActiveTabId(newId);
  }, []);

  const handleOpenGame = useCallback(() => {
    const existingGameTab = tabs.find((tab) => tab.isGame);
    if (existingGameTab) {
      setActiveTabId(existingGameTab.id);
      setIsSettingsOpen(false);
      setIsAiMode(false);
      return;
    }
    const gameTab = createGameTab();
    setTabs((currentTabs) => [...currentTabs, gameTab]);
    setActiveTabId(gameTab.id);
    setIsSettingsOpen(false);
    setIsAiMode(false);
  }, [tabs]);

  const handleNewWindow = useCallback(() => {
    window.electron?.newWindow?.();
  }, []);

  const handleNewPrivateWindow = useCallback(() => {
    window.electron?.newPrivateWindow?.();
  }, []);

  const handleDiscordLogin = useCallback(async () => {
    const result = await window.electron?.loginWithDiscord?.();
    if (!result?.ok || !result.profile) {
      if (result?.error) window.alert(result.error);
      return null;
    }
    setDiscordProfile(result.profile);
    localStorage.setItem(DISCORD_PROFILE_STORAGE_KEY, JSON.stringify(result.profile));
    return result.profile;
  }, []);

  const handleDiscordLogout = useCallback(() => {
    setDiscordProfile(null);
    localStorage.removeItem(DISCORD_PROFILE_STORAGE_KEY);
  }, []);

  const handleCloseTab = useCallback(async (id) => {
    const tab = tabs.find((currentTab) => currentTab.id === id);
    const webview = webviewRefs.current[id];

    if (tab?.isSearching && webview?.executeJavaScript) {
      try {
        const hasUnsavedChanges = await webview.executeJavaScript(`(() => {
          const controls = [...document.querySelectorAll('textarea, select, input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="search"]), [contenteditable="true"]')];
          return controls.some((control) => {
            if (control.disabled || control.readOnly) return false;
            if (control.isContentEditable) return Boolean(control.innerText.trim());
            if (control.tagName === 'SELECT') return [...control.options].some((option) => option.selected !== option.defaultSelected);
            if (control.type === 'checkbox' || control.type === 'radio') return control.checked !== control.defaultChecked;
            const description = [control.name, control.id, control.placeholder, control.getAttribute('aria-label')].filter(Boolean).join(' ');
            if (/search|recherche/i.test(description)) return false;
            return control.value !== control.defaultValue && Boolean(control.value);
          });
        })()`, true);

        if (hasUnsavedChanges && !window.confirm('Cette page contient des modifications non enregistrées. Voulez-vous vraiment la quitter ?')) {
          return false;
        }
      } catch {
        // Some protected pages reject script execution; let their own unload handling apply.
      }
    }

    if (tab?.isMusic) {
      if (webview?.executeJavaScript) {
        void webview.executeJavaScript('document.querySelector(\'video\')?.pause()', true).catch(() => {});
      }
      // Keep the last position available to the conversation player, but detach
      // it from the closed tab so its play button cannot relaunch a dead webview.
      setMusicPlayback((currentPlayback) => currentPlayback?.tabId === id
        ? { ...currentPlayback, tabId: null, isPlaying: false }
        : currentPlayback);
    }

    setTabs(prev => {
        const newTabs = prev.filter(t => t.id !== id);
        if (newTabs.length === 0) {
             const replacementTab = createHomeTab();
             setIsSettingsOpen(false);
             setIsAiMode(false);
             setActiveTabId(replacementTab.id);
             return [replacementTab];
        }
        if (id === activeTabId) {
             const nextActiveTab = newTabs[newTabs.length - 1];
             setActiveTabId(nextActiveTab.id);
             setIsSettingsOpen(Boolean(nextActiveTab.isSettings));
             setIsAiMode(Boolean(nextActiveTab.isAi));
        }
        return newTabs;
    });
    setAiSidebarTabs((currentTabs) => {
      const nextTabs = { ...currentTabs };
      delete nextTabs[id];
      return nextTabs;
    });
    setPersonalizationTabs((currentTabs) => {
      if (!Object.prototype.hasOwnProperty.call(currentTabs, id)) return currentTabs;
      const nextTabs = { ...currentTabs };
      delete nextTabs[id];
      return nextTabs;
    });
    delete webviewRefs.current[id];
    return true;
  }, [activeTabId, tabs]);

  const handleSearch = useCallback((query) => {
    const requestedUrl = query.trim();
    const isSettingsQuery = /^(bluefox:\/\/)?param(?:e|è)tres\/?$|^(bluefox:\/\/)?settings\/?$/i.test(requestedUrl);
    if (isSettingsQuery) {
      const settingsTab = tabs.find((tab) => tab.isSettings) || createSettingsTab();
      if (!tabs.some((tab) => tab.id === settingsTab.id)) setTabs((currentTabs) => [...currentTabs, settingsTab]);
      setActiveTabId(settingsTab.id);
      setIsSettingsOpen(true);
      setIsAiMode(false);
      return;
    }

    setIsSettingsOpen(false);
    let url = requestedUrl;
    const isLocalAddress = isLocalDevelopmentAddress(url);
    const isSearchQuery = (!url.includes('.') && !isLocalAddress) || url.includes(' ');
    if (isAiMode && isSearchQuery) {
      setAiInitialPrompt(url);
      if (activeTabId === null) handleNewTab();
      return;
    }
    if (isSearchQuery) {
      url = buildSearchUrl(searchEngineId, url, safeSearchEnabled);
    } else if (!/^https?:\/\//i.test(url)) {
      // Dev servers generally expose HTTP, whereas public hosts default to HTTPS.
      url = `${isLocalAddress ? 'http' : 'https'}://${url}`;
    }

    // Let the webview report a real navigation failure instead of trusting
    // navigator.onLine, which can be false inside Electron while the site works.
    const tab = { id: Date.now(), title: query, url, initialUrl: url, isSearching: true, favicon: '', isLoading: true, offlineFallback: false, loadCount: 0 };
    if (activeTabId === null) {
      setTabs([tab]);
      setActiveTabId(tab.id);
      return;
    }

    setTabs(prev => prev.map(t => 
      t.id === activeTabId          ? { ...t, url: url, initialUrl: url, isSearching: true, isPdf: false, isSettings: false, isGame: false, title: query, favicon: '', isLoading: true, offlineFallback: false, loadCount: (t.loadCount || 0) + 1 }
        : t
    ));
  }, [activeTabId, isAiMode, safeSearchEnabled, searchEngineId, tabs]);

  const handleAskFoxyFromAddress = useCallback((question) => {
    const prompt = String(question || '').trim().slice(0, 4000);
    if (!prompt) return;

    const existingAiTab = tabs.find((tab) => tab.isAi && !tab.isSearching);
    const targetId = existingAiTab?.id || Date.now();
    if (!existingAiTab) {
      setTabs((currentTabs) => [...currentTabs, {
        id: targetId,
        title: 'Foxy IA',
        url: '',
        isSearching: false,
        isAi: true,
        isGame: false,
        favicon: '',
        isLoading: false
      }]);
    }
    setAiInitialPrompt(prompt);
    setAiInitialPromptTabId(targetId);
    setIsSettingsOpen(false);
    setIsAiMode(true);
    setActiveTabId(targetId);
  }, [tabs]);

  const handleAssistantToggle = useCallback(() => {
    if (activeTabId === null) return;
    const willOpen = !isAiSidebarVisible;
    if (willOpen) {
      setIsMenuOpen(false);
      setPersonalizationTabs((currentTabs) => ({ ...currentTabs, [activeTabId]: false }));
    }
    setAiInitialPrompt('');
    setAiSidebarTabs((currentTabs) => {
      const current = currentTabs[activeTabId] || {};
      return {
        ...currentTabs,
        [activeTabId]: {
          ...current,
          open: !current.open,
          isDocumentMode: false,
          documentText: '',
          initialPrompt: '',
          request: null
        }
      };
    });
  }, [activeTabId, isAiSidebarVisible]);

  const openPdfPayloadInNewTab = useCallback((pdf) => {
    if (!pdf?.url) return;

    const id = Date.now();
    setIsSettingsOpen(false);
    setIsAiMode(false);
    setTabs(prev => [...prev, {
      id,
      title: pdf.fileName || 'Document PDF',
      url: pdf.url,
      initialUrl: pdf.url,
      isSearching: true,
      isPdf: true,
      pdfPath: pdf.filePath || '',
      pdfFile: pdf,
      isAi: false,
          favicon: '',
      isLoading: true
    }]);
    setActiveTabId(id);
  }, []);

  const handleOpenPdf = useCallback(async () => {
    const pdf = await window.electron?.openPdf?.();
    openPdfPayloadInNewTab(pdf);
  }, [openPdfPayloadInNewTab]);

  const handleOpenAssociatedPdf = useCallback(async (filePath) => {
    try {
      const pdf = await window.electron?.loadPdf?.(filePath);
      openPdfPayloadInNewTab(pdf);
    } catch (error) {
      console.error('Unable to open associated PDF:', error);
    }
  }, [openPdfPayloadInNewTab]);

  const openUrlInNewTab = useCallback((url) => {
    if (!/^https?:\/\//i.test(url)) return;
    const id = Date.now();
    setIsAiMode(false);
    setTabs(prev => [...prev, {
      id,
      title: url,
      url,
      isSearching: true,
      isPdf: false,
      isAi: false,
      favicon: '',
      isLoading: true,
      offlineFallback: false
    }]);
    setActiveTabId(id);
  }, []);

  const skipYouTubeAd = useCallback(async () => {
    const musicTab = musicPlayback?.tabId === null || musicPlayback?.tabId === undefined
      ? null
      : tabs.find((tab) => tab.id === musicPlayback.tabId);
    const webview = musicTab ? webviewRefs.current[musicTab.id] : null;
    if (!webview?.executeJavaScript) return;
    try {
      const skipped = await webview.executeJavaScript(`(() => {
        const selectors = ['.ytp-ad-skip-button', '.ytp-ad-skip-button-modern', '.ytp-ad-skip-button-container button'];
        const button = selectors.map((selector) => document.querySelector(selector)).find((element) => element && !element.disabled);
        if (!button) return false;
        button.click();
        return true;
      })()`, true);
      if (skipped) setMusicAdAvailable(false);
    } catch {
      // The YouTube page can be navigating while the ad control is created.
    }
  }, [musicPlayback?.tabId, tabs]);

  const controlMusicInNewTab = useCallback((command = {}) => {
    const musicTab = musicPlayback?.tabId === null || musicPlayback?.tabId === undefined
      ? null
      : tabs.find((tab) => tab.id === musicPlayback.tabId);
    const webview = musicTab ? webviewRefs.current[musicTab.id] : null;
    if (!webview?.executeJavaScript) return;

    const serializedCommand = JSON.stringify({ type: command.type, value: command.value });
    void webview.executeJavaScript(`(() => {
      const command = ${serializedCommand};
      const video = document.querySelector('video');
      if (command.type === 'seek' && video && Number.isFinite(video.duration)) {
        video.currentTime = Math.max(0, Math.min(video.duration, video.duration * Number(command.value || 0)));
        return true;
      }
      if (command.type === 'play' && video) {
        void video.play().catch(() => {});
        return true;
      }
      if (command.type === 'pause' && video) {
        video.pause();
        return true;
      }
      const labels = command.type === 'next' ? ['Next', 'Suivant'] : ['Previous', 'Précédent'];
      const button = [...document.querySelectorAll('button')].find((element) => labels.some((label) => ((element.getAttribute('aria-label') || '') + ' ' + (element.title || '')).toLocaleLowerCase().includes(label.toLocaleLowerCase())));
      button?.click();
      return Boolean(button);
    })()`, true).catch(() => {});
  }, [musicPlayback?.tabId, tabs]);

  const musicTabId = musicPlayback ? musicPlayback.tabId : [...tabs].reverse().find((tab) => tab.isMusic)?.id;
  useEffect(() => {
    if (musicTabId === undefined || musicTabId === null) {
      setMusicAdAvailable(false);
      return undefined;
    }

    let cancelled = false;
    const inspectAd = async () => {
      const webview = webviewRefs.current[musicTabId];
      if (!webview?.executeJavaScript) return;
      try {
        const canSkip = await webview.executeJavaScript(`(() => {
          const selectors = ['.ytp-ad-skip-button', '.ytp-ad-skip-button-modern', '.ytp-ad-skip-button-container button'];
          return selectors.some((selector) => {
            const element = document.querySelector(selector);
            return Boolean(element && !element.disabled);
          });
        })()`, true);
        if (!cancelled) setMusicAdAvailable(Boolean(canSkip));
      } catch {
        if (!cancelled) setMusicAdAvailable(false);
      }
    };

    const interval = window.setInterval(inspectAd, 700);
    inspectAd();
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [musicTabId]);

  // Read the real YouTube position instead of estimating it in the AI card.
  // The webview stays mounted while another tab is active, so this preserves
  // both playback and the exact resume position across tab switches.
  useEffect(() => {
    const musicTabId = musicPlayback?.tabId;
    if (musicTabId === undefined || musicTabId === null) return undefined;

    let cancelled = false;
    const syncMusicPlayback = async () => {
      const webview = webviewRefs.current[musicTabId];
      if (!webview?.executeJavaScript) return;
      try {
        const state = await webview.executeJavaScript(`(() => {
          const video = document.querySelector('video');
          if (!video) return null;
          return {
            currentTime: Number(video.currentTime) || 0,
            duration: Number.isFinite(video.duration) ? video.duration : 0,
            isPlaying: !video.paused && !video.ended
          };
        })()`, true);
        if (cancelled || !state) return;
        setMusicPlayback((currentPlayback) => {
          if (!currentPlayback || currentPlayback.tabId !== musicTabId) return currentPlayback;
          const nextPosition = Number.isFinite(state.currentTime) ? state.currentTime : currentPlayback.position || 0;
          const nextDuration = Number.isFinite(state.duration) && state.duration > 0 ? state.duration : currentPlayback.duration || 0;
          if (Math.abs((currentPlayback.position || 0) - nextPosition) < 0.2
            && (currentPlayback.duration || 0) === nextDuration
            && currentPlayback.isPlaying === Boolean(state.isPlaying)) {
            return currentPlayback;
          }
          return { ...currentPlayback, position: nextPosition, duration: nextDuration, isPlaying: Boolean(state.isPlaying) };
        });
      } catch {
        // The webview can be navigating or closing while it is inspected.
      }
    };

    const interval = window.setInterval(syncMusicPlayback, 500);
    syncMusicPlayback();
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [musicPlayback?.tabId]);

  useEffect(() => {
    const unsubscribe = window.electron?.onOpenUrlInNewTab?.(openUrlInNewTab);
    return () => unsubscribe?.();
  }, [openUrlInNewTab]);

  useEffect(() => {
    const unsubscribe = window.electron?.onOpenPdfFile?.(handleOpenAssociatedPdf);
    return () => unsubscribe?.();
  }, [handleOpenAssociatedPdf]);

  useEffect(() => {
    const unsubscribe = window.electron?.onJumpListAction?.((action) => {
      if (action?.type === 'new-tab') {
        handleNewTab();
      }
      if (action?.type === 'open-shortcut' && action.url) {
        openUrlInNewTab(action.url);
      }
    });
    return () => unsubscribe?.();
  }, [handleNewTab, openUrlInNewTab]);

  const goHome = useCallback(() => {
     setTabs(prev => prev.map(t => 
        t.id === activeTabId 
          ? { ...t, url: '', isSearching: false, isPdf: false, isSettings: false, isGame: false, title: 'Accès rapide', favicon: '', isLoading: false, offlineFallback: false }
          : t
      ));
  }, [activeTabId]);

  const handleOfflineRetry = useCallback(() => {
    setTabs((currentTabs) => currentTabs.map((tab) => tab.id === activeTabId
      ? { ...tab, offlineFallback: false, pageError: null, isLoading: true, loadCount: (tab.loadCount || 0) + 1 }
      : tab));
  }, [activeTabId]);

  const handleReload = useCallback(() => {
    const activeTabForReload = tabs.find((tab) => tab.id === activeTabId);
    if (activeTabForReload?.offlineFallback || activeTabForReload?.pageError) {
      handleOfflineRetry();
      return;
    }
    const webview = webviewRefs.current[activeTabId];
    if (webview) {
      try {
        // Only reload if the webview is ready and attached to DOM
        if (webview.getWebContentsId && typeof webview.getWebContentsId === 'function') {
          webview.reload();
        } else {
          // Fallback: update initialUrl to force re-render if not ready
          setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, loadCount: (t.loadCount || 0) + 1 } : t));
        }
      } catch (e) {
        setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, loadCount: (t.loadCount || 0) + 1 } : t));
      }
    }
  }, [activeTabId, handleOfflineRetry, tabs]);

  useEffect(() => {
    keyboardActionsRef.current = { handleNewTab, handleReload };
  }, [handleNewTab, handleReload]);

  const handlePrint = useCallback(() => {
    const webview = webviewRefs.current[activeTabId];
    if (webview?.print) {
      webview.print({ silent: false, printBackground: true });
      return;
    }
    window.electron?.print?.();
  }, [activeTabId]);

  const handleBack = useCallback(() => {
     const webview = webviewRefs.current[activeTabId];
     if(webview && webview.canGoBack()) webview.goBack();
  }, [activeTabId]);

  const handleForward = useCallback(() => {
     const webview = webviewRefs.current[activeTabId];
     if(webview && webview.canGoForward()) webview.goForward();
  }, [activeTabId]);

  useEffect(() => {
    const unsubscribe = window.electron?.onBrowserNavigation?.((direction) => {
      if (direction === 'back') handleBack();
      if (direction === 'forward') handleForward();
    });
    return () => unsubscribe?.();
  }, [handleBack, handleForward]);

  const lastUpdateRef = useRef({});

  useEffect(() => {
      tabs.forEach(tab => {
          const webview = webviewRefs.current[tab.id];
          if (webview && !webview.dataset.listening) {
              webview.dataset.listening = "true";
              
              const updateState = () => {
                  const now = Date.now();
                  const lastUpdate = lastUpdateRef.current[tab.id] || 0;
                  
                  // Throttle updates to once every 2000ms for title/URL state to prevent flickering
                  if (now - lastUpdate < 2000) return;
                  lastUpdateRef.current[tab.id] = now;
                  const newTitle = tab.isPdf ? tab.title : webview.getTitle();
                  const newUrl = tab.isPdf ? tab.url : webview.getURL();

                  setTabs(prev => prev.map(t => {
                      if (t.id === tab.id && (t.title !== newTitle || t.url !== newUrl)) {
                          return { ...t, title: newTitle, url: newUrl };
                      }
                      return t;
                  }));
                  if (!tab.isSettings && !tab.isPdf) updateHistoryEntry({ url: newUrl, title: newTitle });
              };

              const setLoading = (loading) => {
                  setTabs(prev => prev.map(t => t.id === tab.id ? { ...t, isLoading: loading } : t));
              };
              
              const detectPageError = async () => {
                  if (!webview.executeJavaScript || tab.isPdf) return;
                  try {
                      const pageError = await webview.executeJavaScript(`(() => {
                        const title = document.title || '';
                        const text = (document.body?.innerText || '').slice(0, 5000);
                        const meaningful = [...document.querySelectorAll('h1, h2, h3, p, a, img, video, canvas, iframe, main, article, [role="main"], [role="application"]')].some((element) => {
                          const rect = element.getBoundingClientRect();
                          return rect.width > 0 && rect.height > 0 && (Boolean(element.innerText?.trim()) || ['IMG', 'VIDEO', 'CANVAS', 'IFRAME'].includes(element.tagName));
                        });
                        // Rely on Chromium's error URL and main-frame load events
                        // for network failures. Only a clear HTTP status in the
                        // document title is treated as a site error here.
                        const isError = /HTTP ERROR [45]\\d{2}/i.test(text)
                          || /^(404|403|500|502|503|504)\\b/.test(title.trim());
                        return isError ? { title, text: text.slice(0, 240), isBlank: false } : null;
                      })()`, true);
                      if (pageError) {
                          setTabs(prev => prev.map(t => t.id === tab.id
                            ? { ...t, isLoading: false, offlineFallback: false, pageError }
                            : t));
                      }
                  } catch {
                      // Protected pages can reject DOM inspection; keep the webview visible.
                  }
              };

              webview.addEventListener('dom-ready', () => {
                  updateState();
                  setLoading(false);
                  void detectPageError();
              });
              webview.addEventListener('did-start-loading', () => setLoading(true));
              webview.addEventListener('did-stop-loading', () => {
                  setLoading(false);
                  void detectPageError();
              });
              webview.addEventListener('did-fail-load', (e) => {
                  // Subresource and iframe failures must never replace a working
                  // page. Only the main-frame navigation can show the fallback.
                  if (e.isMainFrame === true && e.errorCode !== -3) {
                      const currentUrl = typeof webview.getURL === 'function' ? webview.getURL() : '';
                      const failedUrl = e.validatedURL || e.url || '';
                      const isStaleNavigationFailure = currentUrl && failedUrl
                        && !/^chrome-error:\/\//i.test(currentUrl)
                        && currentUrl !== failedUrl;
                      if (isStaleNavigationFailure) return;
                      const shouldShowOfflineGame = !navigator.onLine || isNetworkLoadError(e);
                      // Non-network failures can be caused by a redirect,
                      // sub-navigation or a site-specific response. Leave the
                      // webview visible instead of replacing a usable page.
                      if (!shouldShowOfflineGame) return;
                      setTabs(prev => prev.map(t => t.id === tab.id
                        ? { ...t, isLoading: false, offlineFallback: true, pageError: null }
                        : t));
                      setLoading(false);
                      console.log('Webview network load failed:', e.errorCode, e.errorDescription);
                  }
              });
              
              webview.addEventListener('page-title-updated', updateState);
              const updateNavigatedUrl = (event) => {
                   setTabs(prev => prev.map(t => {
                       if (t.id === tab.id && !t.isPdf && t.url !== event.url) {
                           return { ...t, url: event.url, isLoading: false, pageError: null, offlineFallback: false };
                       }
                       return t;
                   }));
                   if (!tab.isSettings && !tab.isPdf) recordHistoryVisit({ url: event.url, title: tab.title, favicon: tab.favicon });
              };

              webview.addEventListener('did-navigate', updateNavigatedUrl);
              // YouTube playlists often change through SPA in-page navigation.
              webview.addEventListener('did-navigate-in-page', updateNavigatedUrl);
              
              webview.addEventListener('page-favicon-updated', (e) => {
                  if (e.favicons && e.favicons.length > 0) {
                      setTabs(prev => prev.map(t => t.id === tab.id ? { ...t, favicon: e.favicons[0] } : t));
                      if (!tab.isSettings && !tab.isPdf) updateHistoryEntry({ url: webview.getURL(), favicon: e.favicons[0] });
                  }
              });
          }
      });
  }, [recordHistoryVisit, tabs, updateHistoryEntry]);

  useEffect(() => {
    const w = ytWebviewRef.current;
    if (!w) return;
    const onDomReady = () => {
      // YouTube optimization script
      const js = `
        (function(){
          // Disable autoplay if needed or optimize quality
          // This is a placeholder for potential optimizations
        })();
      `;
      // Only execute if needed, minimal impact
    };
    // Removed complex video tracking for now to improve performance
    w.addEventListener('dom-ready', onDomReady);
    return () => {
      w.removeEventListener('dom-ready', onDomReady);
    };
  }, [isYouTubeOpen]);
  
  useEffect(() => {
    const w = waWebviewRef.current;
    if (!w) return;
    const onDomReady = () => {
      const js = `
        (function(){
          const check = () => {
            const chat = document.querySelector('[data-testid="chatlist-panel"]') || document.querySelector('[data-testid="chat-list"]');
            const qr = document.querySelector('canvas');
            if (chat && !qr) { console.log('WA_ONLINE'); } else { console.log('WA_OFFLINE'); }
            setTimeout(check, 3000);
          };
          check();
        })();
      `;
      w.executeJavaScript(js);
    };
    const onConsoleMessage = (e) => {
      const msg = e.message || '';
      if (msg.includes('WA_ONLINE')) setIsWhatsAppOnline(true);
      if (msg.includes('WA_OFFLINE')) setIsWhatsAppOnline(false);
    };
    w.addEventListener('dom-ready', onDomReady);
    w.addEventListener('console-message', onConsoleMessage);
    return () => {
      w.removeEventListener('dom-ready', onDomReady);
      w.removeEventListener('console-message', onConsoleMessage);
    };
  }, [isWhatsAppOpen]);

  const activeTabIdRef = useRef(activeTabId);
  useEffect(() => { activeTabIdRef.current = activeTabId; }, [activeTabId]);

  const handleSpotifyToggle = useCallback(() => toggleSidebarApp('spotify', isSpotifyOpen, setIsSpotifyOpen), [isSpotifyOpen]);
  const handleYouTubeToggle = useCallback(() => toggleSidebarApp('youtube', isYouTubeOpen, setIsYouTubeOpen), [isYouTubeOpen]);
  const handleWhatsAppToggle = useCallback(() => toggleSidebarApp('whatsapp', isWhatsAppOpen, setIsWhatsAppOpen), [isWhatsAppOpen]);
  const handleChatToggle = useCallback(() => toggleSidebarApp('chatgpt', isChatOpen, setIsChatOpen), [isChatOpen]);
  const handleAddSiteToggle = useCallback(() => setIsAddSiteOpen(prev => !prev), []);
  const handleMusicPlaybackChange = useCallback(({ videoId, isPlaying, position }) => {
    if (!videoId) return;
    setMusicPlayback((currentPlayback) => {
      if (isPlaying) {
        if (!tabs.some((tab) => tab.isMusic && tab.id === currentPlayback?.tabId)) return currentPlayback;
        return {
          ...(currentPlayback || {}),
          videoId,
          isPlaying: true,
          ...(Number.isFinite(Number(position)) ? { position: Number(position) } : {})
        };
      }
      if (!currentPlayback || currentPlayback.videoId !== videoId) return currentPlayback;
      return {
        ...currentPlayback,
        isPlaying: false,
        ...(Number.isFinite(Number(position)) ? { position: Number(position) } : {})
      };
    });
  }, [tabs]);

  const hasMusicTab = Boolean(musicPlayback?.tabId !== null
    && musicPlayback?.tabId !== undefined
    && tabs.some((tab) => tab.isMusic && tab.id === musicPlayback.tabId));

  const handleMenuChange = useCallback((isOpen) => {
    const nextOpen = Boolean(isOpen);
    setIsMenuOpen(nextOpen);
    if (nextOpen && activeTabId !== null) {
      setPersonalizationTabs((currentTabs) => ({ ...currentTabs, [activeTabId]: false }));
      setAiSidebarTabs((currentTabs) => {
        const current = currentTabs[activeTabId];
        if (!current?.open) return currentTabs;
        return { ...currentTabs, [activeTabId]: { ...current, open: false } };
      });
    }
  }, [activeTabId]);
  const handlePersonalizationChange = useCallback((isOpen) => {
    if (activeTabId === null) return;
    const nextOpen = Boolean(isOpen);
    if (nextOpen) {
      setIsMenuOpen(false);
      setAiSidebarTabs((currentTabs) => {
        const current = currentTabs[activeTabId];
        if (!current?.open) return currentTabs;
        return { ...currentTabs, [activeTabId]: { ...current, open: false } };
      });
    }
    setPersonalizationTabs((currentTabs) => ({
      ...currentTabs,
      [activeTabId]: nextOpen
    }));
  }, [activeTabId]);
  const updateAiConversation = useCallback((tabId, conversation) => {
    if (tabId === null || tabId === undefined) return;
    setAiSidebarTabs((currentTabs) => ({
      ...currentTabs,
      [tabId]: { ...(currentTabs[tabId] || {}), conversation }
    }));
  }, []);

  const handleAskFoxySelection = useCallback((selection) => {
    const prompt = String(selection || '').trim().slice(0, 4000);
    if (!prompt) return;

    setAiInitialPrompt(prompt);
    setIsSettingsOpen(false);
    setIsAiMode(false);
    setAiSidebarTabs((currentTabs) => ({
      ...currentTabs,
      [activeTabId]: { ...(currentTabs[activeTabId] || {}), open: true, isDocumentMode: false, documentText: '', initialPrompt: prompt, request: null }
    }));
  }, [activeTabId]);

  useEffect(() => {
    const unsubscribe = window.electron?.onAskFoxySelection?.(handleAskFoxySelection);
    return () => unsubscribe?.();
  }, [handleAskFoxySelection]);

  const handleOpenPdfFoxy = useCallback((_prompt, documentText = '') => {
    if (activeTabId === null) return;
    setAiInitialPrompt('');
    setAiSidebarTabs((currentTabs) => ({
      ...currentTabs,
      [activeTabId]: {
        open: true,
        isDocumentMode: true,
        documentText: String(documentText || '').slice(0, 24000),
        initialPrompt: '',
        request: null
      }
    }));
  }, [activeTabId]);

  const handlePdfAiAnswer = useCallback((result) => {
    const answer = typeof result === 'string' ? result : result?.text;
    if (!answer || !result?.insertIntoPdf || activeTabId === null) return;
    setAiSidebarTabs((currentTabs) => {
      const current = currentTabs[activeTabId];
      if (!current?.open || !current.isDocumentMode) return currentTabs;
      return { ...currentTabs, [activeTabId]: { ...current, request: { id: Date.now(), text: answer } } };
    });
  }, [activeTabId]);

  const handleSettingsOpen = useCallback((section = 'general') => {
    setSettingsSection(section);
    const existingSettingsTab = tabs.find((tab) => tab.isSettings);
    if (existingSettingsTab) {
      setActiveTabId(existingSettingsTab.id);
      setIsSettingsOpen(true);
      return;
    }
    const settingsTab = createSettingsTab();
    setTabs((currentTabs) => [...currentTabs, settingsTab]);
    setActiveTabId(settingsTab.id);
    setIsSettingsOpen(true);
  }, [tabs]);

  const handleSettingsClose = useCallback(() => {
    const nextTab = tabs.find((tab) => !tab.isSettings);
    if (nextTab) {
      setActiveTabId(nextTab.id);
      setIsSettingsOpen(false);
      setIsAiMode(Boolean(nextTab.isAi));
      return;
    }

    const replacementTab = createHomeTab();
    setTabs([replacementTab]);
    setActiveTabId(replacementTab.id);
    setIsSettingsOpen(false);
    setIsAiMode(false);
  }, [tabs]);

  const handleZoomIn = useCallback(() => {
    setZoomFactor(prev => {
        const nv = Math.min(3, +(prev + 0.1).toFixed(2));
        const w = webviewRefs.current[activeTabIdRef.current];
        if (w && w.setZoomFactor) w.setZoomFactor(nv);
        return nv;
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomFactor(prev => {
        const nv = Math.max(0.25, +(prev - 0.1).toFixed(2));
        const w = webviewRefs.current[activeTabIdRef.current];
        if (w && w.setZoomFactor) w.setZoomFactor(nv);
        return nv;
    });
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoomFactor(1);
    const w = webviewRefs.current[activeTabIdRef.current];
    if (w && w.setZoomFactor) w.setZoomFactor(1);
  }, []);

  const handleCustomToggle = useCallback((id) => {
       setActiveSidebarApps(prev => new Set(prev).add(`custom_${id}`));
       setOpenCustomSiteId(id);
  }, []);

  return (
    <div className="bluefox-app relative flex h-screen w-screen overflow-hidden border border-[#d7d7dc] bg-[#f7f7f9] text-[#202124]">
      {connectionNotice && (
        <div key={connectionNotice.id} className={`bluefox-connection-notice is-${connectionNotice.status}`} role="status" aria-live="polite">
          <MdPublic aria-hidden="true" style={{ color: '#ffffff', fill: '#ffffff' }} />
          <span>
            {connectionNotice.status === 'offline'
              ? 'Vous êtes hors ligne — Erreur réseau : ERR_INTERNET_DISCONNECTED. Vérifiez votre connexion Internet pour reprendre votre navigation.'
              : 'Vous êtes en ligne — Connexion Internet rétablie. Vous pouvez reprendre votre navigation.'}
          </span>
        </div>
      )}
      {/* Spotify Sidebar Panel (Persistent Webview) */}
      <SidebarPanel title="Spotify" isOpen={isSpotifyOpen} onClose={() => setIsSpotifyOpen(false)}>
         {/* Persistent Webview for Spotify - Loaded only when activated once */}
         {(isSpotifyOpen || activeSidebarApps.has('spotify')) && (
           <webview 
              src="https://open.spotify.com"
              className="w-full h-full"
              useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"
              
           />
         )}
      </SidebarPanel>

      {/* YouTube Sidebar Panel */}
      <SidebarPanel title="YouTube" isOpen={isYouTubeOpen} onClose={() => setIsYouTubeOpen(false)}>
         {(isYouTubeOpen || activeSidebarApps.has('youtube')) && (
           <webview 
              ref={el => {
                  if(el) {
                      ytWebviewRef.current = el;
                      // Add error listener to ignore aborts
                      el.addEventListener('did-fail-load', (e) => {
                          if (e.errorCode !== -3) {
                              console.error('YouTube load failed', e);
                          }
                      });
                  }
              }}
              src="https://www.youtube.com"
              className="w-full h-full"
              useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"
              
           />
         )}
      </SidebarPanel>

      {/* WhatsApp Sidebar Panel */}
      <SidebarPanel title="WhatsApp" isOpen={isWhatsAppOpen} onClose={() => setIsWhatsAppOpen(false)}>
         {(isWhatsAppOpen || activeSidebarApps.has('whatsapp')) && (
           <webview 
              ref={el => waWebviewRef.current = el}
              src="https://web.whatsapp.com"
              className="w-full h-full"
              useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"
              
           />
         )}
      </SidebarPanel>

      {/* ChatGPT Sidebar Panel */}
      <SidebarPanel title="ChatGPT" isOpen={isChatOpen} onClose={() => setIsChatOpen(false)}>
         {(isChatOpen || activeSidebarApps.has('chatgpt')) && (
           <webview 
              src="https://chatgpt.com"
              className="w-full h-full"
              useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"
           />
         )}
      </SidebarPanel>

      {/* Add Custom Site Panel */}
      <SidebarPanel title="Ajouter un site" isOpen={isAddSiteOpen} onClose={() => setIsAddSiteOpen(false)}>
         <div className="h-full w-full bg-white p-4 text-[#202124]">
           <div className="space-y-3">
             <input 
               type="text" 
               value={addUrl} 
               onChange={(e) => setAddUrl(e.target.value)} 
               placeholder="URL (https://...)" 
               className="w-full rounded border border-[#c9c9d0] bg-white px-3 py-2 text-[#202124] outline-none placeholder:text-[#777781] focus:border-[#0060df]"
             />
             <button 
               className="w-full rounded bg-[#0060df] px-3 py-2 font-semibold text-white transition-colors hover:bg-[#0050bd]"
               onClick={() => {
                 if (!addUrl) return;
                 const id = Date.now();
                 let title = addUrl;
                 try { title = new URL(addUrl).hostname.replace('www.', ''); } catch(e) {}
                 setCustomSites(prev => [...prev, { id, title, url: addUrl }]);
                 setOpenCustomSiteId(id);
                 setAddSiteOpen(false);
                 setAddUrl('');
               }}
             >
               Ajouter
             </button>
           </div>
         </div>
      </SidebarPanel>

      {/* Custom Site Panel */}
      {customSites.map(site => (
        <SidebarPanel 
           key={site.id}
           title={site.title} 
           isOpen={openCustomSiteId === site.id} 
           onClose={() => setOpenCustomSiteId(null)}
        >
           {(openCustomSiteId === site.id || activeSidebarApps.has(`custom_${site.id}`)) && (
             <webview 
                src={site.url}
                className="w-full h-full"
                useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"
                
             />
           )}
        </SidebarPanel>
      ))}

      {/* History is disabled: no browsing history is stored or displayed. */}
      <SidebarPanel title="Historique" isOpen={false} onClose={() => {}}>
        <div className="w-full h-full bg-white text-black overflow-hidden flex flex-col">

            {/* Search & Filter */}
            <div className="px-6 py-4 flex gap-4">
                <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MdSearch className="text-gray-400" />
                    </div>
                    <input 
                        type="text" 
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        placeholder="Rechercher dans l'historique"
                    />
                </div>
                <button className="px-4 py-2 border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-50 font-medium whitespace-nowrap">
                    Filtrer par date
                </button>
            </div>

            {/* History List */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
                {history.length === 0 ? (
                    <div className="p-8 text-gray-500 text-sm text-center bg-gray-50 rounded border border-gray-100 mt-2">
                        Aucun historique
                    </div>
                ) : (
                    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                        {/* Section Header */}
                        <div className="px-4 py-3 border-b border-gray-100 bg-white">
                            <h3 className="font-semibold text-gray-800 text-sm">
                                Aujourd'hui - {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </h3>
                        </div>
                        
                        {/* List Items */}
                        <div className="divide-y divide-gray-100">
                            {history.map((item, i) => {
                                let domain = '';
                                try {
                                    domain = new URL(item.url).hostname.replace('www.', '');
                                } catch (e) {
                                    domain = item.url;
                                }
                                
                                return (
                                    <div 
                                        key={i} 
                                        className="group px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center text-sm transition-colors"
                                        onClick={() => {
                                            handleNewTab();
                                            setTimeout(() => handleSearch(item.url), 100);
                                        }}
                                    >
                                        {/* Checkbox */}
                                        <div className="mr-4 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                            <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                                        </div>

                                        {/* Time */}
                                        <span className="text-gray-500 font-mono text-xs w-12 flex-shrink-0">
                                            {item.time}
                                        </span>

                                        {/* Favicon */}
                                        <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center mr-3">
                                            <img 
                                                src={item.favicon || `https://www.google.com/s2/favicons?domain=${domain}&sz=64`} 
                                                alt="" 
                                                className="w-4 h-4 object-contain"
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                        </div>

                                        {/* Domain */}
                                        <span className="text-gray-500 mr-4 w-40 truncate flex-shrink-0 hidden sm:block">
                                            {domain}
                                        </span>

                                        {/* Title */}
                                        <span className="text-gray-700 truncate flex-1 group-hover:text-blue-600 font-medium">
                                            {item.title || item.url}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="py-4 border-t border-gray-100 text-center bg-gray-50">
                <button className="text-sm font-semibold text-gray-700 hover:text-black">
                    Ouvrir la vue Historique complète
                </button>
            </div>
        </div>
      </SidebarPanel>

      <div className="relative z-0 flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <TabBar 
            tabs={tabs} 
            activeTabId={activeTabId} 
            onTabClick={handleTabClick}
            onTabClose={handleCloseTab}
            onNewTab={handleNewTab}
            onTabsReorder={handleTabsReorder}
            isSettingsOpen={isSettingsOpen}
            tabColor={tabColor}
            tabBackground={tabBackground}
        />

        <TopBar 
            onSearch={handleSearch}
            onAskFoxy={handleAskFoxyFromAddress}
            onAssistant={handleAssistantToggle}
            onSettings={handleSettingsOpen}
            onSettingsSection={handleSettingsOpen}
            onModeChange={handleModeChange}
            showHomeButton={Boolean(activeTab?.isSearching) && !isAiMode && !isSettingsOpen}
            onHome={goHome}
            isAssistantActive={isAiSidebarVisible}
            isMenuOpen={isMenuOpen}
            onMenuChange={handleMenuChange}
            currentUrl={isSettingsOpen ? SETTINGS_URL : activeTab?.isGame ? 'bluefox://tetris' : activeTab?.url || ''}
            currentFavicon={activeTab?.favicon || ''}
            isGame={Boolean(activeTab?.isGame)}
            isPageError={Boolean(activeTab?.pageError)}
            isOfflineFallback={Boolean(activeTab?.offlineFallback)}
            onPlayGame={handleOpenGame}
            isAiMode={isAiMode}
            isSettingsOpen={isSettingsOpen}
            onReload={handleReload}
            onBack={handleBack}
            onForward={handleForward}
            onNewTab={handleNewTab}
            onOpenPdf={handleOpenPdf}
            onPrint={handlePrint}
            onNewWindow={handleNewWindow}
            onNewPrivateWindow={handleNewPrivateWindow}
            onZoomOut={handleZoomOut}
            onZoomIn={handleZoomIn}
            zoomFactor={zoomFactor}
            discordProfile={discordProfile}
            onDiscordLogin={handleDiscordLogin}
            onDiscordLogout={handleDiscordLogout}
        />

        <main
          className="relative flex-1 overflow-hidden bg-white transition-[margin-right] duration-300 ease-out"
          style={{ marginRight: (isAiSidebarVisible || isPersonalizationOpen) && !isCompactLayout ? 'min(560px, 100vw)' : '0px' }}
        >
           {tabs.map(tab => (!shouldMountBackgroundTabs && tab.id !== activeTabId ? null : (
               <div 
                key={tab.id} 
                className={`absolute inset-0 w-full h-full ${tab.id === activeTabId ? 'z-10 visible' : 'z-0 invisible'}`}
                style={{ visibility: tab.id === activeTabId ? 'visible' : 'hidden' }}
               >
                   {tab.isGame ? (
                       tab.id === activeTabId ? (
                         <Suspense fallback={<div className="flex h-full w-full items-center justify-center bg-white text-sm text-[#77787c]">Chargement de Tetris…</div>}>
                           <OfflineGame standalone />
                         </Suspense>
                       ) : null
                   ) : tab.isSettings ? (
                       <Suspense fallback={<div className="flex h-full w-full items-center justify-center bg-white text-sm text-[#77787c]">Chargement des paramètres…</div>}>
                         <SettingsPage
                           onClose={handleSettingsClose}
                           initialSection={settingsSection}
                           onPrint={handlePrint}
                           onNewWindow={handleNewWindow}
                           onNewPrivateWindow={handleNewPrivateWindow}
                           onOpenPdf={handleOpenPdf}
                           onOpenExtensions={() => handleSearch('https://bluefox-add-ons.pages.dev/')}
                           discordProfile={discordProfile}
                           onDiscordLogin={handleDiscordLogin}
                           onDiscordLogout={handleDiscordLogout}
                         />
                       </Suspense>
                   ) : tab.isPdf ? (
                       <Suspense fallback={<div className="flex h-full w-full items-center justify-center bg-[#eef2f7] text-sm text-[#6c7789]">Ouverture de l’éditeur PDF…</div>}>
                         <PdfEditor
                           file={tab.pdfFile || { fileName: tab.title, filePath: tab.pdfPath }}
                           onOpenFoxy={handleOpenPdfFoxy}
                           aiInsertion={tab.id === activeTabId && activeAiSidebar?.isDocumentMode ? activeAiSidebar.request || null : null}
                         />
                       </Suspense>
                   ) : tab.isSearching ? (
                         tab.offlineFallback ? (
                           tab.id === activeTabId ? (
                             <Suspense fallback={<div className="flex h-full w-full items-center justify-center bg-[#f7f9fc] text-sm text-[#667085]">Chargement du mini-jeu hors ligne…</div>}>
                               <OfflineGame attemptedUrl={tab.url} errorKind="offline" onRetry={handleOfflineRetry} onGoHome={goHome} />
                             </Suspense>
                           ) : null
                         ) : tab.pageError ? (
                           tab.id === activeTabId ? (
                             <Suspense fallback={<div className="flex h-full w-full items-center justify-center bg-white text-sm text-[#667085]">Préparation de la page BlueFox…</div>}>
                               <OfflineGame attemptedUrl={tab.url} errorKind="site" onRetry={handleOfflineRetry} onGoHome={goHome} />
                             </Suspense>
                           ) : null
                         ) : !tab.hibernated ? (
                          <>
                          <webview
                              key={`${tab.id}-${tab.loadCount || 0}`}
                              ref={el => {
                                webviewRefs.current[tab.id] = el;
                              }}
                              src={tab.initialUrl || tab.url}
                              className="w-full h-full"
                              useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"
                          />
                          {tab.isMusic && tab.id === activeTabId && musicAdAvailable && <button type="button" className="bluefox-youtube-skip-ad" onClick={skipYouTubeAd}><MdSkipNext aria-hidden="true" /> Passer la publicité</button>}
                          </>
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center bg-[#f4f4f6] text-[#73737d]">
                              <p className="text-lg font-medium mb-2">Onglet en veille</p>
                              <p className="text-sm">Cliquez pour réactiver</p>
                          </div>
                        )
                   ) : (
                       <Suspense fallback={<div className="flex h-full w-full items-center justify-center bg-white text-sm text-[#77787c]">Chargement de Foxy…</div>}>
                         {isAiMode ? (
                           <AiPage isAiMode={isAiMode} onModeChange={handleModeChange} initialPrompt={tab.id === aiInitialPromptTabId ? aiInitialPrompt : ''} submitInitialPrompt={tab.id === aiInitialPromptTabId} hideModeSwitch hideThemeToggle conversation={aiSidebarTabs[tab.id]?.conversation} conversationKey={tab.id} onConversationChange={updateAiConversation} onMusicControl={controlMusicInNewTab} musicPlayback={musicPlayback} onMusicPlaybackChange={handleMusicPlaybackChange} hasMusicTab={hasMusicTab} />
                         ) : (
                           <SpeedDial onNavigate={handleSearch} onAskFoxy={handleAskFoxyFromAddress} tabColor={tabColor} onTabColorChange={setTabColor} isPersonalizationOpen={tab.id === activeTabId && isPersonalizationOpen} onPersonalizationChange={handlePersonalizationChange} homeBackground={homeBackground} />
                         )}
                       </Suspense>
                   )}
               </div>
           )))}

           {/* Floating Mini YouTube Player */}
           {!isSettingsOpen && isYouTubeOpen && showMiniPlayer && miniSrc && (
             <div 
               className="absolute z-50 w-[360px] h-[220px] bg-black rounded shadow-lg border border-gray-700 overflow-hidden select-none"
               style={{ left: `${miniPos.x}px`, top: `${miniPos.y}px` }}
             >
               <div 
                 className="h-8 bg-[#111] text-white flex items-center justify-between px-3 cursor-move"
                 onMouseDown={(e) => {
                   setDragging(true);
                   const rect = e.currentTarget.parentElement.getBoundingClientRect();
                   setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                 }}
               >
                 <span className="text-xs font-semibold">Lecteur YouTube</span>
                 <div className="flex items-center space-x-2">
                   <button 
                     className="text-xs px-2 py-0.5 rounded bg-white/10 hover:bg-white/20"
                     onClick={() => setShowMiniPlayer(false)}
                   >
                     Masquer
                   </button>
                 </div>
               </div>
               <webview
                 src={miniSrc}
                 className="w-full h-[calc(100%-32px)]"
                 
                 useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"
               />
             </div>
           )}

           {/* Drag movement listeners */}
           {!isSettingsOpen && dragging && (
             <div
               className="absolute inset-0 z-40"
               onMouseMove={(e) => {
                 const newX = e.clientX - dragOffset.x;
                 const newY = e.clientY - dragOffset.y;
                 const maxX = window.innerWidth - 360;
                 const maxY = window.innerHeight - 220;
                 setMiniPos({ 
                   x: Math.max(0, Math.min(newX, maxX)), 
                   y: Math.max(0, Math.min(newY, maxY)) 
                 });
               }}
               onMouseUp={() => setDragging(false)}
             />
           )}
        </main>

      </div>

      {isAiSidebarVisible && (
        <Suspense fallback={null}>
          <AiSidebar
            key={activeTabId}
            isOpen={isAiSidebarVisible}
            initialPrompt={activeAiSidebar?.initialPrompt || ''}
            isDocumentMode={Boolean(activeAiSidebar?.isDocumentMode)}
            documentText={activeAiSidebar?.documentText || ''}
            pageContext={aiPageContext}
            currentTitle={activeTab?.title || ''}
            currentUrl={activeTab?.url || ''}
            currentFavicon={activeTab?.favicon || ''}
            onAnswer={handlePdfAiAnswer}
            onMusicControl={controlMusicInNewTab}
            musicPlayback={musicPlayback}
            onMusicPlaybackChange={handleMusicPlaybackChange}
            hasMusicTab={hasMusicTab}
            conversation={activeAiSidebar?.conversation}
            conversationKey={activeTabId}
            onConversationChange={updateAiConversation}
            onClose={() => {
              if (activeTabId === null) return;
              setAiSidebarTabs((currentTabs) => ({
                ...currentTabs,
                [activeTabId]: { ...(currentTabs[activeTabId] || {}), open: false }
              }));
              setAiInitialPrompt('');
            }}
          />
        </Suspense>
      )}

      <Suspense fallback={null}>
        <PersonalizationPanel
          isOpen={isPersonalizationOpen}
          homeBackground={homeBackground}
          setHomeBackground={setHomeBackground}           tabColor={tabColor}
           onTabColorChange={setTabColor}
           tabBackground={tabBackground}
           onTabBackgroundChange={setTabBackground}
           resolvedTheme={resolvedTheme}

          onClose={() => handlePersonalizationChange(false)}
        />
      </Suspense>
    </div>
  );
}

export default App;
