import React, { useState, useEffect, useRef } from 'react';
import {
  MdAccountBalanceWallet,
  MdAccountCircle,
  MdAddBox,
  MdArrowBack,
  MdArrowForward,
  MdConstruction,
  MdChatBubbleOutline,
  MdDeleteSweep,
  MdDownload,
  MdExpandMore,
  MdExitToApp,
  MdExtension,
  MdFavoriteBorder,
  MdHelpOutline,
  MdHistory,
  MdHomeFilled,
  MdKey,
  MdLock,
  MdMic,
  MdMusicNote,
  MdPrint,
  MdPictureAsPdf,
  MdPublic,
  MdRefresh,
  MdSearch,
  MdSecurity,
  MdSettingsSuggest,
  MdMenu,
  MdViewSidebar,
  MdWindow,
  MdZoomIn,
} from 'react-icons/md';
import fetchJsonp from 'fetch-jsonp';

const ICON_COLOR = 'text-[#6d6e72]';
const BLUEFOX_LOGO = `${import.meta.env.BASE_URL}Logo.ico`;
const BLUEFOX_ADDONS_URL = 'https://bluefox-add-ons.pages.dev/';
const SEARCH_ENGINE_ICON = 'https://www.google.com/s2/favicons?domain=google.com&sz=64';

const formatCompactAddress = (url) => {
  if (!url) return '';
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol === 'bluefox:') return url;
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) return url.replace(/^[a-z]+:\/\//i, '');
    return `${parsedUrl.hostname.replace(/^www\./i, '')}${parsedUrl.port ? `:${parsedUrl.port}` : ''}`;
  } catch {
    return url.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
  }
};

const MenuLogo = ({ className = '' }) => <img src={BLUEFOX_LOGO} alt="" className={`h-4 w-4 object-contain ${className}`} />;

const MenuRow = ({ icon: Icon, children, shortcut, onClick }) => (
  <button type="button" onClick={onClick} className="flex min-h-7 w-full items-center gap-2 rounded-md px-2 py-1 text-left text-[12px] text-[#303134] transition-colors hover:bg-[#f0efed]">
    <Icon className="shrink-0 text-[16px] text-[#5f6368]" />
    <span className="min-w-0 flex-1 truncate">{children}</span>
    {shortcut && <span className="shrink-0 text-[11px] text-[#6d6e72]">{shortcut}</span>}
  </button>
);

