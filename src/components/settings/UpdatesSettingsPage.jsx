import React from 'react';
import { MdUpdate } from 'react-icons/md';
import { RuntimeInfoCard, SectionShell, VersionCard } from './SettingsPrimitives.jsx';
import './UpdatesSettingsPage.css';

const UpdatesSettingsPage = ({ version, updateState, onCheck, runtimeInfo }) => (
  <SectionShell icon={MdUpdate} title="Mise à jour" description="Vérifiez si une nouvelle version de BlueFox est disponible.">
    <VersionCard version={version} updateState={updateState} onCheck={onCheck} />
    <RuntimeInfoCard runtimeInfo={runtimeInfo} />
  </SectionShell>
);

export default UpdatesSettingsPage;
