import React from 'react';
import { useTranslation } from 'react-i18next';
import { MdViewInAr } from 'react-icons/md';
import { SectionShell, StatusPill } from './SettingsPrimitives.jsx';
import './ExtensionsSettingsPage.css';

const ExtensionsSettingsPage = ({ onOpenExtensions }) => {
  const { t } = useTranslation('common');
  return <SectionShell icon={MdViewInAr} title={t('settings.nav.extensions')} description={t('settingsExtra.extensionsDescription')} className="bluefox-settings-extensions-section">
    <div className="bluefox-settings-status-row"><div><strong>BlueFox Add-ons</strong><p>Consultez les extensions disponibles sur le site officiel BlueFox.</p></div><StatusPill>{t('settingsExtra.officialCatalog')}</StatusPill></div>
    <button type="button" className="bluefox-settings-primary-button bluefox-settings-extensions-button" onClick={onOpenExtensions}>{t('settingsExtra.openAddons')}</button>
    <p className="bluefox-settings-footnote">{t('settingsMore.extensionsNote')}</p>
  </SectionShell>;
};

export default ExtensionsSettingsPage;