const TopBar = React.memo(({ onSearch, currentUrl, currentFavicon, isAiMode, isSettingsOpen, showHomeButton, onHome, onReload, onBack, onForward, onAssistant, onSettings, onMusicOpen, onModeChange, isAssistantActive, onNewTab, onOpenPdf, onPrint, onNewWindow, onZoomOut, onZoomIn, zoomFactor = 1 }) => {
  const [inputVal, setInputVal] = useState('');
  const [isAddressFocused, setIsAddressFocused] = useState(false);
  const [isFaviconBroken, setIsFaviconBroken] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!suggestions.length) return undefined;
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = `https://www.google.com/search?q=${encodeURIComponent(suggestions[0])}`;
    document.head.appendChild(link);
    return () => {
      try { document.head.removeChild(link); } catch { /* already removed */ }
    };
  }, [suggestions]);

  useEffect(() => setInputVal(currentUrl || ''), [currentUrl]);
  useEffect(() => setIsFaviconBroken(false), [currentFavicon, currentUrl, isAiMode, isSettingsOpen]);

  useEffect(() => {
    if (!isMenuOpen) return undefined;

    const closeMenu = (event) => {
      if (!menuRef.current?.contains(event.target)) setIsMenuOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsMenuOpen(false);
    };
    document.addEventListener('mousedown', closeMenu);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeMenu);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (inputVal.length > 1 && document.activeElement?.tagName === 'INPUT') {
        try {
          const response = await fetchJsonp(`https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(inputVal)}&hl=fr`);
          if (response.ok) {
            const data = await response.json();
            setSuggestions(data[1] || []);
            setShowSuggestions(true);
          }
        } catch {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } else if (inputVal.length <= 1) {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 120);
    return () => clearTimeout(timer);
  }, [inputVal]);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      onSearch(inputVal);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion) => {
    setInputVal(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div className="sticky top-0 z-50 flex h-12 items-center gap-2 border-b border-[#e1e0dd] bg-[#fffefe] px-3 text-[#202124]">
      <div className="flex shrink-0 items-center gap-0.5">
        <button type="button" onClick={onBack} className={`flex h-9 w-9 items-center justify-center rounded-full ${ICON_COLOR} transition-colors hover:bg-[#f0efed] hover:text-[#292929]`} aria-label="Page précédente"><MdArrowBack className="text-[19px]" /></button>
        <button type="button" onClick={onForward} className={`flex h-9 w-9 items-center justify-center rounded-full ${ICON_COLOR} transition-colors hover:bg-[#f0efed] hover:text-[#292929]`} aria-label="Page suivante"><MdArrowForward className="text-[19px]" /></button>
        <button type="button" onClick={onReload} className={`flex h-9 w-9 items-center justify-center rounded-full ${ICON_COLOR} transition-colors hover:bg-[#f0efed] hover:text-[#292929]`} aria-label="Actualiser"><MdRefresh className="text-[19px]" /></button>
        {showHomeButton && <button type="button" onClick={onHome} className={`flex h-9 w-9 items-center justify-center rounded-full ${ICON_COLOR} transition-colors hover:bg-[#f0efed] hover:text-[#292929]`} aria-label="Accueil" title="Accueil"><MdHomeFilled className="text-[19px]" /></button>}
      </div>

      <div className="relative min-w-0 flex-1">
        <div className="bluefox-address-bar flex h-9 items-center rounded-[9px] border border-[#a9d5dd] bg-white px-3 transition-[border-color,box-shadow] focus-within:border-[#16899b] focus-within:ring-2 focus-within:ring-[#d9f0f3]">
          {isSettingsOpen ? (
            <MdSettingsSuggest className="mr-2 h-[18px] w-[18px] shrink-0 text-[#137b8b]" aria-hidden="true" />
          ) : isAiMode ? (
            <img src={BLUEFOX_LOGO} alt="BlueFox" className="mr-2 h-[18px] w-[18px] object-contain" />
          ) : currentFavicon && !isFaviconBroken ? (
            <img
              src={currentFavicon}
              alt="Icône du site"
              className="mr-2 h-[18px] w-[18px] object-contain"
              onError={() => setIsFaviconBroken(true)}
            />
          ) : !currentUrl && !isFaviconBroken ? (
            <img
              src={SEARCH_ENGINE_ICON}
              alt="Moteur de recherche Google"
              className="mr-2 h-[18px] w-[18px] object-contain"
              onError={() => setIsFaviconBroken(true)}
            />
          ) : (
            <MdSearch className="bluefox-address-fallback-icon mr-2 h-[18px] w-[18px] shrink-0" aria-label="Moteur de recherche" />
          )}
          <input
            type="text"
            className="w-full bg-transparent text-[13px] text-[#292929] outline-none placeholder:text-[#77787b]"
            placeholder="Rechercher ou saisir une adresse"
            value={isAddressFocused ? inputVal : formatCompactAddress(currentUrl)}
            onChange={(event) => setInputVal(event.target.value)}
            onClick={(event) => event.currentTarget.select()}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              setIsAddressFocused(false);
              setTimeout(() => setShowSuggestions(false), 200);
            }}
            onFocus={() => {
              setIsAddressFocused(true);
              if (inputVal.length > 1) setShowSuggestions(true);
            }}
          />
          <button type="button" onClick={() => onSearch(inputVal)} className={`ml-1 flex h-7 w-7 items-center justify-center rounded-full ${ICON_COLOR} hover:bg-[#f0efed] hover:text-[#292929]`} aria-label="Rechercher"><MdSearch className="text-[17px]" /></button>
          <button type="button" className={`ml-0.5 flex h-7 w-7 items-center justify-center rounded-full ${ICON_COLOR} hover:bg-[#f0efed] hover:text-[#292929]`} aria-label="Recherche vocale"><MdMic className="text-[17px]" /></button>
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-11 z-[100] overflow-hidden rounded-b-[10px] border border-[#d7d6d3] bg-white py-1 shadow-lg">
            {suggestions.map((suggestion, index) => (
              <button type="button" key={`${suggestion}-${index}`} className="flex w-full items-center px-3 py-2 text-left text-sm text-[#4f5054] hover:bg-[#f2f7f8] hover:text-[#202124]" onMouseDown={() => selectSuggestion(suggestion)}>
                <MdSearch className={`mr-3 ${ICON_COLOR}`} />{suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <button type="button" onClick={onAssistant} className={`hidden h-9 items-center gap-1 rounded-full px-2 text-[13px] transition-colors lg:flex ${isAssistantActive ? 'bg-[#f0efed] text-[#292929]' : 'text-[#68696d] hover:bg-[#f0efed] hover:text-[#292929]'}`} aria-label={isAssistantActive ? 'Fermer Assistant' : 'Ouvrir Assistant'} aria-pressed={isAssistantActive}><MdChatBubbleOutline className="text-[17px]" /><span>Assistant</span><MdExpandMore className="text-[16px] transition-transform duration-200" /></button>
        <div className="hidden items-center gap-1.5 lg:flex" aria-label="Mode de navigation">
          <button
            type="button"
            onClick={() => onModeChange?.(!isAiMode)}
            className="bluefox-topbar-mode-switch relative flex h-8 w-[96px] items-center rounded-full border p-1 text-[10px] font-semibold tracking-wide transition-colors"
            role="switch"
            aria-checked={isAiMode}
            aria-label="Basculer entre le mode Web et le mode IA"
            title={isAiMode ? 'Mode IA' : 'Mode Web'}
          >
            <span className="absolute left-1 top-1 h-6 w-[44px] rounded-full shadow-sm transition-transform duration-200 ease-out" style={{ transform: isAiMode ? 'translateX(44px)' : 'translateX(0)' }} />
            <span className={`bluefox-topbar-mode-label ${isAiMode ? 'is-inactive' : 'is-active'} relative z-10 flex w-1/2 justify-center`}>WEB</span>
            <span className={`bluefox-topbar-mode-label ${isAiMode ? 'is-active' : 'is-inactive'} relative z-10 flex w-1/2 justify-center`}>IA</span>
          </button>
        </div>
        <button type="button" className={`flex h-9 w-9 items-center justify-center rounded-full ${ICON_COLOR} transition-colors hover:bg-[#f0efed] hover:text-[#292929]`} aria-label="Profil"><MdAccountCircle className="text-[21px]" /></button>
        <button type="button" onClick={onMusicOpen} className="flex h-9 w-9 items-center justify-center rounded-full text-[#7c3aed] transition-colors hover:bg-[#f1edff] hover:text-[#6d28d9]" aria-label="Ouvrir BlueMusic" title="BlueMusic"><MdMusicNote className="text-[21px]" /></button>
        <button type="button" onClick={() => onSearch(BLUEFOX_ADDONS_URL)} className="flex h-9 w-9 items-center justify-center rounded-full text-[#137b8b] transition-colors hover:bg-[#e8f5f7] hover:text-[#0b6573]" aria-label="Ouvrir BlueFox Add Ons" title="Extensions BlueFox"><MdExtension className="text-[21px]" /></button>
        <div ref={menuRef} className={`relative ${isSettingsOpen ? 'hidden' : ''}`}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            className={`flex h-9 w-9 items-center justify-center rounded-full ${isMenuOpen ? 'bg-[#f0efed] text-[#292929]' : ICON_COLOR} transition-colors hover:bg-[#f0efed] hover:text-[#292929]`}
            aria-label="Ouvrir le menu"
            aria-expanded={isMenuOpen}
          >
            <MdMenu className="text-[20px]" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-11 z-[200] max-h-[calc(100vh-76px)] w-[320px] overflow-hidden rounded-lg border border-[#deddd9] bg-white p-1.5 text-[#303134] shadow-none">
              <MenuRow icon={MdAddBox} shortcut="Ctrl+T" onClick={() => { onNewTab?.(); setIsMenuOpen(false); }}>Nouvel onglet</MenuRow>
              <MenuRow icon={MdPictureAsPdf} onClick={async () => { await onOpenPdf?.(); setIsMenuOpen(false); }}>Ouvrir un PDF</MenuRow>
              <MenuRow icon={MdWindow} shortcut="Ctrl+N" onClick={() => { onNewWindow?.(); setIsMenuOpen(false); }}>Nouvelle fenêtre</MenuRow>
              <MenuRow icon={MdLock} shortcut="Ctrl+Maj+N">Nouvelle fenêtre privée</MenuRow>

              <div className="my-1 border-t border-[#e7e6e3]" />
              <MenuRow icon={MenuLogo}>Foxy IA</MenuRow>
              <MenuRow icon={MdAccountBalanceWallet}>Portefeuille</MenuRow>
              <MenuRow icon={MdSecurity}>VPN BlueFox</MenuRow>

              <div className="my-1 border-t border-[#e7e6e3]" />
              <MenuRow icon={MdViewSidebar} shortcut="Activé" onClick={() => { onAssistant?.(); setIsMenuOpen(false); }}>Barre latérale</MenuRow>
              <MenuRow icon={MdKey}>Mots de passe et saisie automatique</MenuRow>
              <MenuRow icon={MdHistory}>Historique</MenuRow>
              <MenuRow icon={MdFavoriteBorder}>Favoris et listes</MenuRow>
              <MenuRow icon={MdDownload} shortcut="Ctrl+J">Téléchargements</MenuRow>
              <MenuRow icon={MdExtension}>Extensions</MenuRow>
              <MenuRow icon={MdDeleteSweep} shortcut="Ctrl+Maj+Suppr">Supprimer les données de navigation…</MenuRow>

              <div className="my-1 border-t border-[#e7e6e3]" />
              <div className="flex items-center gap-2 rounded-md px-2 py-1 text-[12px]">
                <MdZoomIn className="shrink-0 text-[16px] text-[#5f6368]" />
                <span className="flex-1">Zoom</span>
                <button type="button" onClick={onZoomOut} className="px-1.5 text-base leading-none hover:text-[#137b8b]" aria-label="Réduire le zoom">−</button>
                <span className="text-[11px]">{Math.round(zoomFactor * 100)} %</span>
                <button type="button" onClick={onZoomIn} className="px-1.5 text-base leading-none hover:text-[#137b8b]" aria-label="Augmenter le zoom">+</button>
              </div>

              <div className="my-1 border-t border-[#e7e6e3]" />
              <MenuRow icon={MdPrint} shortcut="Ctrl+P" onClick={() => { onPrint?.(); setIsMenuOpen(false); }}>Imprimer…</MenuRow>
              <MenuRow icon={MdSearch}>Rechercher et modifier</MenuRow>
              <MenuRow icon={MdDownload}>Enregistrer et partager</MenuRow>
              <MenuRow icon={MdConstruction}>Plus d’outils</MenuRow>

              <div className="my-1 border-t border-[#e7e6e3]" />
              <MenuRow icon={MdHelpOutline}>Aide</MenuRow>
              <MenuRow icon={MdSettingsSuggest} onClick={() => { onSettings?.(); setIsMenuOpen(false); }}>Paramètres</MenuRow>
              <MenuRow icon={MdExitToApp} onClick={() => { window.electron?.close(); setIsMenuOpen(false); }}>Quitter</MenuRow>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default TopBar;
