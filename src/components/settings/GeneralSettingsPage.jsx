import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaDiscord } from 'react-icons/fa';
import { MdAccountCircle } from 'react-icons/md';
import { SectionShell } from './SettingsPrimitives.jsx';
import './GeneralSettingsPage.css';

const GeneralSettingsPage = ({ defaultBrowserState, onOpenDefaultBrowserSettings, discordProfile, onDiscordLogin, onDiscordLogout }) => {
  const { t } = useTranslation('common');
  return <SectionShell icon={MdAccountCircle} title={t('settingsPages.generalTitle')} description={t('settingsPages.generalDescription')}>
    <div className={`bluefox-settings-default-browser ${defaultBrowserState.isDefault ? 'is-confirmed' : ''}`}>
      <div>
        <strong>{defaultBrowserState.isDefault ? t('settingsPages.defaultBrowserDone') : t('settingsPages.defaultBrowser')}</strong>
        <p>{defaultBrowserState.isDefault ? t('settingsPages.defaultBrowserDoneText') : t('settingsPages.defaultBrowserText')}</p>
      </div>
      {defaultBrowserState.isDefault ? <span className="bluefox-settings-thanks">{t('settingsPages.thanks')}</span> : <button type="button" className="bluefox-settings-default-button" onClick={onOpenDefaultBrowserSettings}>{t('settingsPages.setDefault')}</button>}
    </div>
    {defaultBrowserState.isDefault && <div className="bluefox-settings-default-success">{t('settingsPages.defaultSuccess')}</div>}

    <div className="bluefox-settings-discord-card">
      {discordProfile ? <img src={discordProfile.avatarUrl} alt="" className="bluefox-settings-discord-avatar" /> : <span className="bluefox-settings-discord-icon"><FaDiscord aria-hidden="true" /></span>}
      <div className="bluefox-settings-discord-copy">
        <strong>{discordProfile ? t('topbar.connectedAs', { name: discordProfile.globalName || discordProfile.username }) : t('settingsPages.discordConnect')}</strong>
        <p>{discordProfile ? `@${discordProfile.username}` : t('settingsMore.discordOptionalText')}</p>
      </div>
      {discordProfile ? <button type="button" className="bluefox-settings-discord-button is-secondary" onClick={onDiscordLogout}>{t('settingsPages.discordDisconnect')}</button> : <button type="button" className="bluefox-settings-discord-button" onClick={onDiscordLogin}>{t('settingsPages.signIn')}</button>}
    </div>
  </SectionShell>;
};

export default GeneralSettingsPage;
