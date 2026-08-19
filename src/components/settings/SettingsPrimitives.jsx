import React from 'react';
import { MdAutorenew, MdCheckCircle, MdErrorOutline, MdInfoOutline, MdUpdate } from 'react-icons/md';

export const SectionShell = ({ icon: Icon, title, description, children }) => (
  <section className="bluefox-settings-section">
    <div className="bluefox-settings-section-header">
      <Icon aria-hidden="true" />
      <div><h2>{title}</h2><p>{description}</p></div>
    </div>
    {children}
  </section>
);

export const InfoCard = ({ title, text }) => (
  <div className="bluefox-settings-info"><strong>{title}</strong><p>{text}</p></div>
);

export const StatusPill = ({ children }) => <span className="bluefox-settings-pill">{children}</span>;

export const ToggleButton = ({ enabled, onClick, label }) => (
  <button type="button" className={`bluefox-settings-toggle ${enabled ? 'is-enabled' : ''}`} onClick={onClick} aria-label={label} aria-pressed={enabled}><i aria-hidden="true" /></button>
);

export const ThemeCard = ({ themeOption, selected, onClick, compact = false }) => {
  const ThemeIcon = themeOption.icon;
  return <button type="button" className={`bluefox-settings-theme ${compact ? 'is-compact' : ''} ${selected ? 'is-selected' : ''}`} onClick={onClick} aria-pressed={selected}><ThemeIcon /><span><strong>{themeOption.name}</strong>{!compact && <small>{themeOption.description}</small>}</span>{selected && <b>Actuel</b>}</button>;
};

export const ModeCard = ({ mode, selected, onClick }) => {
  const ModeIcon = mode.icon;
  return <button type="button" className={`bluefox-settings-mode ${selected ? 'is-selected' : ''}`} style={{ '--mode-color': mode.color }} onClick={onClick} aria-pressed={selected}><ModeIcon /><span><strong>{mode.name}</strong><small>{mode.description}</small></span>{selected && <b>Actuel</b>}</button>;
};

export const RuntimeInfoCard = ({ runtimeInfo }) => {
  const details = [
    ['Electron', runtimeInfo?.electron ? `v${runtimeInfo.electron}` : '—'],
    ['Chromium', runtimeInfo?.chromium ? `v${runtimeInfo.chromium}` : '—'],
    ['Node.js', runtimeInfo?.node ? `v${runtimeInfo.node}` : '—'],
    ['Moteur JavaScript', runtimeInfo?.v8 ? `V8 ${runtimeInfo.v8}` : '—'],
    ['Système', runtimeInfo?.platform && runtimeInfo?.arch ? `${runtimeInfo.platform} · ${runtimeInfo.arch}` : '—']
  ];

  return (
    <div className="bluefox-settings-runtime">
      <div className="bluefox-settings-runtime-header">
        <div><strong>Spécifications Electron</strong><p>Versions réellement utilisées par cette installation de BlueFox.</p></div>
        <span>Runtime</span>
      </div>
      <div className="bluefox-settings-runtime-grid">
        {details.map(([label, value]) => <div className="bluefox-settings-runtime-item" key={label}><span>{label}</span><strong>{value}</strong></div>)}
      </div>
      <p className="bluefox-settings-runtime-note">Electron intègre Chromium pour l’affichage, Node.js pour les fonctions de l’application et V8 pour exécuter JavaScript. Ces versions sont indépendantes du navigateur installé sur votre système.</p>
    </div>
  );
};

export const VersionCard = ({ version, updateState, onCheck }) => {
  const status = updateState.status;
  const statusContent = status === 'checking'
    ? { icon: MdAutorenew, text: 'Recherche de mises à jour…', tone: 'checking' }
    : status === 'latest'
      ? { icon: MdCheckCircle, text: 'Vous utilisez la dernière version.', tone: 'success' }
      : status === 'available'
        ? { icon: MdUpdate, text: `Mise à jour disponible : v${updateState.availableVersion}`, tone: 'warning' }
        : status === 'development'
          ? { icon: MdInfoOutline, text: 'Les mises à jour sont vérifiées dans la version installée.', tone: 'muted' }
          : status === 'error'
            ? { icon: MdErrorOutline, text: 'Impossible de vérifier les mises à jour pour le moment.', tone: 'error' }
            : null;
  const StatusIcon = statusContent?.icon;

  return (
    <div className="bluefox-settings-update">
      <div className="bluefox-settings-row">
        <div><strong>Version de BlueFox</strong><p>Version installée : <b>v{version}</b></p>{statusContent && StatusIcon && <p className={`bluefox-settings-update-status ${statusContent.tone}`}><StatusIcon className={status === 'checking' ? 'is-spinning' : ''} />{statusContent.text}</p>}</div>
        <button type="button" onClick={onCheck} disabled={status === 'checking'}>{status === 'checking' ? 'Vérification…' : 'Rechercher une mise à jour'}</button>
      </div>
    </div>
  );
};
