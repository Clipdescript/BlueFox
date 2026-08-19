import React from 'react';
import { MdDownload } from 'react-icons/md';
import { InfoCard, SectionShell } from './SettingsPrimitives.jsx';

const DownloadsSettingsPage = () => (
  <SectionShell icon={MdDownload} title="Téléchargements" description="Les téléchargements s’ouvrent avec les réglages Windows habituels.">
    <InfoCard title="Dossier de téléchargement" text="BlueFox utilise le dossier de téléchargement configuré par Windows." />
  </SectionShell>
);

export default DownloadsSettingsPage;
