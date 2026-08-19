import React, { useState, useEffect, useRef } from 'react';
import { FaDiscord } from 'react-icons/fa';
import {
  MdApps,
  MdAutoAwesome,
  MdBookmarkBorder,
  MdAccountCircle,
  MdCallSplit,
  MdWallet,
  MdCleaningServices,
  MdFileOpen,
  MdManageHistory,
  MdOpenInBrowser,
  MdShare,
  MdTab,
  MdArrowBack,
  MdArrowForward,
  MdMoreHoriz,
  MdDownload,
  MdExpandMore,
  MdExtension,
  MdPowerSettingsNew,
  MdGamepad,
  MdHomeFilled,
  MdInfoOutline,
  MdKey,
  MdMic,
  MdMusicNote,
  MdPrint,
  MdPublic,
  MdRefresh,
  MdSearch,
  MdSettings,
  MdTune,
  MdWifi,
  MdMenu,
  MdVerticalSplit,
  MdViewInAr,
  MdZoomIn,
} from 'react-icons/md';
import fetchJsonp from 'fetch-jsonp';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserSecret } from '@fortawesome/free-solid-svg-icons';
import { DEFAULT_SEARCH_ENGINE_ID, getSearchEngine, getSearchEngineIcon, SEARCH_ENGINE_STORAGE_KEY } from '../utils/searchEngines.js';

const ICON_COLOR = 'text-[#6d6e72]';
const BLUEFOX_ADDONS_URL = 'https://bluefox-add-ons.pages.dev/';
const SecretAgentIcon = (props) => <FontAwesomeIcon icon={faUserSecret} {...props} />;

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

const MenuRow = ({ icon: Icon, children, shortcut, onClick, className = '' }) => (
  <button type="button" onClick={onClick} className={`bluefox-topbar-menu-row flex min-h-7 w-full items-center gap-2 rounded-md px-2 py-1 text-left text-[12px] text-[#303134] transition-colors hover:bg-[#f0efed] ${className}`}>
    <span className="flex h-4 w-4 shrink-0 items-center justify-center leading-none">
      <Icon className="text-[16px] text-[#5f6368]" />
    </span>
    <span className="min-w-0 flex-1 truncate">{children}</span>
    {shortcut && <span className="shrink-0 text-[11px] text-[#6d6e72]">{shortcut}</span>}
  </button>
);

