import React, { useEffect, useRef, useState } from 'react';
import { MdAdd, MdChevronLeft, MdChevronRight, MdClose } from 'react-icons/md';

const ICON_COLOR = 'text-[#66676b]';
const CLOSE_ANIMATION_MS = 180;

const TabBar = React.memo(({ tabs, activeTabId, onTabClick, onTabClose, onNewTab }) => {
  const [closingTabs, setClosingTabs] = useState(() => new Set());
  const tabStripRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const isCrowded = tabs.length >= 7;
  const tabDensity = tabs.length >= 12
    ? 'min-w-[66px] max-w-[120px] px-1.5'
    : tabs.length >= 7
      ? 'min-w-[82px] max-w-[155px] px-2'
      : 'min-w-[125px] max-w-[220px] px-2.5';

  const updateScrollState = () => {
    const strip = tabStripRef.current;
    if (!strip) return;
    setCanScrollLeft(strip.scrollLeft > 2);
    setCanScrollRight(strip.scrollLeft + strip.clientWidth < strip.scrollWidth - 2);
  };

  useEffect(() => {
    setClosingTabs((current) => {
      const visibleIds = new Set(tabs.map((tab) => tab.id));
      const next = new Set([...current].filter((id) => visibleIds.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [tabs]);

  useEffect(() => {
    const strip = tabStripRef.current;
    if (!strip) return undefined;
    updateScrollState();
    strip.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      strip.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [tabs.length]);

  const scrollTabs = (direction) => {
    tabStripRef.current?.scrollBy({ left: direction * 320, behavior: 'smooth' });
  };

  const closeTab = (event, id) => {
    event.stopPropagation();
    if (closingTabs.has(id)) return;

    setClosingTabs((current) => new Set(current).add(id));
    window.setTimeout(() => {
      onTabClose(id);
      setClosingTabs((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }, CLOSE_ANIMATION_MS);
  };

  return (
    <div className="drag-region flex h-12 items-center border-b border-[#d8d7d4] bg-[#f3f2f0] px-2 text-[#282828] select-none">
      <div className="relative no-drag flex h-full min-w-0 flex-1 items-center">
        {canScrollLeft && <button type="button" onClick={() => scrollTabs(-1)} className="absolute left-0 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-[#f3f2f0] text-[#66676b] shadow-[2px_0_8px_rgba(0,0,0,0.08)] hover:bg-[#e8e7e4]" aria-label="Onglets précédents"><MdChevronLeft className="text-xl" /></button>}
      <div ref={tabStripRef} className={`no-scrollbar flex h-full min-w-0 flex-1 items-center gap-1 overflow-x-auto pr-[138px] ${canScrollLeft ? 'pl-9' : ''} ${canScrollRight ? 'pr-[176px]' : ''}`}>
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTabId;
          const isClosing = closingTabs.has(tab.id);
          return (
            <React.Fragment key={tab.id}>
              {index > 0 && <span className="mx-0.5 h-4 w-px shrink-0 bg-[#d2d1ce]" aria-hidden="true" />}
              <div
              onClick={() => !isClosing && onTabClick(tab.id)}
              className={`group relative flex h-8 ${tabDensity} shrink-0 cursor-pointer items-center rounded-[9px] transition-[background-color,color,box-shadow,opacity,transform] duration-200 ease-out ${
                isClosing ? 'bluefox-tab-closing pointer-events-none' : 'bluefox-tab-enter'
              } ${
                isActive
                  ? 'z-10 border border-[#d3d2cf] bg-white text-[#252525] shadow-[0_1px_4px_rgba(0,0,0,0.06)]'
                  : 'text-[#68686b] hover:bg-[#e8e7e4] hover:text-[#252525]'
              }`}
            >                <div className={`relative ${isCrowded ? 'mr-1' : 'mr-2'} flex h-4 w-4 shrink-0 items-center justify-center`}>
                {tab.url && tab.favicon ? (
                  <img src={tab.favicon} alt="" className={`h-full w-full object-contain transition-opacity duration-200 ${tab.isLoading ? 'opacity-40' : 'opacity-100'}`} />
                ) : (
                  <img src="./Logo.ico" alt="" className="h-full w-full object-contain" />
                )}
                {tab.isLoading && <span className="absolute inset-0 animate-spin rounded-full border border-transparent border-r-[#66676b] border-t-[#66676b]" />}
              </div>

              <span className="flex-1 truncate text-[12px] font-normal">
                {tab.title === 'Nouvel onglet' || tab.title === 'Accès rapide' ? 'Nouvel onglet' : tab.title}
              </span>

              <button
                type="button"
                onClick={(event) => closeTab(event, tab.id)}
                className={`bluefox-tab-close ${isCrowded ? 'ml-1' : 'ml-2'} flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${ICON_COLOR} transition-[background-color,color,opacity,transform] duration-150 hover:bg-[#deddda] hover:text-[#252525] ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                aria-label="Fermer l'onglet"
              >
                <MdClose className="text-[14px]" />
              </button>
              </div>
            </React.Fragment>
          );
        })}

        <button type="button" onClick={onNewTab} className={`no-drag flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${ICON_COLOR} transition-colors hover:bg-[#deddda] hover:text-[#252525]`} aria-label="Nouvel onglet">
          <MdAdd className="text-base" />
        </button>
      </div>
        {canScrollRight && <button type="button" onClick={() => scrollTabs(1)} className="absolute right-[138px] z-20 flex h-8 w-8 items-center justify-center rounded-full bg-[#f3f2f0] text-[#66676b] shadow-[-2px_0_8px_rgba(0,0,0,0.08)] hover:bg-[#e8e7e4]" aria-label="Onglets suivants"><MdChevronRight className="text-xl" /></button>}
      </div>

      {/* Native Windows minimize, maximize, and close controls are rendered by Electron's title-bar overlay. */}

      <style>{`
        .drag-region { -webkit-app-region: drag; }
        .no-drag { -webkit-app-region: no-drag; }
      `}</style>
    </div>
  );
});

export default TabBar;
