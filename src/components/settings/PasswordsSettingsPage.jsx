import React from 'react';
import { useTranslation } from 'react-i18next';
import { MdInfoOutline, MdKey } from 'react-icons/md';
import { InfoCard, SectionShell, StatusPill } from './SettingsPrimitives.jsx';
import './PasswordsSettingsPage.css';

const PasswordsSettingsPage = () => {
  const { t } = useTranslation('common');
  return <SectionShell icon={MdKey} title={t('settings.nav.passwords')} description={t('settingsExtra.passwordsDescription')}>
    <div className="bluefox-settings-status-row"><div><strong>{t('settingsExtra.passwordManager')}</strong><p>{t('settingsMore.passwordsNotIntegrated')}</p></div><StatusPill>{t('settingsExtra.notEnabled')}</StatusPill></div>
    <InfoCard title={t('settingsMore.passwordsInfo')} text={t('settingsMore.passwordsInfoText')} />
    <div className="bluefox-settings-security-note"><MdInfoOutline aria-hidden="true" /><span>{t('settingsMore.passwordsSecurity')}</span></div>
  </SectionShell>;
};

export default PasswordsSettingsPage;
