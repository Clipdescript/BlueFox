import React from 'react';
import { useTranslation } from 'react-i18next';
import { MdInfoOutline, MdWallet } from 'react-icons/md';
import { SectionShell, StatusPill } from './SettingsPrimitives.jsx';
import './WalletSettingsPage.css';

const WalletSettingsPage = () => {
  const { t } = useTranslation('common');
  return <SectionShell icon={MdWallet} title={t('settings.nav.wallet')} description={t('settingsExtra.walletDescription')}>
    <div className="bluefox-settings-status-row"><div><strong>Portefeuille BlueFox</strong><p>{t('settingsMore.walletText')}</p></div><StatusPill>{t('settingsExtra.notAvailable')}</StatusPill></div>
    <div className="bluefox-settings-security-note is-warning"><MdInfoOutline aria-hidden="true" /><span>{t('settingsMore.walletWarning')}</span></div>
  </SectionShell>;
};

export default WalletSettingsPage;
