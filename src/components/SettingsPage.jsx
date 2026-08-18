import React, { useEffect, useMemo, useState } from 'react';
import {
  MdArrowBack,
  MdAutorenew,
  MdCheckCircle,
  MdDownload,
  MdErrorOutline,
  MdInfoOutline,
  MdLanguage,
  MdPalette,
  MdSearch,
  MdSecurity,
  MdSpeed,
  MdTune,
  MdUpdate,
} from 'react-icons/md';
import { useTheme } from '../utils/theme.js';

const NAV_ITEMS = [
  { id: 'general', label: 'BlueFox et vous', icon: MdTune },
  { id: 'appearance', label: 'Apparence', icon: MdPalette },
  { id: 'privacy', label: 'Confidentialité et sécurité', icon: MdSecurity },
  { id: 'performance', label: 'Performances', icon: MdSpeed },
  { id: 'search', label: 'Moteur de recherche', icon: MdSearch },
  { id: 'downloads', label: 'Téléchargements', icon: MdDownload },
  { id: 'languages', label: 'Langues', icon: MdLanguage },
  { id: 'updates', label: 'Mise à jour', icon: MdUpdate },
];

const SettingsPage = ({ onClose }) => {
  const { resolvedTheme } = useTheme();
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
          <SectionShell icon={MdPalette} title="Apparence" description="Une interface claire et cohérente, pensée pour BlueFox.">
            <div className="bluefox-settings-appearance-card rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-muted)] p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--theme-surface)] text-[#137b8b] shadow-sm"><MdPalette className="text-xl" /></span>
                <div className="min-w-0 flex-1"><p className="font-semibold">Thème de l’interface</p><p className="mt-1 text-xs text-[var(--theme-text-muted)]">Le sélecteur clair, sombre ou système est disponible dans la sidebar Apparence de la page d’accueil.</p></div>
                <span className="shrink-0 rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] px-2.5 py-1 text-[11px] font-semibold text-[var(--theme-text-muted)]">{resolvedTheme === 'dark' ? 'Sombre' : 'Clair'}</span>
              </div>
            </div>
            <div className="mt-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 py-3 text-xs text-[var(--theme-text-muted)]">Les couleurs des onglets et le fond de la page d’accueil se personnalisent depuis le bouton Apparence de la page Nouvel onglet.</div>
          </SectionShell>
        );
      case 'privacy':
        return (
          <SectionShell icon={MdSecurity} title="Confidentialité et sécurité" description="Gardez le contrôle de vos données dans BlueFox.">
            <div className="divide-y divide-[var(--theme-border)] rounded-xl border border-[var(--theme-border)]">
              <SettingRow title="Historique de navigation" description="BlueFox n’enregistre pas votre historique de navigation."><StatusPill>Protégé</StatusPill></SettingRow>
            </div>
          </SectionShell>
        );
      case 'updates':
        return (
          <SectionShell icon={MdUpdate} title="Mise à jour" description="Vérifiez si une nouvelle version de BlueFox est disponible.">
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
            <button
              type="button"
              key={id}
              onClick={() => setActiveSection(id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] transition-colors ${activeSection === id ? 'font-semibold' : 'text-[var(--theme-text)] hover:bg-[var(--theme-surface-hover)]'}`}
              style={activeSection === id ? { backgroundColor: resolvedTheme === 'dark' ? '#303640' : '#eeeeee' } : undefined}
              aria-current={activeSection === id ? 'page' : undefined}
            >
              <Icon className="shrink-0 text-[19px]" style={activeSection === id ? { color: '#137b8b' } : undefined} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 border-b border-[var(--theme-border)] bg-[var(--theme-surface)]/95 px-5 py-3 backdrop-blur sm:px-8">
          <div className="mx-auto flex max-w-[900px] items-center gap-3">
            <button type="button" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--theme-text-muted)] transition-colors hover:bg-[var(--theme-surface-hover)]" aria-label="Retour au navigateur" title="Retour au navigateur"><MdArrowBack className="text-xl" /></button>
            <div className="relative min-w-0 flex-1"><MdSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-[var(--theme-text-muted)]" /><input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Rechercher dans les paramètres" className="h-10 w-full rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface-muted)] pl-10 pr-4 text-sm text-[var(--theme-text)] outline-none transition focus:border-[#137b8b] focus:ring-2 focus:ring-[#d9f0f3]" aria-label="Rechercher dans les paramètres" /></div>
          </div>
        </header>

        <main className="mx-auto max-w-[900px] px-5 py-7 sm:px-8 sm:py-9">
          {filteredNavItems.some(({ id }) => id === activeSection) ? renderSection() : <InfoCard title="Aucun résultat" text="Aucune section ne correspond à votre recherche." />}
        </main>
      </div>
    </div>
  );
};

const SectionShell = ({ icon: Icon, title, description, children }) => (
  <section className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5 shadow-sm sm:p-6"><div className="mb-5 flex items-start gap-3"><Icon className="mt-0.5 text-2xl text-[var(--theme-text-muted)]" /><div><h3 className="text-lg font-semibold">{title}</h3><p className="mt-1 text-sm text-[var(--theme-text-muted)]">{description}</p></div></div>{children}</section>
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
