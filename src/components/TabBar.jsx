import React from 'react';
import { VscChromeClose, VscChromeMaximize, VscChromeMinimize, VscAdd, VscSettingsGear, VscDeviceCamera, VscWindow } from "react-icons/vsc"; 

const TabBar = React.memo(({ tabs, activeTabId, onTabClick, onTabClose, onNewTab }) => {
  return (
    <div className="h-10 bg-[#dee1e6] flex items-end pt-2 px-2 drag-region select-none">
      {/* Tabs Container */}
      <div className="flex-1 flex items-center h-full space-x-1 overflow-x-auto no-scrollbar no-drag mr-4">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => onTabClick(tab.id)}
            className={`
              group relative flex items-center min-w-[150px] max-w-[200px] h-full px-3 rounded-t-lg cursor-pointer transition-colors shadow-sm
              ${tab.id === activeTabId 
                ? 'bg-white text-black z-10' 
                : 'bg-transparent text-gray-600 hover:bg-white/50'}
            `}
          >
             {/* Divider for inactive tabs */}
             {tab.id !== activeTabId && (
                 <div className="absolute right-0 top-2 bottom-2 w-[1px] bg-gray-400/30"></div>
             )}

            {/* Icon Logic: Loading + Favicon Combo */}
            <div className="relative w-4 h-4 mr-2 flex items-center justify-center">
                {/* Background Favicon or Default Icon */}
                {tab.url && tab.favicon ? (
                    <img src={tab.favicon} alt="" className={`w-full h-full object-contain ${tab.isLoading ? 'opacity-50' : ''}`} />
                ) : (
                    <VscWindow className={`w-full h-full text-blue-600 ${tab.isLoading ? 'opacity-50' : ''}`} />
                )}

                {/* Loading Spinner Overlay */}
                {tab.isLoading && (
                    <div className="absolute inset-0 border-2 border-transparent border-t-blue-600 border-r-blue-600 rounded-full animate-spin"></div>
                )}
            </div>
            
            <span className={`text-xs truncate flex-1 font-medium ${(!tab.url && !tab.isLoading) ? 'ml-0' : ''}`}>
                {tab.title === 'Nouvel onglet' ? 'Accès rapide' : tab.title}
            </span>
            
            <button 
              onClick={(e) => { e.stopPropagation(); onTabClose(tab.id); }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded-full text-[10px] text-gray-600 ml-2"
            >
              <VscChromeClose />
            </button>
          </div>
        ))}
        
        {/* New Tab Button */}
        <button 
            onClick={onNewTab}
            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-300 rounded-full transition-colors ml-1"
        >
            <VscAdd className="text-lg" />
        </button>
      </div>

      {/* Window Controls & Top Right Icons */}
      <div className="flex items-center no-drag h-full pb-1 mr-[140px]">
         {/* Extra Icons - Desktop Style */}
        <div className="flex items-center space-x-3 text-gray-600 h-5">
           <VscDeviceCamera className="hover:text-black cursor-pointer text-lg" />
           <VscSettingsGear className="hover:text-black cursor-pointer text-lg" />
        </div>
      </div>
      
      <style>{`
        .drag-region { -webkit-app-region: drag; }
        .no-drag { -webkit-app-region: no-drag; }
      `}</style>
    </div>
  );
});

export default TabBar;
