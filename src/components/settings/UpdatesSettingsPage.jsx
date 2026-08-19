import React from 'react';
import { MdUpdate } from 'react-icons/md';
import { SectionShell, VersionCard } from './SettingsPrimitives.jsx';

const UpdatesSettingsPage = ({ version, updateState, onCheck }) => (
  <SectionShell icon={MdUpdate} title="Mise à jour" description="Vérifiez si une nouvelle version de BlueFox est disponible.">
    <VersionCard version={version} updateState={updateState} onCheck={onCheck} />
  </SectionShell>
);

export default UpdatesSettingsPage;
