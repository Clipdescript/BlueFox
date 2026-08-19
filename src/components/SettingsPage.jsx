import React, { useEffect, useMemo, useState } from 'react';
import {
  MdAutoAwesome,
  MdDownload,
  MdHistory,
  MdLanguage,
  MdPalette,
  MdSearch,
  MdSecurity,
  MdSettings,
  MdSpeed,
  MdTune,
  MdUpdate,
} from 'react-icons/md';
import { useTheme } from '../utils/theme.js';
import { DEFAULT_SEARCH_ENGINE_ID, SAFE_SEARCH_STORAGE_KEY, SEARCH_ENGINE_STORAGE_KEY } from '../utils/searchEngines.js';
import GeneralSettingsPage from './settings/GeneralSettingsPage.jsx';
import AppearanceSettingsPage from './settings/AppearanceSettingsPage.jsx';
import PrivacySettingsPage from './settings/PrivacySettingsPage.jsx';
import HistorySettingsPage from './settings/HistorySettingsPage.jsx';
import SafeSearchSettingsPage from './settings/SafeSearchSettingsPage.jsx';
import ModesSettingsPage from './settings/ModesSettingsPage.jsx';
import FoxySettingsPage from './settings/FoxySettingsPage.jsx';
import PerformanceSettingsPage from './settings/PerformanceSettingsPage.jsx';
import SearchEngineSettingsPage from './settings/SearchEngineSettingsPage.jsx';
import DownloadsSettingsPage from './settings/DownloadsSettingsPage.jsx';
import LanguagesSettingsPage from './settings/LanguagesSettingsPage.jsx';
import UpdatesSettingsPage from './settings/UpdatesSettingsPage.jsx';
import { InfoCard } from './settings/SettingsPrimitives.jsx';
import '../styles/settings.css';

const NAV_ITEMS = [
  { id: 'general', label: 'BlueFox et vous', keywords: 'général navigateur réglages', icon: MdSettings },
  { id: 'appearance', label: 'Apparence', keywords: 'thème clair sombre système couleur', icon: MdPalette },
  { id: 'privacy', label: 'Confidentialité et sécurité', keywords: 'vie privée sécurité données', icon: MdSecurity },
  { id: 'history', label: 'Historique', keywords: 'navigation données historique', icon: MdHistory },
  { id: 'safe-search', label: 'Safe Search', keywords: 'recherche sécurisée contenu filtrage', icon: MdSearch },
  { id: 'modes', label: 'Modes', keywords: 'familial codage travail étude gaming concentration standard', icon: MdTune },
  { id: 'foxy', label: 'Mode IA Foxy', keywords: 'intelligence artificielle pdf résumé écrire assistant', icon: MdAutoAwesome },
  { id: 'performance', label: 'Performances', keywords: 'vitesse mémoire onglets rapide', icon: MdSpeed },
  { id: 'search', label: 'Moteur de recherche', keywords: 'google bing qwant ecosia wikipedia perplexity navigateur', icon: MdSearch },
  { id: 'downloads', label: 'Téléchargements', keywords: 'fichiers dossier', icon: MdDownload },
  { id: 'languages', label: 'Langues', keywords: 'français traduction', icon: MdLanguage },
  { id: 'updates', label: 'Mise à jour', keywords: 'version update nouvelle', icon: MdUpdate },
];

const MODE_STORAGE_KEY = 'bluefox_browser_mode_v1';
const FOXY_MODE_STORAGE_KEY = 'bluefox_foxy_mode_v1';
const BROWSER_HISTORY_STORAGE_KEY = 'bluefox_history';

const readBrowserHistory = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(BROWSER_HISTORY_STORAGE_KEY) || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
};

