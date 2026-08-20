import React from 'react';
import { useTranslation } from 'react-i18next';
import { MdUpdate } from 'react-icons/md';
import { RuntimeInfoCard, SectionShell, VersionCard } from './SettingsPrimitives.jsx';
import './UpdatesSettingsPage.css';

const UpdatesSettingsPage = ({ version, updateState, onCheck, runtimeInfo }) => {
  const { t } = useTranslation('common');
  return <SectionShell icon={MdUpdate} title={t('settings.nav.updates')} description={t('settingsExtra.updatesDescription')}>
    <VersionCard version={version} updateState={updateState} onCheck={onCheck} />
    <RuntimeInfoCard runtimeInfo={runtimeInfo} />
  </SectionShell>;
};

export default UpdatesSettingsPage;
