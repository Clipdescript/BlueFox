import React, { useEffect, useMemo, useState } from 'react';
import {
  MdArrowBack,
  MdAutorenew,
  MdCheckCircle,
  MdDarkMode,
  MdDownload,
  MdErrorOutline,
  MdInfoOutline,
  MdLanguage,
  MdLightMode,
  MdContrast,
  MdLock,
  MdPalette,
  MdSearch,
  MdSecurity,
  MdSpeed,
  MdTune,
  MdUpdate,
} from 'react-icons/md';
import { useTheme } from '../utils/theme.js';

const SETTINGS_URL = 'bluefox://parametres';

const THEME_OPTIONS = [
  { value: 'light', label: 'Clair', description: 'Une interface lumineuse.', icon: MdLightMode },
  { value: 'dark', label: 'Sombre', description: 'Réduit la luminosité.', icon: MdDarkMode },
  { value: 'system', label: 'Système', description: 'Suit Windows automatiquement.', icon: MdContrast },
];

const NAV_ITEMS = [
  { id: 'general', label: 'BlueFox et vous', icon: MdTune },
  { id: 'appearance', label: 'Apparence', icon: MdPalette },
  { id: 'privacy', label: 'Confidentialité et sécurité', icon: MdSecurity },
  { id: 'performance', label: 'Performances', icon: MdSpeed },
  { id: 'search', label: 'Moteur de recherche', icon: MdSearch },
  { id: 'downloads', label: 'Téléchargements', icon: MdDownload },
  { id: 'languages', label: 'Langues', icon: MdLanguage },
];

