import React from 'react';
import { MdSearch } from 'react-icons/md';
import { SectionShell, ToggleButton } from './SettingsPrimitives.jsx';
import './SafeSearchSettingsPage.css';

const SafeSearchSettingsPage = ({ enabled, onToggle }) => (
  <SectionShell icon={MdSearch} title="Safe Search" description="Réduisez l’exposition aux contenus explicites dans les recherches.">
    <div className="bluefox-settings-toggle-row"><div><strong>Recherche sécurisée</strong><p>Active le mode de recherche sécurisé lorsque le moteur choisi le prend en charge.</p></div><ToggleButton enabled={enabled} onClick={onToggle} label={enabled ? 'Activé' : 'Désactivé'} /></div>
  </SectionShell>
);

export default SafeSearchSettingsPage;