const TopBar = React.memo(({ onSearch, currentUrl, currentFavicon, isAiMode, isSettingsOpen, isGame, isPageError = false, isOfflineFallback, showHomeButton, onHome, onReload, onBack, onForward, onAssistant, onSettings, onSettingsSection, onModeChange, isAssistantActive, isMenuOpen = false, onMenuChange, onNewTab, onOpenPdf, onPrint, onNewWindow, onNewPrivateWindow, onPlayGame, onZoomOut, onZoomIn, zoomFactor = 1, discordProfile, onDiscordLogin, onDiscordLogout }) => {
  const [inputVal, setInputVal] = useState('');
  const [isAddressFocused, setIsAddressFocused] = useState(false);
  const [isFaviconBroken, setIsFaviconBroken] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchEngineId, setSearchEngineId] = useState(() => localStorage.getItem(SEARCH_ENGINE_STORAGE_KEY) || DEFAULT_SEARCH_ENGINE_ID);
  const [isDiscordProfileOpen, setIsDiscordProfileOpen] = useState(false);
  const menuRef = useRef(null);
  const discordProfileRef = useRef(null);

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
    const handleSearchEngineChange = (event) => {
      setSearchEngineId(event.detail || DEFAULT_SEARCH_ENGINE_ID);
      setIsFaviconBroken(false);
    };
    window.addEventListener('bluefox-search-engine-changed', handleSearchEngineChange);
    return () => window.removeEventListener('bluefox-search-engine-changed', handleSearchEngineChange);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return undefined;

    const closeMenu = (event) => {
      if (!menuRef.current?.contains(event.target)) onMenuChange?.(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onMenuChange?.(false);
    };
    document.addEventListener('mousedown', closeMenu);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeMenu);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isMenuOpen, onMenuChange]);

  useEffect(() => {
    if (!isDiscordProfileOpen) return undefined;
    const closeProfile = (event) => {
      if (!discordProfileRef.current?.contains(event.target)) setIsDiscordProfileOpen(false);
    };
    document.addEventListener('mousedown', closeProfile);
    return () => document.removeEventListener('mousedown', closeProfile);
  }, [isDiscordProfileOpen]);

  useEffect(() => {
    if (!discordProfile) setIsDiscordProfileOpen(false);
  }, [discordProfile]);

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

  const activeSearchEngine = getSearchEngine(searchEngineId);
  const activeSearchEngineIcon = getSearchEngineIcon(activeSearchEngine);

  return (
    <div className="bluefox-topbar sticky top-0 z-50 flex h-12 items-center gap-2 border-b border-[#e1e0dd] bg-[#fffefe] px-3 text-[#202124]">
      <div className="flex shrink-0 items-center gap-0.5">
        <button type="button" onClick={onBack} className={`flex h-9 w-9 items-center justify-center rounded-full ${ICON_COLOR} transition-colors hover:bg-[#f0efed] hover:text-[#292929]`} aria-label="Page précédente"><MdArrowBack className="text-[19px]" /></button>
        <button type="button" onClick={onForward} className={`flex h-9 w-9 items-center justify-center rounded-full ${ICON_COLOR} transition-colors hover:bg-[#f0efed] hover:text-[#292929]`} aria-label="Page suivante"><MdArrowForward className="text-[19px]" /></button>
        <button type="button" onClick={onReload} className={`flex h-9 w-9 items-center justify-center rounded-full ${ICON_COLOR} transition-colors hover:bg-[#f0efed] hover:text-[#292929]`} aria-label="Actualiser"><MdRefresh className="text-[19px]" /></button>
        {showHomeButton && <button type="button" onClick={onHome} className={`flex h-9 w-9 items-center justify-center rounded-full ${ICON_COLOR} transition-colors hover:bg-[#f0efed] hover:text-[#292929]`} aria-label="Accueil" title="Accueil"><MdHomeFilled className="text-[19px]" /></button>}
      </div>

      <div className="relative min-w-0 flex-1">
        <div className={`bluefox-address-bar flex h-9 items-center border border-[#a9d5dd] bg-white px-3 transition-[border-color,box-shadow] focus-within:border-[#16899b] focus-within:ring-2 focus-within:ring-[#d9f0f3] ${showSuggestions && suggestions.length > 0 ? 'rounded-t-[12px] rounded-b-none border-[#8fcbd4]' : 'rounded-[12px]'}`}>
          {isSettingsOpen ? (
            <MdTune className="mr-2 h-[18px] w-[18px] shrink-0 text-[#137b8b]" aria-label="Paramètres" />
          ) : isPageError ? (
            <MdPublic className="bluefox-address-fallback-icon mr-2 h-[18px] w-[18px] shrink-0" aria-label="Page introuvable" />
          ) : isGame || isOfflineFallback ? (
            <MdGamepad className="bluefox-address-game-icon mr-2 h-[18px] w-[18px] shrink-0 text-[#7346bc]" aria-label="Jeu hors ligne" />
          ) : isAiMode ? (
            <MdAutoAwesome className="mr-2 h-[18px] w-[18px] shrink-0 text-[#137b8b]" aria-label="Mode IA" />
          ) : currentFavicon && !isFaviconBroken ? (
            <img
              src={currentFavicon}
              alt="Icône du site"
              className="mr-2 h-[18px] w-[18px] object-contain"
              onError={() => setIsFaviconBroken(true)}
            />
          ) : !currentUrl && !isFaviconBroken ? (
            <img
              src={activeSearchEngineIcon}
              alt={`Moteur de recherche ${activeSearchEngine.name}`}
              className="mr-2 h-[18px] w-[18px] object-contain"
              onError={() => setIsFaviconBroken(true)}
            />
          ) : (
            <MdPublic className="bluefox-address-fallback-icon mr-2 h-[18px] w-[18px] shrink-0" aria-label="Site sans favicon" />
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
          <div className="bluefox-address-suggestions absolute left-0 right-0 top-9 z-[100] overflow-hidden rounded-b-[12px] border border-t-0 border-[#8fcbd4] bg-white/90 py-1.5 shadow-[0_16px_34px_rgba(32,33,36,0.14)]">
            {suggestions.map((suggestion, index) => (
              <button type="button" key={`${suggestion}-${index}`} className="bluefox-address-suggestion flex w-full items-center px-3 py-2 text-left text-sm text-[#4f5054] transition-colors duration-150 hover:bg-[#eef8fa] hover:text-[#202124]" onMouseDown={() => selectSuggestion(suggestion)}>
                <MdSearch className={`mr-3 ${ICON_COLOR}`} />{suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <button type="button" onClick={onAssistant} className={`hidden h-9 items-center gap-1 rounded-full px-2 text-[13px] transition-colors lg:flex ${isAssistantActive ? 'bg-[#f0efed] text-[#292929]' : 'text-[#68696d] hover:bg-[#f0efed] hover:text-[#292929]'}`} aria-label={isAssistantActive ? 'Fermer Assistant' : 'Ouvrir Assistant'} aria-pressed={isAssistantActive}><MdAutoAwesome className="text-[17px]" /><span>Assistant</span><MdExpandMore className="text-[16px] transition-transform duration-200" /></button>
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
        <div ref={discordProfileRef} className="relative" onMouseEnter={() => discordProfile && setIsDiscordProfileOpen(true)} onMouseLeave={() => setIsDiscordProfileOpen(false)}>
          <button type="button" onClick={() => discordProfile ? setIsDiscordProfileOpen((open) => !open) : onDiscordLogin?.()} className={`flex h-9 w-9 items-center justify-center rounded-full ${ICON_COLOR} transition-colors hover:bg-[#f0efed] hover:text-[#292929]`} aria-label={discordProfile ? `Ouvrir le profil de ${discordProfile.globalName || discordProfile.username}` : 'Se connecter avec Discord'} aria-expanded={Boolean(discordProfile && isDiscordProfileOpen)} title={discordProfile ? `Connecté en tant que ${discordProfile.globalName || discordProfile.username}` : 'Se connecter avec Discord'}>{discordProfile ? <img src={discordProfile.avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover" /> : <MdAccountCircle className="text-[21px]" />}</button>
          {discordProfile && isDiscordProfileOpen && (
            <div className="bluefox-discord-profile-popover" role="dialog" aria-label="Profil Discord">
              <div className="bluefox-discord-profile-heading">
                <img src={discordProfile.avatarUrl} alt="" className="bluefox-discord-profile-avatar" />
                <div className="min-w-0">
                  <strong>Salut, {discordProfile.globalName || discordProfile.username} !</strong>
                  <span>@{discordProfile.username}</span>
                </div>
              </div>
              <div className="bluefox-discord-profile-status"><FaDiscord className="bluefox-discord-profile-status-icon" aria-hidden="true" /> Connecté avec Discord</div>
              <p className="bluefox-discord-profile-note">Ton profil Discord est associé à BlueFox pour cette session.</p>
              <div className="bluefox-discord-profile-actions">
                <button type="button" onClick={() => { onSettings?.(); setIsDiscordProfileOpen(false); }}>Paramètres du compte</button>
                <button type="button" className="is-secondary" onClick={() => { onDiscordLogout?.(); setIsDiscordProfileOpen(false); }}>Se déconnecter</button>
              </div>
            </div>
          )}
        </div>
        <button type="button" onClick={() => onSearch(BLUEFOX_ADDONS_URL)} className="bluefox-topbar-utility-button flex h-9 w-9 items-center justify-center rounded-full" aria-label="Ouvrir BlueFox Add Ons" title="Extensions BlueFox"><MdViewInAr className="text-[21px]" /></button>
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => onMenuChange?.(!isMenuOpen)}
            className={`bluefox-topbar-menu-trigger flex h-9 w-9 items-center justify-center rounded-full ${isMenuOpen ? 'bg-[#f0efed] text-[#292929]' : ICON_COLOR} transition-colors hover:bg-[#f0efed] hover:text-[#292929]`}
            aria-label="Ouvrir le menu"
            aria-expanded={isMenuOpen}
          >
            <MdMenu className="text-[20px]" />
          </button>

          {isMenuOpen && (
            <div className="bluefox-topbar-menu absolute right-0 top-11 z-[200] max-h-[calc(100vh-76px)] w-[320px] overflow-hidden rounded-lg border border-[#deddd9] bg-white p-1.5 text-[#303134] shadow-none">
              <MenuRow icon={MdTab} shortcut="Ctrl+T" onClick={() => { onNewTab?.(); onMenuChange?.(false); }}>Nouvel onglet</MenuRow>
              <MenuRow icon={MdFileOpen} onClick={async () => { await onOpenPdf?.(); onMenuChange?.(false); }}>Ouvrir un PDF</MenuRow>
              <MenuRow icon={MdOpenInBrowser} shortcut="Ctrl+N" onClick={() => { onNewWindow?.(); onMenuChange?.(false); }}>Nouvelle fenêtre</MenuRow>
              <MenuRow icon={SecretAgentIcon} shortcut="Ctrl+Maj+N" onClick={() => { onNewPrivateWindow?.(); onMenuChange?.(false); }}>Nouvelle fenêtre privée</MenuRow>

              <div className="my-1 border-t border-[#e7e6e3]" />
              <MenuRow icon={MdHomeFilled} onClick={() => { onHome?.(); onMenuChange?.(false); }}>Accueil</MenuRow>
              <MenuRow icon={MdWallet} onClick={() => { onSettingsSection?.('wallet'); onMenuChange?.(false); }}>Portefeuille</MenuRow>
              <MenuRow icon={MdWifi} onClick={() => { onSettingsSection?.('vpn'); onMenuChange?.(false); }}>VPN BlueFox</MenuRow>

              <div className="my-1 border-t border-[#e7e6e3]" />
              <MenuRow icon={MdVerticalSplit} shortcut="Activé" onClick={() => { onAssistant?.(); onMenuChange?.(false); }}>Barre latérale</MenuRow>
              <MenuRow icon={MdKey} onClick={() => { onSettingsSection?.('passwords'); onMenuChange?.(false); }}>Mots de passe et saisie automatique</MenuRow>
              <MenuRow icon={MdManageHistory} onClick={() => { onSettingsSection?.('history'); onMenuChange?.(false); }}>Historique</MenuRow>
              <MenuRow icon={MdBookmarkBorder}>Favoris et listes</MenuRow>
              <MenuRow icon={MdDownload} shortcut="Ctrl+J" onClick={() => { onSettingsSection?.('downloads'); onMenuChange?.(false); }}>Téléchargements</MenuRow>
              <MenuRow icon={MdViewInAr} onClick={() => { onSearch(BLUEFOX_ADDONS_URL); onMenuChange?.(false); }}>Extensions</MenuRow>
              <MenuRow icon={MdCleaningServices} shortcut="Ctrl+Maj+Suppr" onClick={() => { onSettingsSection?.('clear-data'); onMenuChange?.(false); }}>Effacer les données de navigation…</MenuRow>

              <div className="my-1 border-t border-[#e7e6e3]" />
              <div className="flex items-center gap-2 rounded-md px-2 py-1 text-[12px]">
                <MdZoomIn className="shrink-0 text-[16px] text-[#5f6368]" />
                <span className="flex-1">Zoom</span>
                <button type="button" onClick={onZoomOut} className="px-1.5 text-base leading-none hover:text-[#137b8b]" aria-label="Réduire le zoom">−</button>
                <span className="text-[11px]">{Math.round(zoomFactor * 100)} %</span>
                <button type="button" onClick={onZoomIn} className="px-1.5 text-base leading-none hover:text-[#137b8b]" aria-label="Augmenter le zoom">+</button>
              </div>

              <div className="my-1 border-t border-[#e7e6e3]" />
              <MenuRow icon={MdPrint} shortcut="Ctrl+P" onClick={() => { onPrint?.(); onMenuChange?.(false); }}>Imprimer…</MenuRow>
              <MenuRow icon={MdSearch}>Rechercher et modifier</MenuRow>
              <MenuRow icon={MdShare}>Enregistrer et partager</MenuRow>
              <MenuRow icon={MdCallSplit}>Plus d’options</MenuRow>

              <div className="my-1 border-t border-[#e7e6e3]" />
              <MenuRow icon={MdInfoOutline}>Centre d’aide</MenuRow>
              <MenuRow icon={MdTune} onClick={() => { onSettings?.(); onMenuChange?.(false); }}>Paramètres</MenuRow>
              <MenuRow icon={MdGamepad} onClick={() => { onPlayGame?.(); onMenuChange?.(false); }}>Jouer à Tetris</MenuRow>
              <MenuRow icon={MdPowerSettingsNew} className="bluefox-topbar-menu-quit" onClick={() => { window.electron?.close(); onMenuChange?.(false); }}>Quitter</MenuRow>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default TopBar;