const SettingsPage = ({ onClose }) => {
  const { mode, resolvedTheme, setMode } = useTheme();
  const [activeSection, setActiveSection] = useState('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [version, setVersion] = useState('—');
  const [updateState, setUpdateState] = useState({ status: 'idle', availableVersion: '' });

  useEffect(() => {
    window.electron?.getAppVersion?.().then((appVersion) => {
      if (appVersion) setVersion(appVersion);
    }).catch(() => {});
  }, []);

  const filteredNavItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase('fr-FR');
    if (!normalizedQuery) return NAV_ITEMS;
    return NAV_ITEMS.filter(({ label }) => label.toLocaleLowerCase('fr-FR').includes(normalizedQuery));
  }, [searchQuery]);

  const checkForUpdates = async () => {
    setUpdateState({ status: 'checking', availableVersion: '' });
    try {
      const result = await window.electron?.checkForUpdates?.();
      setUpdateState({
        status: result?.status || 'error',
        availableVersion: result?.availableVersion || '',
      });
    } catch {
      setUpdateState({ status: 'error', availableVersion: '' });
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'appearance':
        return (
          <SectionShell icon={MdPalette} title="Apparence" description="Choisissez le style de BlueFox.">
            <div className="grid gap-3 sm:grid-cols-3">
              {THEME_OPTIONS.map(({ value, label, description, icon: Icon }) => (
                <button type="button" key={value} onClick={() => setMode(value)} className={`rounded-xl border p-4 text-left transition-colors ${mode === value ? 'border-[#137b8b] bg-[#e8f5f7]' : 'border-[var(--theme-border)] hover:bg-[var(--theme-surface-hover)]'}`} aria-pressed={mode === value}>
                  <span className="flex items-center gap-2 font-medium"><Icon className="text-lg" />{label}</span>
                  <span className="mt-2 block text-xs text-[var(--theme-text-muted)]">{description}</span>
                </button>
              ))}
            </div>
            <p className="mt-4 text-xs text-[var(--theme-text-muted)]">Thème actif : <strong>{resolvedTheme === 'dark' ? 'sombre' : 'clair'}</strong>.</p>
          </SectionShell>
        );
      case 'privacy':
        return (
          <SectionShell icon={MdSecurity} title="Confidentialité et sécurité" description="Gardez le contrôle de vos données dans BlueFox.">
            <div className="divide-y divide-[var(--theme-border)] rounded-xl border border-[var(--theme-border)]">
              <SettingRow title="Historique de navigation" description="BlueFox n’enregistre pas votre historique de navigation."><StatusPill>Protégé</StatusPill></SettingRow>
              <SettingRow title="Adresse interne des paramètres" description="Utilisez bluefox://parametres dans la barre d’adresse pour revenir ici."><code className="rounded-md bg-[var(--theme-surface-muted)] px-2 py-1 text-xs">bluefox://parametres</code></SettingRow>
            </div>
            <VersionCard version={version} updateState={updateState} onCheck={checkForUpdates} />
          </SectionShell>
        );
      case 'performance':
        return <SectionShell icon={MdSpeed} title="Performances" description="BlueFox privilégie un démarrage rapide."><InfoCard title="Onglets rapides" text="Les onglets restent actifs pour accélérer leur réouverture. BlueFox peut limiter les ressources des onglets inactifs si nécessaire." /></SectionShell>;
      case 'search':
        return <SectionShell icon={MdSearch} title="Moteur de recherche" description="Choisissez le moteur utilisé par la barre d’adresse."><InfoCard title="Google" text="Google est actuellement utilisé pour les recherches et les suggestions de la barre d’adresse." /></SectionShell>;
      case 'downloads':
        return <SectionShell icon={MdDownload} title="Téléchargements" description="Les téléchargements s’ouvrent avec les réglages Windows habituels."><InfoCard title="Dossier de téléchargement" text="BlueFox utilise le dossier de téléchargement configuré par Windows." /></SectionShell>;
      case 'languages':
        return <SectionShell icon={MdLanguage} title="Langues" description="BlueFox est actuellement configuré en français."><InfoCard title="Langue de l’interface" text="La langue principale de BlueFox est le français. D’autres langues pourront être ajoutées ultérieurement." /></SectionShell>;
      case 'general':
      default:
        return (
          <SectionShell icon={MdTune} title="BlueFox et vous" description="Gérez les réglages principaux de votre navigateur.">
            <div className="divide-y divide-[var(--theme-border)] rounded-xl border border-[var(--theme-border)]">
              <SettingRow title="Navigation privée par défaut" description="BlueFox ne conserve pas votre historique de navigation."><StatusPill>Activé</StatusPill></SettingRow>
              <SettingRow title="Adresse de cette page" description="Saisissez cette adresse dans la barre d’adresse pour ouvrir les paramètres."><code className="rounded-md bg-[var(--theme-surface-muted)] px-2 py-1 text-xs">{SETTINGS_URL}</code></SettingRow>
            </div>
          </SectionShell>
        );
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-[var(--theme-bg)] text-[var(--theme-text)]">
      <aside className="hidden w-[250px] shrink-0 overflow-y-auto border-r border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-5 lg:block">
        <div className="mb-5 flex items-center gap-3 px-3">
          <img src={`${import.meta.env.BASE_URL}Logo.ico`} alt="BlueFox" className="h-9 w-9 object-contain" />
          <div className="min-w-0"><p className="truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--theme-text-muted)]">BlueFox Browser</p><h1 className="text-lg font-semibold">Paramètres</h1></div>
        </div>
        <nav aria-label="Catégories des paramètres" className="space-y-1">
          {filteredNavItems.map(({ id, label, icon: Icon }) => (
            <button type="button" key={id} onClick={() => setActiveSection(id)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] transition-colors ${activeSection === id ? 'bg-[#e8f5f7] font-semibold text-[#137b8b]' : 'text-[var(--theme-text)] hover:bg-[var(--theme-surface-hover)]'}`} aria-current={activeSection === id ? 'page' : undefined}><Icon className="shrink-0 text-[19px]" /><span>{label}</span></button>
          ))}
        </nav>
        <div className="mt-6 border-t border-[var(--theme-border)] pt-4"><div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] text-[var(--theme-text-muted)]"><MdLock className="text-[19px]" /><span>Confidentialité BlueFox</span></div></div>
      </aside>

      <div className="min-w-0 flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 border-b border-[var(--theme-border)] bg-[var(--theme-surface)]/95 px-5 py-3 backdrop-blur sm:px-8">
          <div className="mx-auto flex max-w-[900px] items-center gap-3">
            <button type="button" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--theme-text-muted)] transition-colors hover:bg-[var(--theme-surface-hover)]" aria-label="Retour au navigateur" title="Retour au navigateur"><MdArrowBack className="text-xl" /></button>
            <div className="relative min-w-0 flex-1"><MdSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-[var(--theme-text-muted)]" /><input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Rechercher dans les paramètres" className="h-10 w-full rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface-muted)] pl-10 pr-4 text-sm text-[var(--theme-text)] outline-none transition focus:border-[#137b8b] focus:ring-2 focus:ring-[#d9f0f3]" aria-label="Rechercher dans les paramètres" /></div>
          </div>
        </header>

        <main className="mx-auto max-w-[900px] px-5 py-7 sm:px-8 sm:py-9">
          <div className="mb-6 flex items-center gap-3"><MdTune className="text-2xl text-[#137b8b]" /><div><p className="font-semibold uppercase tracking-[0.14em] text-[11px] text-[var(--theme-text-muted)]">{SETTINGS_URL}</p><h2 className="text-2xl font-semibold tracking-tight">Paramètres</h2></div></div>
          {filteredNavItems.some(({ id }) => id === activeSection) ? renderSection() : <InfoCard title="Aucun résultat" text="Aucune section ne correspond à votre recherche." />}
        </main>
      </div>
    </div>
  );
};

const SectionShell = ({ icon: Icon, title, description, children }) => (
  <section className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5 shadow-sm sm:p-6"><div className="mb-5 flex items-start gap-3"><Icon className="mt-0.5 text-2xl text-[#137b8b]" /><div><h3 className="text-lg font-semibold">{title}</h3><p className="mt-1 text-sm text-[var(--theme-text-muted)]">{description}</p></div></div>{children}</section>
);

const SettingRow = ({ title, description, children }) => <div className="flex items-center justify-between gap-4 px-4 py-4"><div><p className="font-medium">{title}</p><p className="mt-1 text-xs text-[var(--theme-text-muted)]">{description}</p></div><div className="shrink-0">{children}</div></div>;
const StatusPill = ({ children }) => <span className="rounded-full bg-[#e8f5f7] px-2.5 py-1 text-xs font-semibold text-[#137b8b]">{children}</span>;
const InfoCard = ({ title, text }) => <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-muted)] px-4 py-4"><p className="font-medium">{title}</p><p className="mt-1 text-sm text-[var(--theme-text-muted)]">{text}</p></div>;

const VersionCard = ({ version, updateState, onCheck }) => {
  const status = updateState.status;
  const statusContent = status === 'checking'
    ? { icon: MdAutorenew, text: 'Recherche de mises à jour…', tone: 'text-[#137b8b]' }
    : status === 'latest'
      ? { icon: MdCheckCircle, text: 'Vous utilisez la dernière version.', tone: 'text-[#16834b]' }
      : status === 'available'
        ? { icon: MdUpdate, text: `Mise à jour disponible : v${updateState.availableVersion}`, tone: 'text-[#b56b00]' }
        : status === 'development'
          ? { icon: MdInfoOutline, text: 'Les mises à jour sont vérifiées dans la version installée.', tone: 'text-[var(--theme-text-muted)]' }
          : status === 'error'
            ? { icon: MdErrorOutline, text: 'Impossible de vérifier les mises à jour pour le moment.', tone: 'text-[#b42318]' }
            : null;

  const StatusIcon = statusContent?.icon;

  return (
    <div className="mt-6 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-muted)] p-4">
      <div className="flex items-start gap-3"><MdInfoOutline className="mt-0.5 text-xl text-[#137b8b]" /><div className="min-w-0 flex-1"><p className="font-semibold">Version de BlueFox</p><p className="mt-1 text-sm text-[var(--theme-text-muted)]">Version installée : <strong>v{version}</strong></p>{statusContent && StatusIcon && <p className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${statusContent.tone}`}><StatusIcon className={`text-base ${status === 'checking' ? 'animate-spin' : ''}`} />{statusContent.text}</p>}</div><button type="button" onClick={onCheck} disabled={status === 'checking'} className="shrink-0 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-2 text-xs font-semibold hover:bg-[var(--theme-surface-hover)] disabled:cursor-wait disabled:opacity-60">{status === 'checking' ? 'Vérification…' : 'Rechercher une mise à jour'}</button></div>
    </div>
  );
};

export default SettingsPage;
