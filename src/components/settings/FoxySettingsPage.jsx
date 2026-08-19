import React from 'react';
import { MdAutoAwesome } from 'react-icons/md';
import { InfoCard, SectionShell, ToggleButton } from './SettingsPrimitives.jsx';

const FoxySettingsPage = ({ enabled, onToggle }) => (
  <SectionShell icon={MdAutoAwesome} title="Mode IA Foxy" description="Activez Foxy pour analyser, expliquer et transformer ce que vous consultez.">
    <div className="bluefox-settings-toggle-row"><div><strong>Foxy IA</strong><p>Foxy reste disponible dans le navigateur et peut être désactivé à tout moment.</p></div><ToggleButton enabled={enabled} onClick={onToggle} label={enabled ? 'Activé' : 'Désactivé'} /></div>
    <InfoCard title="Ce que Foxy peut faire" text="Répondre à vos questions, résumer une page, analyser un PDF et vous aider à écrire. L’IA reste facultative." />
  </SectionShell>
);

export default FoxySettingsPage;
