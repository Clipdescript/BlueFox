import React, { useState, useEffect } from 'react';
import { VscHistory, VscSettingsGear, VscClose, VscAdd, VscHeart, VscLibrary, VscComment, VscPlayCircle, VscClearAll, VscEllipsis, VscRefresh, VscSmiley, VscPin } from "react-icons/vsc"; 
import { MdDevices } from "react-icons/md"; 

const SidebarIcon = ({ icon, active = false, onClick, colorClass = "text-gray-600 hover:text-black", tooltip }) => (
  <div 
    onClick={onClick}
    className={`group relative flex items-center justify-center w-10 h-10 mb-4 rounded-lg cursor-pointer transition-all duration-300 hover:bg-gray-100 ${active ? `bg-gray-200 ${colorClass}` : colorClass}`}
  >
    {icon}
    <div className="absolute left-12 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-xl">
      {tooltip || 'Tooltip'}
    </div>
  </div>
);

const SidebarPanel = ({ isOpen, onClose, title = '', children }) => {
    const key = `sidebar_width_${title || 'default'}`;
    const [width, setWidth] = useState(() => {
        const v = parseInt(localStorage.getItem(key));
        // Default to wider for History to match the screenshot layout
        if (title === '' && !v) return 600; 
        return Number.isFinite(v) ? v : 320;
    });
    const [resizing, setResizing] = useState(false);
    useEffect(() => {
        const onMove = (e) => {
            const next = Math.max(240, Math.min(640, e.clientX - 64));
            setWidth(next);
            localStorage.setItem(key, String(next));
        };
        const onUp = () => setResizing(false);
        if (resizing) {
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
        }
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
    }, [resizing, key]);
    return (
        <div className={`absolute top-0 left-16 bottom-0 bg-white z-40 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ width }}>
            {/* Unified Custom Header for all panels */}
            <div className="h-12 flex items-center justify-between px-4 bg-white border-b border-gray-200">
                <div className="flex items-center space-x-3 text-gray-700">
                    <button className="hover:bg-black/5 p-1 rounded transition-colors">
                        <VscEllipsis className="text-xl transform rotate-90" />
                    </button>
                    <button 
                        className="hover:bg-black/5 p-1 rounded transition-colors" 
                        onClick={() => {
                            const newWidth = width === 375 ? 600 : 375;
                            setWidth(newWidth);
                            localStorage.setItem(key, String(newWidth));
                        }}
                        title="Vue mobile / Vue large"
                    >
                        <MdDevices className="text-xl" />
                    </button>
                </div>
                
                <span className="text-base font-medium text-gray-800">{title}</span>
                
                <div className="flex items-center space-x-3 text-gray-700">
                    <button className="hover:bg-black/5 p-1 rounded transition-colors">
                        <VscSmiley className="text-xl" />
                    </button>
                    <button className="hover:bg-black/5 p-1 rounded transition-colors" onClick={onClose}>
                        <VscPin className="text-xl transform rotate-[270deg]" />
                    </button>
                </div>
            </div>
            
            <div className="h-[calc(100%-48px)] bg-white relative">
                {children}
                <div
                  className="absolute top-0 right-0 bottom-0 w-2 cursor-col-resize z-50"
                  onMouseDown={() => setResizing(true)}
                />
            </div>
        </div>
    );
};

const Sidebar = React.memo(({ 
  goHome, 
  onSpotifyToggle, isSpotifyOpen, 
  onYouTubeToggle, isYouTubeOpen, 
  onWhatsAppToggle, isWhatsAppOpen, isWhatsAppOnline,
  onChatToggle, isChatOpen,
  onAddSiteToggle, isAddSiteOpen,
  customSites = [], onCustomToggle, openCustomSiteId,
  isMenuOpen, onMenuToggle, onNewTab, onZoomIn, onZoomOut, onZoomReset,
  onHistoryToggle, isHistoryOpen
}) => {
  const getFaviconUrl = (url) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
      return '';
    }
  };
  return (
    <>
        <div className="w-16 h-full bg-white flex flex-col items-center py-4 z-50 relative">
        <div className="mb-8 cursor-pointer hover:scale-110 transition-transform drop-shadow-sm w-10 h-10 flex items-center justify-center" onClick={onMenuToggle}>
            <img src="./Logo.ico" alt="Logo" className="w-8 h-8 object-contain" />
        </div>
        
        {/* Main Tools - Ordered: YouTube, Spotify, WhatsApp, ChatGPT */}
        <div className="flex-1 flex flex-col items-center overflow-y-auto no-scrollbar w-full">
            <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
            {/* YouTube Red - Toggle Panel */}
            <SidebarIcon 
                icon={
                  <img 
                    src={getFaviconUrl("https://www.youtube.com")} 
                    alt="YouTube" 
                    className="w-6 h-6 object-contain"
                  />
                } 
                colorClass="text-[#FF0000]" 
                active={isYouTubeOpen}
                tooltip="YouTube"
                onClick={onYouTubeToggle}
            />
            {/* Spotify Green - Toggle Panel */}
            <SidebarIcon 
                icon={
                  <img 
                    src={getFaviconUrl("https://open.spotify.com")} 
                    alt="Spotify" 
                    className="w-6 h-6 object-contain"
                  />
                } 
                colorClass="text-[#1DB954]" 
                active={isSpotifyOpen}
                tooltip="Spotify"
                onClick={onSpotifyToggle}
            /> 
            {/* WhatsApp Green */}
            <SidebarIcon 
                icon={
                  <div className="relative">
                    <img 
                        src={getFaviconUrl("https://whatsapp.com")} 
                        alt="WhatsApp" 
                        className="w-6 h-6 object-contain"
                    />
                    {isWhatsAppOnline && <span className="absolute w-2 h-2 bg-green-500 rounded-full bottom-0 right-0"></span>}
                  </div>
                } 
                colorClass="text-[#25D366]" 
                active={isWhatsAppOpen}
                tooltip="WhatsApp"
                onClick={onWhatsAppToggle}
            />
            {/* ChatGPT (OpenAI) */}
            <SidebarIcon 
                icon={
                  <img 
                    src={getFaviconUrl("https://chat.openai.com")} 
                    alt="ChatGPT" 
                    className="w-6 h-6 object-contain"
                  />
                } 
                colorClass="text-[#10A37F]" 
                active={isChatOpen}
                tooltip="ChatGPT"
                onClick={onChatToggle}
            />
            {/* Add Custom Site */}
            <SidebarIcon 
                icon={<VscAdd className="text-xl" />} 
                colorClass="text-gray-700" 
                active={isAddSiteOpen}
                tooltip="Ajouter un site"
                onClick={onAddSiteToggle}
            />
            {/* Custom Sites */}
            {customSites.map(site => (
              <SidebarIcon 
                key={site.id}
                icon={
                  <img 
                    src={getFaviconUrl(site.url)} 
                    alt={site.title} 
                    className="w-5 h-5"
                    onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                  />
                }
                colorClass="text-gray-700"
                active={openCustomSiteId === site.id}
                tooltip={site.title}
                onClick={() => onCustomToggle(site.id)}
              />
            ))}
            
            
        </div>

        {/* Bottom Tools */}
        <div className="mt-auto flex flex-col items-center">
            <SidebarIcon 
              icon={<VscHistory className="text-xl" />} 
              tooltip="Historique"
              active={isHistoryOpen} 
              onClick={onHistoryToggle} 
            />
            <SidebarIcon icon={<VscSettingsGear className="text-xl" />} tooltip="Paramètres" />
            <SidebarIcon icon={<VscEllipsis className="text-xl" />} tooltip="Plus" />
        </div>
        </div>
    </>
  );
});

export { Sidebar, SidebarPanel };
export default Sidebar;
