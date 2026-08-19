import React from 'react';
import { MdCode, MdPeople, MdSchool, MdSecurity, MdSportsEsports, MdTune, MdWork } from 'react-icons/md';
import { ModeCard, SectionShell } from './SettingsPrimitives.jsx';

const MODE_OPTIONS = [
  { id: 'standard', name: 'Standard', description: 'Navigation équilibrée pour tous les usages.', icon: MdTune, color: '#5f6368' },
  { id: 'family', name: 'Familial', description: 'Recherche plus prudente et contenu adapté à la famille.', icon: MdPeople, color: '#e67e22' },
  { id: 'coding', name: 'Codage', description: 'Confort pour lire de la documentation et écrire du code.', icon: MdCode, color: '#3776ab' },
  { id: 'work', name: 'Travail', description: 'Organisation, concentration et outils professionnels.', icon: MdWork, color: '#1a73e8' },
  { id: 'study', name: 'Étude', description: 'Lecture, recherches et révisions sans distraction.', icon: MdSchool, color: '#8e44ad' },
  { id: 'gaming', name: 'Gaming', description: 'Accès rapide aux jeux, streams et communautés.', icon: MdSportsEsports, color: '#e83e8c' },
  { id: 'focus', name: 'Concentration', description: 'Interface calme avec le minimum de distractions.', icon: MdSecurity, color: '#16a085' },
];

const ModesSettingsPage = ({ selectedMode, onSelect }) => (
  <SectionShell icon={MdTune} title="Modes de navigation" description="Choisissez un profil adapté à ce que vous faites.">
    <div className="bluefox-settings-mode-grid">{MODE_OPTIONS.map((mode) => <ModeCard key={mode.id} mode={mode} selected={mode.id === selectedMode} onClick={() => onSelect(mode.id)} />)}</div>
  </SectionShell>
);

export default ModesSettingsPage;