const SettingsPage = () => {
  const { mode, resolvedTheme, setMode } = useTheme();
  const [activeSection, setActiveSection] = useState('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [version, setVersion] = useState('—');
  const [updateState, setUpdateState] = useState({ status: 'idle', availableVersion: '' });
  const [searchEngineId, setSearchEngineId] = useState(() => localStorage.getItem(SEARCH_ENGINE_STORAGE_KEY) || DEFAULT_SEARCH_ENGINE_ID);
  const [safeSearchEnabled, setSafeSearchEnabled] = useState(() => localStorage.getItem(SAFE_SEARCH_STORAGE_KEY) !== 'false');
  const [selectedMode, setSelectedMode] = useState(() => localStorage.getItem(MODE_STORAGE_KEY) || 'standard');
  const [foxyEnabled, setFoxyEnabled] = useState(() => localStorage.getItem(FOXY_MODE_STORAGE_KEY) !== 'false');
  const [defaultBrowserState, setDefaultBrowserState] = useState({ checked: false, isDefault: false });
  const [browserHistory, setBrowserHistory] = useState(readBrowserHistory);
  const [historyQuery, setHistoryQuery] = useState('');

  useEffect(() => {
    window.electron?.getAppVersion?.().then((appVersion) => {
      if (appVersion) setVersion(appVersion);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    const refreshDefaultBrowserStatus = async () => {
      try {
        const status = await window.electron?.getDefaultBrowserStatus?.();
        if (!cancelled && status) setDefaultBrowserState({ checked: true, isDefault: Boolean(status.isDefault) });
      } catch {
        if (!cancelled) setDefaultBrowserState({ checked: true, isDefault: false });
      }
    };
    refreshDefaultBrowserStatus();
    const interval = window.setInterval(refreshDefaultBrowserStatus, 2500);
    window.addEventListener('focus', refreshDefaultBrowserStatus);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshDefaultBrowserStatus);
    };
  }, []);

  useEffect(() => {
    const refreshHistory = () => setBrowserHistory(readBrowserHistory());
    window.addEventListener('bluefox-history-changed', refreshHistory);
    return () => window.removeEventListener('bluefox-history-changed', refreshHistory);
  }, []);

  const filteredNavItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase('fr-FR');
    if (!normalizedQuery) return NAV_ITEMS;
    return NAV_ITEMS.filter(({ label, keywords = '' }) => `${label} ${keywords}`.toLocaleLowerCase('fr-FR').includes(normalizedQuery));
  }, [searchQuery]);

  useEffect(() => {
    if (searchQuery.trim() && filteredNavItems.length > 0 && !filteredNavItems.some(({ id }) => id === activeSection)) setActiveSection(filteredNavItems[0].id);
  }, [activeSection, filteredNavItems, searchQuery]);

  const openDefaultBrowserSettings = async () => {
    await window.electron?.openDefaultBrowserSettings?.();
  };

  const clearBrowserHistory = () => {
    localStorage.removeItem(BROWSER_HISTORY_STORAGE_KEY);
    setBrowserHistory([]);
    window.dispatchEvent(new CustomEvent('bluefox-history-changed'));
  };

  const removeHistoryEntry = (entryId) => {
    const nextHistory = browserHistory.filter((entry) => (entry.id || `${entry.url}-${entry.timestamp}`) !== entryId);
    localStorage.setItem(BROWSER_HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
    setBrowserHistory(nextHistory);
    window.dispatchEvent(new CustomEvent('bluefox-history-changed'));
  };

  const selectSearchEngine = (engineId) => {
    setSearchEngineId(engineId);
    localStorage.setItem(SEARCH_ENGINE_STORAGE_KEY, engineId);
    window.dispatchEvent(new CustomEvent('bluefox-search-engine-changed', { detail: engineId }));
  };

  const toggleSafeSearch = () => {
    const nextValue = !safeSearchEnabled;
    setSafeSearchEnabled(nextValue);
    localStorage.setItem(SAFE_SEARCH_STORAGE_KEY, String(nextValue));
    window.dispatchEvent(new CustomEvent('bluefox-safe-search-changed', { detail: nextValue }));
  };

  const chooseMode = (modeId) => {
    setSelectedMode(modeId);
    localStorage.setItem(MODE_STORAGE_KEY, modeId);
    window.dispatchEvent(new CustomEvent('bluefox-browser-mode-changed', { detail: modeId }));
  };

  const toggleFoxy = () => {
    const nextValue = !foxyEnabled;
    setFoxyEnabled(nextValue);
    localStorage.setItem(FOXY_MODE_STORAGE_KEY, String(nextValue));
    window.dispatchEvent(new CustomEvent('bluefox-foxy-mode-changed', { detail: nextValue }));
  };

  const checkForUpdates = async () => {
    setUpdateState({ status: 'checking', availableVersion: '' });
    try {
      const result = await window.electron?.checkForUpdates?.();
      setUpdateState({ status: result?.status || 'error', availableVersion: result?.availableVersion || '' });
    } catch {
      setUpdateState({ status: 'error', availableVersion: '' });
    }
  };

  const renderActivePage = () => {
    switch (activeSection) {
      case 'appearance': return <AppearanceSettingsPage mode={mode} resolvedTheme={resolvedTheme} onSetMode={setMode} />;
      case 'privacy': return <PrivacySettingsPage />;
      case 'history': return <HistorySettingsPage history={browserHistory} query={historyQuery} onQueryChange={setHistoryQuery} onClear={clearBrowserHistory} onRemove={removeHistoryEntry} />;
      case 'safe-search': return <SafeSearchSettingsPage enabled={safeSearchEnabled} onToggle={toggleSafeSearch} />;
      case 'modes': return <ModesSettingsPage selectedMode={selectedMode} onSelect={chooseMode} />;
      case 'foxy': return <FoxySettingsPage enabled={foxyEnabled} onToggle={toggleFoxy} />;
      case 'performance': return <PerformanceSettingsPage />;
      case 'search': return <SearchEngineSettingsPage selectedEngineId={searchEngineId} onSelect={selectSearchEngine} />;
      case 'downloads': return <DownloadsSettingsPage />;
      case 'languages': return <LanguagesSettingsPage />;
      case 'updates': return <UpdatesSettingsPage version={version} updateState={updateState} onCheck={checkForUpdates} />;
      case 'general':
      default: return <GeneralSettingsPage defaultBrowserState={defaultBrowserState} onOpenDefaultBrowserSettings={openDefaultBrowserSettings} />;
    }
  };

  return (
    <div className="bluefox-settings-page">
      <aside className="bluefox-settings-sidebar">
        <div className="bluefox-settings-brand"><img src={`${import.meta.env.BASE_URL}Logo.ico`} alt="BlueFox" /><h1>Paramètres</h1></div>
        <nav className="bluefox-settings-nav" aria-label="Catégories des paramètres">
          {filteredNavItems.map(({ id, label, icon: Icon }) => <button type="button" key={id} onClick={() => setActiveSection(id)} className={`bluefox-settings-nav-item ${activeSection === id ? 'is-active' : ''}`} aria-current={activeSection === id ? 'page' : undefined}><Icon aria-hidden="true" /><span>{label}</span></button>)}
        </nav>
      </aside>
      <div className="bluefox-settings-content">
        <header className="bluefox-settings-header"><div className="bluefox-settings-header-inner"><div className="bluefox-settings-search"><MdSearch aria-hidden="true" /><input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Rechercher dans les paramètres" aria-label="Rechercher dans les paramètres" /></div></div></header>
        <main className="bluefox-settings-main">{filteredNavItems.some(({ id }) => id === activeSection) ? renderActivePage() : <InfoCard title="Aucun résultat" text="Aucune section ne correspond à votre recherche." />}</main>
      </div>
    </div>
  );
};

export default SettingsPage;
