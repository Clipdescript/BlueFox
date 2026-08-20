import React from 'react';
import { useTranslation } from 'react-i18next';
import { MdComputer, MdFlashOn, MdNightsStay, MdPalette } from 'react-icons/md';
import { InfoCard, SectionShell, ThemeCard } from './SettingsPrimitives.jsx';
import './AppearanceSettingsPage.css';

const THEME_OPTIONS = [
  { id: 'light', name: 'Clair', description: 'Interface blanche et lumineuse.', icon: MdFlashOn },
  { id: 'dark', name: 'Sombre', description: 'Interface sombre pour réduire la luminosité.', icon: MdNightsStay },
  { id: 'system', name: 'Système', description: 'Suit automatiquement le thème de Windows.', icon: MdComputer },
];

const AppearanceSettingsPage = ({ mode, resolvedTheme, onSetMode }) => {
  const { t } = useTranslation('common');
  const localizedThemes = THEME_OPTIONS.map((theme) => ({ ...theme, name: t(`personalization.${theme.id}`), description: t(`personalization.${theme.id}Description`) }));
  return <SectionShell icon={MdPalette} title={t('settings.nav.appearance')} description={t('settingsPages.appearanceDescription')}>
    <div className="bluefox-settings-theme-grid">{localizedThemes.map((themeOption) => <ThemeCard key={themeOption.id} themeOption={themeOption} selected={themeOption.id === mode} onClick={() => onSetMode(themeOption.id)} />)}</div>
    <InfoCard title={t('settingsPages.themeActive')} text={t('settingsPages.themeActiveText', { theme: resolvedTheme === 'dark' ? t('settingsPages.darkTheme') : t('settingsPages.lightTheme') })} />
  </SectionShell>;
};

export default AppearanceSettingsPage;
