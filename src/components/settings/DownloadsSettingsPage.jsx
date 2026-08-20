import React from 'react';
import { useTranslation } from 'react-i18next';
import { MdDownload } from 'react-icons/md';
import { InfoCard, SectionShell } from './SettingsPrimitives.jsx';
import './DownloadsSettingsPage.css';

const DownloadsSettingsPage = () => {
  const { t } = useTranslation('common');
  return <SectionShell icon={MdDownload} title={t('settings.nav.downloads')} description={t('settingsExtra.downloadsDescription')}>
    <InfoCard title={t('settingsExtra.downloadFolder')} text={t('settingsExtra.downloadFolderText')} />
  </SectionShell>;
};

export default DownloadsSettingsPage;
