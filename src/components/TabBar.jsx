import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { MdAdd, MdChevronLeft, MdChevronRight, MdClose, MdGamepad, MdPictureAsPdf, MdPublic, MdTune } from 'react-icons/md';

const ICON_COLOR = 'text-[#66676b]';
const BLUEFOX_LOGO = `${import.meta.env.BASE_URL}Logo.ico`;
const CLOSE_ANIMATION_MS = 180;
const DRAG_START_DISTANCE = 5;
const TAB_REORDER_ANIMATION_MS = 220;

const isDarkTabColor = (value) => {
  const match = String(value || '').match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!match) return false;
  const hex = match[1].length === 3 ? match[1].split('').map((part) => part + part).join('') : match[1];
  const [red, green, blue] = [0, 2, 4].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
  return (0.2126 * red + 0.7152 * green + 0.0722 * blue) < 92;
};

const TabVisual = ({
  tab,
  isActive,
  isClosing,
  isCrowded,
  tabDensity,
  tabColor,
  onTabClose,
  isPreview = false
}) => {
  const [faviconError, setFaviconError] = useState(false);

  useEffect(() => {
    setFaviconError(false);
  }, [tab.favicon]);

  return (
  <div
    draggable={false}
    onDragStart={(event) => event.preventDefault()}
    onAuxClick={(event) => {
      if (!isPreview && event.button === 1) {
        event.preventDefault();
        onTabClose(event, tab.id);
      }
    }}
    className={`bluefox-tab-visual ${isDarkTabColor(tabColor) ? 'bluefox-tab-dark' : ''} group relative flex h-8 ${tabDensity} shrink-0 items-center rounded-[9px] ${
      isPreview ? 'pointer-events-none' : 'cursor-pointer'
    } ${
      isClosing ? 'bluefox-tab-closing pointer-events-none' : 'bluefox-tab-enter'
    } ${
      isActive
        ? 'z-10 border border-[#d3d2cf] bg-white text-[#252525] shadow-[0_1px_4px_rgba(0,0,0,0.06)]'
        : 'text-[#68686b] hover:bg-[#e8e7e4] hover:text-[#252525]'
    } ${isActive ? 'bluefox-tab-active' : ''}`}
    style={{ '--bluefox-tab-color-value': tabColor }}
  >
    <div className={`relative ${isCrowded ? 'mr-1' : 'mr-2'} flex h-4 w-4 shrink-0 items-center justify-center`}>
      {tab.isGame || tab.offlineFallback ? (
        <MdGamepad className="bluefox-tab-game-icon h-full w-full text-[#7346bc]" aria-label="Jeu hors ligne" />
      ) : tab.isSettings ? (
        <MdTune className="h-full w-full text-[#137b8b]" aria-hidden="true" />
      ) : tab.isPdf ? (
        <MdPictureAsPdf className="h-full w-full text-[#d14b4b]" aria-label="Document PDF" />
      ) : tab.url && tab.favicon && !faviconError ? (
        <img
          draggable={false}
          src={tab.favicon}
          alt=""
          className={`h-full w-full object-contain transition-opacity duration-200 ${tab.isLoading ? 'opacity-40' : 'opacity-100'}`}
          onError={() => setFaviconError(true)}
        />
      ) : tab.url ? (
        <MdPublic className="bluefox-tab-fallback-icon h-full w-full" aria-label="Site sans icône" />
      ) : (
        <img draggable={false} src={BLUEFOX_LOGO} alt="" className="h-full w-full object-contain" />
      )}
      {tab.isLoading && <span className="absolute inset-0 animate-spin rounded-full border border-transparent border-r-[#66676b] border-t-[#66676b]" />}
    </div>

    <span className="bluefox-tab-title flex-1 truncate text-[12px] font-normal">
      {tab.isGame
        ? 'Tetris'
        : tab.isSettings
          ? 'Paramètres'
          : tab.title === 'Nouvel onglet' || tab.title === 'Accès rapide' ? 'Nouvel onglet' : tab.title}
    </span>

    {!isPreview && (
      <button
        type="button"
        onClick={(event) => onTabClose(event, tab.id)}
        className={`bluefox-tab-close ${isCrowded ? 'ml-1' : 'ml-2'} flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${ICON_COLOR} transition-[background-color,color,opacity,transform] duration-150 hover:bg-[#deddda] hover:text-[#252525] ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
        aria-label="Fermer l'onglet"
      >
        <MdClose className="text-[14px]" />
      </button>
    )}
  </div>
  );
};

const TabBar = React.memo(({
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
  onNewTab,
  onTabsReorder,
  isSettingsOpen = false,
  tabColor = '#f3f2f0'
}) => {
  const [closingTabs, setClosingTabs] = useState(() => new Set());
  const [dragState, setDragState] = useState(null);
  const tabStripRef = useRef(null);
  const dragSourceRef = useRef(null);
  const tabItemRefs = useRef(new Map());
  const tabsRef = useRef(tabs);
  const layoutRectsRef = useRef(new Map());
  const previousRectsRef = useRef(null);
  const flipAnimationsRef = useRef(new Map());
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

  useLayoutEffect(() => {
    tabsRef.current = tabs;
    const previousRects = previousRectsRef.current;
    previousRectsRef.current = null;

    const nextLayoutRects = new Map();
    tabs.forEach((tab) => {
      const element = tabItemRefs.current.get(tab.id);
      const previousRect = previousRects?.get(tab.id);
      if (!element) return;

      const currentRect = element.getBoundingClientRect();
      nextLayoutRects.set(tab.id, currentRect);
      if (!previousRect) return;

      flipAnimationsRef.current.get(tab.id)?.cancel();
      const deltaX = previousRect.left - currentRect.left;
      if (Math.abs(deltaX) < 0.5) return;

      const animation = element.animate(
        [
          { transform: `translateX(${deltaX}px)` },
          { transform: 'translateX(0)' }
        ],
        { duration: TAB_REORDER_ANIMATION_MS, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
      );
      flipAnimationsRef.current.set(tab.id, animation);
      animation.onfinish = () => {
        if (flipAnimationsRef.current.get(tab.id) === animation) {
          flipAnimationsRef.current.delete(tab.id);
        }
      };
    });
    layoutRectsRef.current = nextLayoutRects;
  }, [tabs]);

  useEffect(() => () => {
    flipAnimationsRef.current.forEach((animation) => animation.cancel());
  }, []);

  const scrollTabs = (direction) => {
    tabStripRef.current?.scrollBy({ left: direction * 320, behavior: 'smooth' });
  };

  const closeTab = (event, id) => {
    event.stopPropagation();
    if (closingTabs.has(id)) return;

    setClosingTabs((current) => new Set(current).add(id));
    window.setTimeout(async () => {
      const shouldClose = await onTabClose(id);
      setClosingTabs((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
      if (shouldClose === false) return;
    }, CLOSE_ANIMATION_MS);
  };

  const captureTabPositions = (currentTabs = tabsRef.current) => {
    const positions = new Map();
    currentTabs.forEach((tab) => {
      const element = tabItemRefs.current.get(tab.id);
      if (element) positions.set(tab.id, element.getBoundingClientRect());
    });
    flipAnimationsRef.current.forEach((animation) => animation.cancel());
    flipAnimationsRef.current.clear();
    previousRectsRef.current = positions;
  };

  const getDropIndex = (draggedId, pointerX, currentTabs = tabsRef.current) => {
    const remainingTabs = currentTabs.filter((tab) => tab.id !== draggedId);
    const targetPosition = remainingTabs.findIndex((tab) => {
      const rect = layoutRectsRef.current.get(tab.id);
      return rect ? pointerX < rect.left + rect.width / 2 : false;
    });
    return targetPosition < 0 ? remainingTabs.length : targetPosition;
  };

  const beginTabDrag = (event, tabId) => {
    if (event.button !== 0 || (event.target instanceof Element && event.target.closest('button'))) return;
    const item = tabItemRefs.current.get(tabId);
    if (!item) return;

    const rect = item.getBoundingClientRect();
    const stripRect = tabStripRef.current?.getBoundingClientRect();
    tabsRef.current = tabs;
    dragSourceRef.current = event.currentTarget;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDragState({
      id: tabId,
      pointerId: event.pointerId,
      startX: event.clientX,
      currentX: event.clientX,
      offsetX: event.clientX - rect.left,
      top: stripRect ? stripRect.top + (stripRect.height - rect.height) / 2 : rect.top,
      width: rect.width,
      height: rect.height,
      started: false
    });
  };

  const moveTabDrag = (event, tabId) => {
    const currentDrag = dragState;
    if (!currentDrag || currentDrag.id !== tabId || currentDrag.pointerId !== event.pointerId) return;

    const movedEnough = Math.abs(event.clientX - currentDrag.startX) >= DRAG_START_DISTANCE;
    if (!currentDrag.started && !movedEnough) return;
    event.preventDefault();

    if (!currentDrag.started) {
      setDragState((state) => state && { ...state, started: true, currentX: event.clientX });
    } else {
      setDragState((state) => state && { ...state, currentX: event.clientX });
    }

    // Use the pointer itself for the insertion threshold. This prevents the tab
    // from getting stuck when the pointer is held near the grabbed tab's edge.
    const currentTabs = tabsRef.current;
    const currentIndex = currentTabs.findIndex((tab) => tab.id === tabId);
    const targetIndex = getDropIndex(tabId, event.clientX, currentTabs);
    if (currentIndex < 0 || targetIndex === currentIndex || targetIndex < 0) return;

    const nextTabs = [...currentTabs];
    const [draggedTab] = nextTabs.splice(currentIndex, 1);
    nextTabs.splice(targetIndex, 0, draggedTab);
    captureTabPositions(currentTabs);
    // Keep a synchronous order reference so quick pointer events cannot all
    // calculate against the same stale React render.
    tabsRef.current = nextTabs;
    setDragState((state) => state && { ...state, currentX: event.clientX });
    onTabsReorder?.(tabId, targetIndex);
  };

  const getDragPreviewLeft = (currentDrag) => {
    const stripRect = tabStripRef.current?.getBoundingClientRect();
    const desiredLeft = currentDrag.currentX - currentDrag.offsetX;
    if (!stripRect) return desiredLeft;

    // Keep the lifted tab inside the visible tab strip. Vertical movement is ignored,
    // so a drag can never turn into a detached Electron window.
    const minLeft = stripRect.left;
    const maxLeft = Math.max(minLeft, stripRect.right - currentDrag.width);
    return Math.max(minLeft, Math.min(desiredLeft, maxLeft));
  };

  const finishTabDrag = (event, tabId) => {
    const currentDrag = dragState;
    if (!currentDrag || currentDrag.id !== tabId || currentDrag.pointerId !== event.pointerId) return;
    const dragSource = dragSourceRef.current;
    if (dragSource?.hasPointerCapture?.(event.pointerId)) {
      dragSource.releasePointerCapture(event.pointerId);
    }
    dragSourceRef.current = null;
    setDragState(null);
    if (!currentDrag.started && !closingTabs.has(tabId)) {
      onTabClick(tabId);
    }
  };

  const draggedTab = dragState ? tabs.find((tab) => tab.id === dragState.id) : null;

  return (
    <div className="drag-region bluefox-tab-bar flex h-12 items-center border-b border-[#d8d7d4] px-2 text-[#282828] select-none" style={{ '--bluefox-tab-color': tabColor }}>
      <div className="relative no-drag flex h-full min-w-0 flex-1 items-center">
        {canScrollLeft && <button type="button" onClick={() => scrollTabs(-1)} className="absolute left-0 z-20 flex h-8 w-8 items-center justify-center rounded-full bluefox-tab-control-bg text-[#66676b] shadow-[2px_0_8px_rgba(0,0,0,0.08)] hover:bg-[#e8e7e4]" aria-label="Onglets précédents"><MdChevronLeft className="text-xl" /></button>}
        <div
          ref={tabStripRef}
          className={`no-scrollbar flex h-full min-w-0 flex-1 items-center gap-1 overflow-x-auto pr-[138px] ${canScrollLeft ? 'pl-9' : ''} ${canScrollRight ? 'pr-[176px]' : ''}`}
          onPointerMove={(event) => {
            if (dragState) moveTabDrag(event, dragState.id);
          }}
          onPointerUp={(event) => {
            if (dragState) finishTabDrag(event, dragState.id);
          }}
          onPointerCancel={(event) => {
            if (dragState) finishTabDrag(event, dragState.id);
          }}
        >
          {tabs.map((tab, index) => {
            const isActive = tab.id === activeTabId;
            const isClosing = closingTabs.has(tab.id);
            const isDragged = dragState?.id === tab.id && dragState.started;
            return (
              <div
                key={tab.id}
                ref={(element) => {
                  if (element) tabItemRefs.current.set(tab.id, element);
                  else tabItemRefs.current.delete(tab.id);
                }}
                className={`bluefox-tab-item flex shrink-0 items-center ${isDragged ? 'bluefox-tab-drag-source' : ''}`}
                draggable={false}
                onDragStart={(event) => event.preventDefault()}
                onPointerDown={(event) => beginTabDrag(event, tab.id)}
              >
                {index > 0 && tabs[index - 1]?.id !== activeTabId && tab.id !== activeTabId && (
                  <span className="bluefox-tab-separator" aria-hidden="true" />
                )}
                <TabVisual
                  tab={tab}
                  isActive={isActive}
                  isClosing={isClosing}
                  isCrowded={isCrowded}
                  tabDensity={tabDensity}
                  tabColor={tabColor}
                  onTabClose={closeTab}
                />
              </div>
            );
          })}

          <button type="button" onClick={onNewTab} className={`no-drag flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${ICON_COLOR} transition-colors hover:bg-[#deddda] hover:text-[#252525]`} aria-label="Nouvel onglet">
            <MdAdd className="text-base" />
          </button>
        </div>
        {canScrollRight && <button type="button" onClick={() => scrollTabs(1)} className="absolute right-[138px] z-20 flex h-8 w-8 items-center justify-center rounded-full bluefox-tab-control-bg text-[#66676b] shadow-[-2px_0_8px_rgba(0,0,0,0.08)] hover:bg-[#e8e7e4]" aria-label="Onglets suivants"><MdChevronRight className="text-xl" /></button>}
      </div>

      {draggedTab && dragState?.started && (
        <div
          className="bluefox-tab-drag-preview"
          style={{
            left: `${getDragPreviewLeft(dragState)}px`,
            top: `${dragState.top}px`,
            width: `${dragState.width}px`,
            height: `${dragState.height}px`
          }}
        >
          <TabVisual
            tab={draggedTab}
            isActive={draggedTab.id === activeTabId}
            isClosing={false}
            isCrowded={isCrowded}
            tabDensity="w-full px-2.5"
            tabColor={tabColor}
            onTabClose={() => {}}
            isPreview
          />
        </div>
      )}

      {/* Native Windows minimize, maximize, and close controls are rendered by Electron's title-bar overlay. */}
      <style>{`
        .drag-region { -webkit-app-region: drag; }
        .no-drag { -webkit-app-region: no-drag; }
      `}</style>
    </div>
  );
});

export default TabBar;
