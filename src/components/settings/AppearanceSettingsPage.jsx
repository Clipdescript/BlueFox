import React from 'react';
import { MdComputer, MdDarkMode, MdLightMode, MdPalette } from 'react-icons/md';
import { InfoCard, SectionShell, ThemeCard } from './SettingsPrimitives.jsx';

const THEME_OPTIONS = [
  { id: 'light', name: 'Clair', description: 'Interface blanche et lumineuse.', icon: MdLightMode },
  { id: 'dark', name: 'Sombre', description: 'Interface sombre pour réduire la luminosité.', icon: MdDarkMode },
  { id: 'system', name: 'Système', description: 'Suit automatiquement le thème de Windows.', icon: MdComputer },
];

const AppearanceSettingsPage = ({ mode, resolvedTheme, onSetMode }) => (
  <SectionShell icon={MdPalette} title="Apparence" description="Choisissez le thème utilisé par BlueFox.">
    <div className="bluefox-settings-theme-grid">{THEME_OPTIONS.map((themeOption) => <ThemeCard key={themeOption.id} themeOption={themeOption} selected={themeOption.id === mode} onClick={() => onSetMode(themeOption.id)} />)}</div>
    <InfoCard title="Thème actif" text={`BlueFox utilise actuellement le mode ${resolvedTheme === 'dark' ? 'sombre' : 'clair'}.`} />
  </SectionShell>
);

export default AppearanceSettingsPage;
