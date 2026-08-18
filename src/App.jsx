import React, { Suspense, useState, useRef, useEffect, useCallback } from 'react';
import { SidebarPanel } from './components/Sidebar';
import TopBar from './components/TopBar';
import TabBar from './components/TabBar';
import SpeedDial from './components/SpeedDial';
import { MdClose, MdMusicNote, MdSearch } from 'react-icons/md';
import { useTheme } from './utils/theme.js';

const MusicPage = React.lazy(() => import('./components/MusicPage'));
const SettingsPage = React.lazy(() => import('./components/SettingsPage'));
const PersonalizationPanel = React.lazy(() => import('./components/PersonalizationPanel'));
const AiPage = React.lazy(() => import('./components/AiPage'));
const AiSidebar = React.lazy(() => import('./components/AiSidebar'));
const PdfEditor = React.lazy(() => import('./components/PdfEditor'));
const SETTINGS_URL = 'bluefox://parametres';

// Local development servers commonly omit a domain suffix (for example,
// "localhost:3000"). Treat them as addresses rather than search queries.
const isLocalDevelopmentAddress = (value) => /^(?:https?:\/\/)?(?:localhost|127(?:\.\d{1,3}){3}|0\.0\.0\.0|\[::1\])(?::\d{1,5})?(?:[/?#].*)?$/i.test(value);

const createSettingsTab = () => ({
  id: Date.now(),
  title: 'Paramètres',
  url: SETTINGS_URL,
  isSearching: false,
  isAi: false,
  isSettings: true,
  isMusic: false,
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
    ? JSON.parse(savedTabs).map((tab) => ({
        ...tab,
        initialUrl: tab.initialUrl || tab.url,
        isAi: Boolean(tab.isAi || (!tab.isSearching && tab.title === 'Foxy IA')),
        isPdf: Boolean(tab.isPdf),
        pdfPath: tab.pdfPath || '',
        isSettings: Boolean(tab.isSettings || tab.url === SETTINGS_URL || tab.title === 'Paramètres')
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
  const [aiInitialPrompt, setAiInitialPrompt] = useState('');
  const [aiSidebarTabs, setAiSidebarTabs] = useState({});
  const [isSpotifyOpen, setIsSpotifyOpen] = useState(false);
  const [isYouTubeOpen, setIsYouTubeOpen] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isPersonalizationOpen, setIsPersonalizationOpen] = useState(false);
  const [isCompactLayout, setIsCompactLayout] = useState(() => window.innerWidth <= 640);
  const [homeBackground, setHomeBackground] = useState(() => localStorage.getItem('bluefox_home_background_v1') || '');
  const [isAddSiteOpen, setIsAddSiteOpen] = useState(false);
  const [customSites, setCustomSites] = useState([]);
  const [openCustomSiteId, setOpenCustomSiteId] = useState(null);
  const [addUrl, setAddUrl] = useState('');
  const [isWhatsAppOnline, setIsWhatsAppOnline] = useState(false);
  const [showMiniPlayer, setShowMiniPlayer] = useState(false);
  const [musicPlayback, setMusicPlayback] = useState(null);
  const [miniPos, setMiniPos] = useState({ x: 960, y: 540 });
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [miniSrc, setMiniSrc] = useState('');
  const ytWebviewRef = useRef(null);
  const waWebviewRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(() => Boolean(initialTabs.find((tab) => tab.id === activeTabId)?.isSettings));
  // BlueFox never stores browsing history.
  const [history] = useState([]);
  const [zoomFactor, setZoomFactor] = useState(1);
  const [activeSidebarApps, setActiveSidebarApps] = useState(new Set());
  const [tabColor, setTabColor] = useState(() => localStorage.getItem('bluefox_home_tab_color_v1') || (resolvedTheme === 'dark' ? '#1d2026' : '#f3f2f0'));
  // Clear legacy history and ignore previously saved tabs on the first clean startup.
  useEffect(() => {
     localStorage.removeItem('bluefox_history');
     if (!hasCleanStartup) {
         localStorage.removeItem('bluefox_tabs');
         localStorage.removeItem('bluefox_active_tab_id');
         localStorage.setItem('bluefox_clean_startup_v1', 'true');
     }
  }, [hasCleanStartup]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
        if (e.ctrlKey) {
            switch(e.key.toLowerCase()) {
                case 't':
                    e.preventDefault();
                    handleNewTab();
                    break;
                case 'r':
                case 'f5':
                    e.preventDefault();
                    handleReload();
                    break;
                default:
                    break;
            }
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []); // Empty deps as handlers use refs or state setters

  const toggleSidebarApp = (appName, isOpen, setIsOpen) => {
    if (!isOpen) {
      setActiveSidebarApps(prev => new Set(prev).add(appName));
    }
    setIsOpen(!isOpen);
  };
  
  const activeTab = tabs.find(t => t.id === activeTabId) || null;
  const [shouldMountBackgroundTabs, setShouldMountBackgroundTabs] = useState(false);
  const activeAiSidebar = activeTabId === null ? null : aiSidebarTabs[activeTabId] || null;
  const isAiSidebarVisible = Boolean(activeAiSidebar?.open);
  const webviewRefs = useRef({});

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
    // Wake up active tab
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, hibernated: false } : t));
  }, [activeTabId]);

  useEffect(() => {
    if (tabs.length === 0) {
        localStorage.removeItem('bluefox_tabs');
        localStorage.removeItem('bluefox_active_tab_id');
        return;
    }
    const tabsToSave = tabs.map(({ id, title, url, isSearching, favicon, isAi, isPdf, pdfPath, isSettings, isMusic }) => ({
        id, title, url, isSearching, favicon, isAi: Boolean(isAi), isPdf: Boolean(isPdf), ...(isPdf && pdfPath ? { pdfPath } : {}), isSettings: Boolean(isSettings), isMusic: Boolean(isMusic), isLoading: false
    }));
    localStorage.setItem('bluefox_tabs', JSON.stringify(tabsToSave));
    if (activeTabId !== null) {
        localStorage.setItem('bluefox_active_tab_id', activeTabId.toString());
    }
  }, [tabs, activeTabId]);

  const handleModeChange = useCallback((nextMode) => {
    setIsAiMode(nextMode);
    setTabs((currentTabs) => currentTabs.map((tab) => {
      if (tab.id !== activeTabId || tab.isSearching || tab.isMusic) return tab;
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
    setTabs(prev => [...prev, { id: newId, title: 'Accès rapide', url: '', initialUrl: '', isSearching: false, isAi: false, isMusic: false, favicon: '', isLoading: false }]);
    setActiveTabId(newId);
  }, []);

  const handleMusicTab = useCallback(() => {
    setIsSettingsOpen(false);
    const newId = Date.now();
    setIsAiMode(false);
    setTabs(prev => [...prev, { id: newId, title: 'BlueMusic', url: '', initialUrl: '', isSearching: false, isAi: false, isMusic: true, favicon: '', isLoading: false }]);
    setActiveTabId(newId);
  }, []);

  const handleMusicPlaybackChange = useCallback((tabId, playback) => {
    setMusicPlayback((currentPlayback) => {
      if (!playback) return currentPlayback?.tabId === tabId ? null : currentPlayback;
      return { ...playback, tabId };
    });
  }, []);

  const handleAiMusicPlayback = useCallback((playback) => {
    if (activeTabId === null) return;
    handleMusicPlaybackChange(activeTabId, playback);
  }, [activeTabId, handleMusicPlaybackChange]);

  const handleNewWindow = useCallback(() => {
    window.electron?.newWindow?.();
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

    if (musicPlayback?.tabId === id) setMusicPlayback(null);

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
    delete webviewRefs.current[id];
    return true;
  }, [activeTabId, musicPlayback, tabs]);

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
      url = `https://www.google.com/search?q=${encodeURIComponent(url)}&safe=active`;
    } else if (!/^https?:\/\//i.test(url)) {
      // Dev servers generally expose HTTP, whereas public hosts default to HTTPS.
      url = `${isLocalAddress ? 'http' : 'https'}://${url}`;
    }

    const tab = { id: Date.now(), title: query, url, initialUrl: url, isSearching: true, favicon: '', isLoading: true, loadCount: 0 };
    if (activeTabId === null) {
      setTabs([tab]);
      setActiveTabId(tab.id);
      return;
    }

    setTabs(prev => prev.map(t => 
      t.id === activeTabId          ? { ...t, url: url, initialUrl: url, isSearching: true, isPdf: false, isSettings: false, isMusic: false, title: query, favicon: '', isLoading: true, loadCount: (t.loadCount || 0) + 1 }
        : t
    ));
  }, [activeTabId, isAiMode, tabs]);

  const handleAssistantToggle = useCallback(() => {
    if (activeTabId === null) return;
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
  }, [activeTabId]);

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
      isMusic: false,
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
      isLoading: true
    }]);
    setActiveTabId(id);
  }, []);

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
          ? { ...t, url: '', isSearching: false, isPdf: false, isSettings: false, isMusic: false, title: 'Accès rapide', favicon: '', isLoading: false }
          : t
      ));
  }, [activeTabId]);

  const handleReload = useCallback(() => {
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
  }, [activeTabId]);

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
                  // But we allow the webview to handle its own internal navigation
                  if (now - lastUpdate < 2000) return;
                  lastUpdateRef.current[tab.id] = now;

                  setTabs(prev => prev.map(t => {
                      if (t.id === tab.id) {
                          const newTitle = t.isPdf ? t.title : webview.getTitle();
                          const newUrl = t.isPdf ? t.url : webview.getURL();
                          
                          // CRITICAL: Only update state title/url, do NOT let this trigger a re-render of webview src
                          if (t.title !== newTitle || t.url !== newUrl) {
                              return { 
                                  ...t, 
                                  title: newTitle,
                                  url: newUrl
                              };
                          }
                      }
                      return t;
                  }));
              };

              const setLoading = (loading) => {
                  setTabs(prev => prev.map(t => t.id === tab.id ? { ...t, isLoading: loading } : t));
              };
              
              webview.addEventListener('dom-ready', () => {
                  updateState();
                  setLoading(false);
              });
              webview.addEventListener('did-start-loading', () => setLoading(true));
              webview.addEventListener('did-stop-loading', () => setLoading(false));
              webview.addEventListener('did-fail-load', (e) => {
                  // Ignore harmless aborts and common errors
                  if (e.errorCode !== -3) {
                      setLoading(false);
                      console.log('Webview load failed:', e.errorCode, e.errorDescription);
                  }
              });
              
              webview.addEventListener('page-title-updated', updateState);
              const updateNavigatedUrl = (event) => {
                   setTabs(prev => prev.map(t => {
                       if (t.id === tab.id && !t.isPdf && t.url !== event.url) {
                           return { ...t, url: event.url, isLoading: false };
                       }
                       return t;
                   }));
              };

              webview.addEventListener('did-navigate', updateNavigatedUrl);
              // YouTube playlists often change through SPA in-page navigation.
              webview.addEventListener('did-navigate-in-page', updateNavigatedUrl);
              
              webview.addEventListener('page-favicon-updated', (e) => {
                  if (e.favicons && e.favicons.length > 0) {
                      setTabs(prev => prev.map(t => t.id === tab.id ? { ...t, favicon: e.favicons[0] } : t));
                  }
              });
          }
      });
  }, [tabs]);

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
  const handleMenuToggle = useCallback(() => setIsMenuOpen(prev => !prev), []);
  const handleAskFoxySelection = useCallback((selection) => {
    const prompt = String(selection || '').trim().slice(0, 4000);
    if (!prompt) return;

    setAiInitialPrompt(prompt);
    setIsSettingsOpen(false);
    setIsAiMode(false);
    setAiSidebarTabs((currentTabs) => ({
      ...currentTabs,
      [activeTabId]: { open: true, isDocumentMode: false, documentText: '', initialPrompt: prompt, request: null }
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

  const handleSettingsOpen = useCallback(() => {
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

      {/* Menu Panel */}
      <SidebarPanel title="Menu" isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)}>
        <div className="h-full w-full overflow-y-auto bg-white p-0 text-[#202124]">
            <div className="px-4 py-3 text-xs font-semibold tracking-[0.2em] text-[#73737d]">MENU</div>
            <div className="px-2 py-1">
              <button className="flex w-full items-center justify-between rounded px-3 py-2 text-[#4f4f59] transition-colors hover:bg-[#eef4ff] hover:text-[#0060df]" onClick={handleNewTab}>
                <span>Nouvel onglet</span>
                <span className="text-gray-500 text-[10px]">Ctrl + T</span>
              </button>
              <div className="mt-1 border-t border-gray-200" />
              <div className="px-3 py-2 text-[#73737d]">Zoom</div>
              <div className="flex items-center px-3 pb-2 space-x-2">
                <button 
                  className="rounded bg-[#eef0f4] px-3 py-1 text-[#4f4f59] transition-colors hover:bg-[#dfeaff] hover:text-[#0060df]" 
                  onClick={() => {
                    const nv = Math.max(0.25, +(zoomFactor - 0.1).toFixed(2));
                    setZoomFactor(nv);
                    const w = webviewRefs.current[activeTabId];
                    if (w && w.setZoomFactor) w.setZoomFactor(nv);
                  }}
                >
                  -
                </button>
                <button 
                  className="rounded bg-[#eef0f4] px-3 py-1 text-[#4f4f59] transition-colors hover:bg-[#dfeaff] hover:text-[#0060df]" 
                  onClick={() => {
                    setZoomFactor(1);
                    const w = webviewRefs.current[activeTabId];
                    if (w && w.setZoomFactor) w.setZoomFactor(1);
                  }}
                >
                  100%
                </button>
                <button 
                  className="rounded bg-[#eef0f4] px-3 py-1 text-[#4f4f59] transition-colors hover:bg-[#dfeaff] hover:text-[#0060df]" 
                  onClick={() => {
                    const nv = Math.min(3, +(zoomFactor + 0.1).toFixed(2));
                    setZoomFactor(nv);
                    const w = webviewRefs.current[activeTabId];
                    if (w && w.setZoomFactor) w.setZoomFactor(nv);
                  }}
                >
                  +
                </button>
              </div>
              <div className="mt-1 border-t border-gray-200" />
              <button className="flex w-full items-center justify-between rounded px-3 py-2 text-[#4f4f59] transition-colors hover:bg-[#eef4ff] hover:text-[#0060df]" onClick={() => window.electron?.close()}>
                <span>Quitter</span>
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
        />

        <TopBar 
            onSearch={handleSearch}
            onAssistant={handleAssistantToggle}
            onSettings={handleSettingsOpen}
            onMusicOpen={handleMusicTab}
            onModeChange={handleModeChange}
            showHomeButton={Boolean(activeTab?.isSearching) && !isAiMode && !isSettingsOpen}
            onHome={goHome}
            isAssistantActive={isAiSidebarVisible}
            currentUrl={isSettingsOpen ? SETTINGS_URL : activeTab?.url || ''}
            currentFavicon={activeTab?.favicon || ''}
            isAiMode={isAiMode}
            isSettingsOpen={isSettingsOpen}
            onReload={handleReload}
            onBack={handleBack}
            onForward={handleForward}
            onNewTab={handleNewTab}
            onOpenPdf={handleOpenPdf}
            onPrint={handlePrint}
            onNewWindow={handleNewWindow}
            onZoomOut={handleZoomOut}
            onZoomIn={handleZoomIn}
            zoomFactor={zoomFactor}
        />

        <main
          className="relative flex-1 overflow-hidden bg-white transition-[margin-right] duration-300 ease-out"
          style={{ marginRight: (isAiSidebarVisible || isPersonalizationOpen) && !isCompactLayout ? 'min(560px, 100vw)' : '0px' }}
        >
           {tabs.map(tab => (!shouldMountBackgroundTabs && tab.id !== activeTabId && !tab.isMusic ? null : (
               <div 
                key={tab.id} 
                className={`absolute inset-0 w-full h-full ${tab.id === activeTabId ? 'z-10 visible' : 'z-0 invisible'}`}
                style={{ visibility: tab.id === activeTabId ? 'visible' : 'hidden' }}
               >
                   {tab.isSettings ? (
                       <Suspense fallback={<div className="flex h-full w-full items-center justify-center bg-white text-sm text-[#77787c]">Chargement des paramètres…</div>}>
                         <SettingsPage onClose={handleSettingsClose} />
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
                        !tab.hibernated ? (
                            <webview 
                                key={`${tab.id}-${tab.loadCount || 0}`}
                                ref={el => {
                                  webviewRefs.current[tab.id] = el;
                                }}
                                src={tab.initialUrl || tab.url} 
                                className="w-full h-full"
                                useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"
                            />
                        ) : (
                            <div className="flex h-full w-full flex-col items-center justify-center bg-[#f4f4f6] text-[#73737d]">
                                <p className="text-lg font-medium mb-2">Onglet en veille</p>
                                <p className="text-sm">Cliquez pour réactiver</p>
                            </div>
                        )
                   ) : tab.isMusic ? (
                       <Suspense fallback={<div className="flex h-full w-full items-center justify-center bg-white text-sm text-[#77787c]">Chargement de BlueMusic…</div>}>
                         <MusicPage
                           musicTabId={tab.id}
                           onPlaybackChange={handleMusicPlaybackChange}
                         />
                       </Suspense>
                   ) : (
                       <Suspense fallback={<div className="flex h-full w-full items-center justify-center bg-white text-sm text-[#77787c]">Chargement de Foxy…</div>}>
                         {isAiMode ? (
                           <AiPage isAiMode={isAiMode} onModeChange={handleModeChange} initialPrompt={aiInitialPrompt} hideUserPrompts hideModeSwitch onMusicOpen={handleMusicTab} onMusicPlayback={handleAiMusicPlayback} />
                         ) : (
                           <SpeedDial onNavigate={handleSearch} tabColor={tabColor} onTabColorChange={setTabColor} isPersonalizationOpen={isPersonalizationOpen} onPersonalizationChange={setIsPersonalizationOpen} homeBackground={homeBackground} />
                         )}
                       </Suspense>
                   )}
               </div>
           )))}

           {musicPlayback && activeTabId !== musicPlayback.tabId && !activeTab?.isPdf && !activeTab?.isSettings && !activeTab?.isSearching && (
             <button
               type="button"
               className="bluefox-music-background-dock"
               onClick={() => setActiveTabId(musicPlayback.tabId)}
               title={`Revenir à ${musicPlayback.title || musicPlayback.service}`}
               aria-label={`Musique en arrière-plan : ${musicPlayback.title || musicPlayback.service}`}
             >
               <MdMusicNote aria-hidden="true" />
               <span>{musicPlayback.title || musicPlayback.service}</span>
             </button>
           )}

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
            isOpen={isAiSidebarVisible}
            initialPrompt={activeAiSidebar?.initialPrompt || ''}
            isDocumentMode={Boolean(activeAiSidebar?.isDocumentMode)}
            documentText={activeAiSidebar?.documentText || ''}
            onAnswer={handlePdfAiAnswer}
            onMusicPlayback={handleAiMusicPlayback}
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
          setHomeBackground={setHomeBackground}
          tabColor={tabColor}
          onTabColorChange={setTabColor}
          resolvedTheme={resolvedTheme}
          onClose={() => setIsPersonalizationOpen(false)}
        />
      </Suspense>
    </div>
  );
}

export default App;
