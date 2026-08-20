import React from 'react';
import { useTranslation } from 'react-i18next';
import { MdSearch } from 'react-icons/md';
import { SectionShell, ToggleButton } from './SettingsPrimitives.jsx';
import './SafeSearchSettingsPage.css';

const SafeSearchSettingsPage = ({ enabled, onToggle }) => {
  const { t } = useTranslation('common');
  return <SectionShell icon={MdSearch} title="Safe Search" description={t('settingsPages.safeDescription')}>
    <div className="bluefox-settings-toggle-row"><div><strong>{t('settingsPages.safeTitle')}</strong><p>{t('settingsPages.safeText')}</p></div><ToggleButton enabled={enabled} onClick={onToggle} label={enabled ? t('settingsPages.enabled') : t('settingsPages.disabled')} /></div>
  </SectionShell>;
};

export default SafeSearchSettingsPage;
