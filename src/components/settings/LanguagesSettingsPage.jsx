import React from 'react';
import { MdLanguage } from 'react-icons/md';
import { InfoCard, SectionShell } from './SettingsPrimitives.jsx';

const LanguagesSettingsPage = () => (
  <SectionShell icon={MdLanguage} title="Langues" description="BlueFox est actuellement configuré en français.">
    <InfoCard title="Langue de l’interface" text="La langue principale de BlueFox est le français. D’autres langues pourront être ajoutées ultérieurement." />
  </SectionShell>
);

export default LanguagesSettingsPage;
