import React from 'react';
import { useTranslation } from 'react-i18next';
import { MdAutorenew, MdCheckCircle, MdErrorOutline, MdInfoOutline, MdUpdate } from 'react-icons/md';
import './SettingsPrimitives.css';

export const SectionShell = ({ icon: Icon, title, description, children, className = '' }) => (
  <section className={`bluefox-settings-section ${className}`.trim()}>
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
  const { t } = useTranslation('common');
  const ThemeIcon = themeOption.icon;
  return <button type="button" className={`bluefox-settings-theme ${compact ? 'is-compact' : ''} ${selected ? 'is-selected' : ''}`} onClick={onClick} aria-pressed={selected}><ThemeIcon /><span><strong>{themeOption.name}</strong>{!compact && <small>{themeOption.description}</small>}</span>{selected && <b>{t('settings.current')}</b>}</button>;
};

export const ModeCard = ({ mode, selected, onClick }) => {
  const { t } = useTranslation('common');
  const ModeIcon = mode.icon;
  return <button type="button" className={`bluefox-settings-mode ${selected ? 'is-selected' : ''}`} style={{ '--mode-color': mode.color }} onClick={onClick} aria-pressed={selected}><ModeIcon style={{ color: mode.color, fill: mode.color, stroke: mode.color }} /><span><strong>{mode.name}</strong><small>{mode.description}</small></span>{selected && <b>{t('settings.current')}</b>}</button>;
};

export const RuntimeInfoCard = ({ runtimeInfo }) => {
  const { t } = useTranslation('common');
  const details = [
    ['Electron', runtimeInfo?.electron ? `v${runtimeInfo.electron}` : '—'],
    ['Chromium', runtimeInfo?.chromium ? `v${runtimeInfo.chromium}` : '—'],
    ['Node.js', runtimeInfo?.node ? `v${runtimeInfo.node}` : '—'],
    [t('settingsExtra.javaScript'), runtimeInfo?.v8 ? `V8 ${runtimeInfo.v8}` : '—'],
    [t('settingsExtra.system'), runtimeInfo?.platform && runtimeInfo?.arch ? `${runtimeInfo.platform} · ${runtimeInfo.arch}` : '—']
  ];

  return (
    <div className="bluefox-settings-runtime">
      <div className="bluefox-settings-runtime-header">
        <div><strong>{t('settingsExtra.runtimeSpecs')}</strong><p>{t('settingsExtra.runtimeText')}</p></div>
        <span>Runtime</span>
      </div>
      <div className="bluefox-settings-runtime-grid">
        {details.map(([label, value]) => <div className="bluefox-settings-runtime-item" key={label}><span>{label}</span><strong>{value}</strong></div>)}
      </div>
      <p className="bluefox-settings-runtime-note">{t('settingsExtra.runtimeNote')}</p>
    </div>
  );
};

export const VersionCard = ({ version, updateState, onCheck }) => {
  const { t } = useTranslation('common');
  const status = updateState.status;
  const statusContent = status === 'checking'
    ? { icon: MdAutorenew, text: t('settingsExtra.checkingUpdate'), tone: 'checking' }
    : status === 'latest'
      ? { icon: MdCheckCircle, text: t('settingsExtra.latestVersion'), tone: 'success' }
      : status === 'available'
        ? { icon: MdUpdate, text: t('settingsExtra.availableVersion', { version: updateState.availableVersion }), tone: 'warning' }
        : status === 'development'
          ? { icon: MdInfoOutline, text: t('settingsExtra.developmentUpdate'), tone: 'muted' }
          : status === 'error'
            ? { icon: MdErrorOutline, text: t('settingsExtra.updateError'), tone: 'error' }
            : null;
  const StatusIcon = statusContent?.icon;

  return (
    <div className="bluefox-settings-update">
      <div className="bluefox-settings-row">
        <div><strong>{t('settingsExtra.updatesVersion')}</strong><p>{t('settingsExtra.installedVersion')} <b>v{version}</b></p>{statusContent && StatusIcon && <p className={`bluefox-settings-update-status ${statusContent.tone}`}><StatusIcon className={status === 'checking' ? 'is-spinning' : ''} />{statusContent.text}</p>}</div>
        <button type="button" onClick={onCheck} disabled={status === 'checking'}>{status === 'checking' ? t('settingsExtra.checking') : t('settingsExtra.checkUpdate')}</button>
      </div>
    </div>
  );
};
