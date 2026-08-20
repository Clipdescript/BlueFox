import React from 'react';
import { useTranslation } from 'react-i18next';
import { MdAutoAwesome } from 'react-icons/md';
import { InfoCard, SectionShell, ToggleButton } from './SettingsPrimitives.jsx';
import './FoxySettingsPage.css';

const FoxySettingsPage = ({ enabled, onToggle }) => {
  const { t } = useTranslation('common');
  return <SectionShell icon={MdAutoAwesome} title={t('settings.nav.foxy')} description={t('settingsPages.foxyDescription')}>
    <div className="bluefox-settings-toggle-row"><div><strong>{t('settingsPages.foxyTitle')}</strong><p>{t('settingsPages.foxyText')}</p></div><ToggleButton enabled={enabled} onClick={onToggle} label={enabled ? t('settingsPages.enabled') : t('settingsPages.disabled')} /></div>
    <InfoCard title={t('settingsPages.foxyInfoTitle')} text={t('settingsPages.foxyInfoText')} />
  </SectionShell>;
};

export default FoxySettingsPage;
