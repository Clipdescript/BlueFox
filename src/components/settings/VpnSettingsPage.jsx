import React from 'react';
import { useTranslation } from 'react-i18next';
import { MdWifi } from 'react-icons/md';
import { InfoCard, SectionShell, StatusPill } from './SettingsPrimitives.jsx';
import './VpnSettingsPage.css';

const VpnSettingsPage = () => {
  const { t } = useTranslation('common');
  return <SectionShell icon={MdWifi} title={t('settings.nav.vpn')} description={t('settingsExtra.vpnDescription')}>
    <div className="bluefox-settings-status-row"><div><strong>VPN BlueFox</strong><p>{t('settingsMore.vpnText')}</p></div><StatusPill>{t('settingsExtra.unavailable')}</StatusPill></div>
    <InfoCard title={t('settingsMore.vpnInfo')} text={t('settingsMore.vpnInfoText')} />
  </SectionShell>;
};

export default VpnSettingsPage;
