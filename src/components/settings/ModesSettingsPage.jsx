import React from 'react';
import { MdBusinessCenter, MdCode, MdDashboard, MdFamilyRestroom, MdSchool, MdSelfImprovement, MdSportsEsports, MdToggleOn } from 'react-icons/md';
import { ModeCard, SectionShell } from './SettingsPrimitives.jsx';
import './ModesSettingsPage.css';

const MODE_OPTIONS = [
  { id: 'standard', name: 'Standard', description: 'Navigation équilibrée pour tous les usages.', icon: MdDashboard, color: '#64748b' },
  { id: 'family', name: 'Familial', description: 'Recherche plus prudente et contenu adapté à la famille.', icon: MdFamilyRestroom, color: '#9d174d' },
  { id: 'coding', name: 'Codage', description: 'Confort pour lire de la documentation et écrire du code.', icon: MdCode, color: '#2563eb' },
  { id: 'work', name: 'Travail', description: 'Organisation, concentration et outils professionnels.', icon: MdBusinessCenter, color: '#0891b2' },
  { id: 'study', name: 'Étude', description: 'Lecture, recherches et révisions sans distraction.', icon: MdSchool, color: '#7c3aed' },
  { id: 'gaming', name: 'Gaming', description: 'Accès rapide aux jeux, streams et communautés.', icon: MdSportsEsports, color: '#e11d48' },
  { id: 'focus', name: 'Concentration', description: 'Interface calme avec le minimum de distractions.', icon: MdSelfImprovement, color: '#16a34a' },
];

const ModesSettingsPage = ({ selectedMode, onSelect }) => (
  <SectionShell icon={MdToggleOn} title="Modes de navigation" description="Choisissez un profil adapté à ce que vous faites.">
    <div className="bluefox-settings-mode-grid">{MODE_OPTIONS.map((mode) => <ModeCard key={mode.id} mode={mode} selected={mode.id === selectedMode} onClick={() => onSelect(mode.id)} />)}</div>
  </SectionShell>
);

export default ModesSettingsPage;
