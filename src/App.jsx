import React, { useState, useRef, useEffect, useCallback } from 'react';
import Sidebar, { SidebarPanel } from './components/Sidebar';
import TopBar from './components/TopBar';
import TabBar from './components/TabBar';
import SpeedDial from './components/SpeedDial';
import { turboScript } from './utils/turbo';
import { VscArrowLeft, VscArrowRight, VscRefresh, VscSearch, VscHistory, VscTrash, VscEllipsis, VscSmiley, VscPin, VscClose } from "react-icons/vsc";

function App() {
  const savedTabs = localStorage.getItem('bluefox_tabs');
  const savedActiveId = localStorage.getItem('bluefox_active_tab_id');

  const [tabs, setTabs] = useState(savedTabs ? JSON.parse(savedTabs) : [
    { id: 1, title: 'Accès rapide', url: '', isSearching: false, favicon: '', isLoading: false }
  ]);
  const [activeTabId, setActiveTabId] = useState(savedActiveId ? parseInt(savedActiveId) : 1);
  const [isSpotifyOpen, setIsSpotifyOpen] = useState(false);
  const [isYouTubeOpen, setIsYouTubeOpen] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAddSiteOpen, setIsAddSiteOpen] = useState(false);
  const [customSites, setCustomSites] = useState([]);
  const [openCustomSiteId, setOpenCustomSiteId] = useState(null);
  const [addTitle, setAddTitle] = useState('');
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
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('bluefox_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [zoomFactor, setZoomFactor] = useState(1);
  const [activeSidebarApps, setActiveSidebarApps] = useState(new Set());
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);

  useEffect(() => {
    if (window.electron) {
        // Remove any existing listeners to prevent duplicates if hot-reloading
        const removeListener = window.electron.onCloseRequest(() => {
            console.log('Close request received');
            setShowQuitConfirm(true);
        });
        // Cleanup function if the API supports it (our current preload implementation returns nothing, but it's good practice for structure)
    }
  }, []);
  
  const handleQuit = () => {
      window.electron.forceClose();
  };
  // Save history effect
  useEffect(() => {
     localStorage.setItem('bluefox_history', JSON.stringify(history));
  }, [history]);

  const addToHistory = (title, url, favicon) => {
      if (!url || url.startsWith('bluefox://') || url.trim() === '') return;
      try {
          new URL(url); // Validate URL
      } catch (e) {
          return; // Ignore invalid URLs
      }
      setHistory(prev => {
          // Avoid duplicate top entry
          if (prev.length > 0 && prev[0].url === url) return prev;
          const newEntry = { 
              title: title || url, 
              url, 
              favicon,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
          };
          return [newEntry, ...prev].slice(0, 1000);
      });
  };

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
                case 'h':
                    e.preventDefault();
                    setIsHistoryOpen(prev => !prev);
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
  
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  const webviewRefs = useRef({});

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
    // Wake up active tab
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, hibernated: false } : t));
  }, [activeTabId]);

  useEffect(() => {
    const tabsToSave = tabs.map(({ id, title, url, isSearching, favicon }) => ({
        id, title, url, isSearching, favicon, isLoading: false 
    }));
    localStorage.setItem('bluefox_tabs', JSON.stringify(tabsToSave));
    localStorage.setItem('bluefox_active_tab_id', activeTabId.toString());
  }, [tabs, activeTabId]);

  const handleNewTab = useCallback(() => {
    const newId = Date.now();
    setTabs(prev => [...prev, { id: newId, title: 'Accès rapide', url: '', isSearching: false, favicon: '', isLoading: false }]);
    setActiveTabId(newId);
  }, []);

  const handleCloseTab = useCallback((id) => {
    setTabs(prev => {
        const newTabs = prev.filter(t => t.id !== id);
        if (newTabs.length === 0) {
             const newId = Date.now();
             setActiveTabId(newId);
             return [{ id: newId, title: 'Accès rapide', url: '', isSearching: false, favicon: '', isLoading: false }];
        }
        if (id === activeTabId) {
             setActiveTabId(newTabs[newTabs.length - 1].id);
        }
        return newTabs;
    });
    delete webviewRefs.current[id];
  }, [activeTabId]);

  const handleSearch = useCallback((query) => {
    let url = query.trim();
    if (!url.includes('.') || url.includes(' ')) {
      url = `https://www.google.com/search?q=${encodeURIComponent(url)}&safe=active`;
    } else if (!url.startsWith('http')) {
      url = `https://${url}`;
    }

    setTabs(prev => prev.map(t => 
      t.id === activeTabId 
        ? { ...t, url: url, isSearching: true, title: query, favicon: '', isLoading: true } 
        : t
    ));
  }, [activeTabId]);

  const goHome = useCallback(() => {
     setTabs(prev => prev.map(t => 
        t.id === activeTabId 
          ? { ...t, url: '', isSearching: false, title: 'Accès rapide', favicon: '', isLoading: false } 
          : t
      ));
  }, [activeTabId]);

  const handleReload = useCallback(() => {
     const webview = webviewRefs.current[activeTabId];
     if(webview) webview.reload();
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
      tabs.forEach(tab => {
          const webview = webviewRefs.current[tab.id];
          if (webview && !webview.dataset.listening) {
              webview.dataset.listening = "true";
              
              const updateState = () => {
                  setTabs(prev => prev.map(t => {
                      if (t.id === tab.id) {
                          const newTitle = webview.getTitle();
                          const newUrl = webview.getURL();
                          // Update history if URL changed and is valid
                          if (newUrl && newUrl !== t.url && !newUrl.startsWith('bluefox://')) {
                             // We use the current favicon or try to fetch it
                             let fav = t.favicon;
                             if (!fav) {
                                 try {
                                     fav = `https://www.google.com/s2/favicons?domain=${new URL(newUrl).hostname}&sz=64`;
                                 } catch (e) {
                                     fav = '';
                                 }
                             }
                             addToHistory(newTitle, newUrl, fav);
                          }
                          // Only update if something changed to avoid unnecessary re-renders
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
                  try {
                    webview.executeJavaScript(turboScript);
                  } catch(e) {}
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
              webview.addEventListener('did-navigate', (e) => {
                   setTabs(prev => prev.map(t => t.id === tab.id ? { ...t, url: e.url } : t));
              });
              
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
  const handleHistoryToggle = useCallback(() => setIsHistoryOpen(prev => !prev), []);

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
    <div className="flex h-screen w-screen bg-white text-black overflow-hidden border border-gray-300">
      <Sidebar 
        goHome={goHome} 
        onSpotifyToggle={handleSpotifyToggle}
        isSpotifyOpen={isSpotifyOpen}
        onYouTubeToggle={handleYouTubeToggle}
        isYouTubeOpen={isYouTubeOpen}
        onWhatsAppToggle={handleWhatsAppToggle}
        isWhatsAppOpen={isWhatsAppOpen}
        isWhatsAppOnline={isWhatsAppOnline}
        onChatToggle={handleChatToggle}
        isChatOpen={isChatOpen}
        onAddSiteToggle={handleAddSiteToggle}
        isAddSiteOpen={isAddSiteOpen}
        customSites={customSites}
        onCustomToggle={handleCustomToggle}
        openCustomSiteId={openCustomSiteId}
        isMenuOpen={isMenuOpen}
        onMenuToggle={handleMenuToggle}
        onNewTab={handleNewTab}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
        onHistoryToggle={handleHistoryToggle}
        isHistoryOpen={isHistoryOpen}
      />

      {/* Quit Confirmation Popup */}
      {showQuitConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-2xl w-[500px] border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200 relative z-[10000]">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-white">
                    <h3 className="text-lg font-semibold text-gray-800">Quitter BlueFox ?</h3>
                    <button onClick={() => setShowQuitConfirm(false)} className="text-gray-500 hover:text-black">
                        <VscClose className="text-xl" />
                    </button>
                </div>
                
                {/* Content */}
                <div className="px-6 py-6 bg-white">
                    <p className="text-gray-600 text-sm leading-relaxed">
                        Vous allez quitter BlueFox en fermant <span className="font-bold text-gray-800">{tabs.length} onglets</span>, mais ils seront restaurés au prochain redémarrage de BlueFox. Êtes-vous sûr ?
                    </p>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-t border-gray-100">
                    <button className="px-4 py-2 bg-[#e8e8e8] hover:bg-[#dcdcdc] text-gray-700 text-sm font-medium rounded transition-colors">
                        Ne plus m'avertir
                    </button>
                    <div className="flex space-x-3">
                        <button 
                            onClick={handleQuit}
                            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-semibold rounded border border-gray-300 transition-colors"
                        >
                            Quitter BlueFox
                        </button>
                        <button 
                            onClick={() => setShowQuitConfirm(false)}
                            className="px-6 py-2 bg-[#e8e8e8] hover:bg-[#dcdcdc] text-gray-700 text-sm font-medium rounded transition-colors"
                        >
                            Annuler
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Spotify Sidebar Panel (Persistent Webview) */}
      <SidebarPanel title="Spotify" isOpen={isSpotifyOpen} onClose={() => setIsSpotifyOpen(false)}>
         {/* Persistent Webview for Spotify - Loaded only when activated once */}
         {(isSpotifyOpen || activeSidebarApps.has('spotify')) && (
           <webview 
              src="https://open.spotify.com"
              className="w-full h-full"
              useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
              allowpopups="true"
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
              useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
              allowpopups="true"
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
              useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
              allowpopups="true"
           />
         )}
      </SidebarPanel>

      {/* ChatGPT Sidebar Panel */}
      <SidebarPanel title="ChatGPT" isOpen={isChatOpen} onClose={() => setIsChatOpen(false)}>
         {(isChatOpen || activeSidebarApps.has('chatgpt')) && (
           <webview 
              src="https://chat.openai.com"
              className="w-full h-full"
              useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
              allowpopups="true"
           />
         )}
      </SidebarPanel>

      {/* Add Custom Site Panel */}
      <SidebarPanel title="Ajouter un site" isOpen={isAddSiteOpen} onClose={() => setIsAddSiteOpen(false)}>
         <div className="w-full h-full bg-white text-black p-4">
           <div className="space-y-3">
             <input 
               type="text" 
               value={addTitle} 
               onChange={(e) => setAddTitle(e.target.value)} 
               placeholder="Nom du site" 
               className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-600"
             />
             <input 
               type="text" 
               value={addUrl} 
               onChange={(e) => setAddUrl(e.target.value)} 
               placeholder="URL (https://...)" 
               className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-600"
             />
             <button 
               className="w-full bg-blue-600 text-white rounded px-3 py-2"
               onClick={() => {
                 if (!addUrl) return;
                 const id = Date.now();
                 setCustomSites(prev => [...prev, { id, title: addTitle || addUrl, url: addUrl }]);
                 setOpenCustomSiteId(id);
                 setAddSiteOpen(false);
                 setAddTitle('');
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
                useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
                allowpopups="true"
             />
           )}
        </SidebarPanel>
      ))}

      {/* History Panel */}
      <SidebarPanel title="Historique" isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)}>
        <div className="w-full h-full bg-white text-black overflow-hidden flex flex-col">

            {/* Search & Filter */}
            <div className="px-6 py-4 flex gap-4">
                <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <VscSearch className="text-gray-400" />
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
                    <div className="p-8 text-gray-500 text-sm text-center bg-gray-50 rounded-lg border border-gray-100 mt-2">
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
                                            setIsHistoryOpen(false);
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
        <div className="w-full h-full bg-white text-black p-0 overflow-y-auto">
            <div className="px-4 py-3 text-xs tracking-widest font-semibold text-gray-600">MENU</div>
            <div className="px-2 py-1">
              <button className="w-full flex items-center justify-between px-3 py-2 rounded hover:bg-gray-100" onClick={handleNewTab}>
                <span>Nouvel onglet</span>
                <span className="text-gray-500 text-[10px]">Ctrl + T</span>
              </button>
              <div className="mt-1 border-t border-gray-200" />
              <div className="px-3 py-2 text-gray-600">Zoom</div>
              <div className="flex items-center px-3 pb-2 space-x-2">
                <button 
                  className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200" 
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
                  className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200" 
                  onClick={() => {
                    setZoomFactor(1);
                    const w = webviewRefs.current[activeTabId];
                    if (w && w.setZoomFactor) w.setZoomFactor(1);
                  }}
                >
                  100%
                </button>
                <button 
                  className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200" 
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
              <button className="w-full flex items-center justify-between px-3 py-2 rounded hover:bg-gray-100" onClick={() => window.electron?.close()}>
                <span>Quitter</span>
              </button>
            </div>
        </div>
      </SidebarPanel>

      <div className="flex flex-col flex-1 h-full overflow-hidden relative z-0">
        <TabBar 
            tabs={tabs} 
            activeTabId={activeTabId} 
            onTabClick={setActiveTabId} 
            onTabClose={handleCloseTab}
            onNewTab={handleNewTab}
        />

        <TopBar 
            onSearch={handleSearch} 
            currentUrl={activeTab.url} 
            onReload={handleReload}
            onBack={handleBack}
            onForward={handleForward}
            currentFavicon={activeTab.favicon}
        />

        <main className="flex-1 relative overflow-hidden bg-white">
           {tabs.map(tab => (
               <div 
                key={tab.id} 
                className={`absolute inset-0 w-full h-full ${tab.id === activeTabId ? 'z-10 visible' : 'z-0 invisible'}`}
                style={{ visibility: tab.id === activeTabId ? 'visible' : 'hidden' }}
               >
                   {tab.isSearching ? (
                        !tab.hibernated ? (
                            <webview 
                                ref={el => {
                                  webviewRefs.current[tab.id] = el;
                                }}
                                src={tab.url} 
                                className="w-full h-full"
                                allowpopups="true"
                                useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-500">
                                <p className="text-lg font-medium mb-2">Onglet en veille</p>
                                <p className="text-sm">Cliquez pour réactiver</p>
                            </div>
                        )
                   ) : (
                       <SpeedDial onNavigate={handleSearch} />
                   )}
               </div>
           ))}

           {/* Floating Mini YouTube Player */}
           {isYouTubeOpen && showMiniPlayer && miniSrc && (
             <div 
               className="absolute z-50 w-[360px] h-[220px] bg-black rounded-lg shadow-lg border border-gray-700 overflow-hidden select-none"
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
                 allowpopups="true"
                 useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
               />
             </div>
           )}

           {/* Drag movement listeners */}
           {dragging && (
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
    </div>
  );
}

export default App;
