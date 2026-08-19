import React from 'react';
import { MdSettings } from 'react-icons/md';
import { SectionShell } from './SettingsPrimitives.jsx';

const GeneralSettingsPage = ({ defaultBrowserState, onOpenDefaultBrowserSettings }) => (
  <SectionShell icon={MdSettings} title="BlueFox et vous" description="Faites de BlueFox votre navigateur par défaut.">
    <div className={`bluefox-settings-default-browser ${defaultBrowserState.isDefault ? 'is-confirmed' : ''}`}>
      <div>
        <strong>{defaultBrowserState.isDefault ? 'BlueFox est votre navigateur par défaut' : 'Définir BlueFox comme navigateur par défaut'}</strong>
        <p>{defaultBrowserState.isDefault ? 'Vous pouvez maintenant naviguer avec BlueFox en toute simplicité.' : 'Ouvrez les paramètres Windows pour choisir BlueFox comme navigateur utilisé par défaut.'}</p>
      </div>
      {defaultBrowserState.isDefault ? <span className="bluefox-settings-thanks">🎉 Merci !</span> : <button type="button" className="bluefox-settings-default-button" onClick={onOpenDefaultBrowserSettings}>Définir par défaut</button>}
    </div>
    {defaultBrowserState.isDefault && <div className="bluefox-settings-default-success">🎉 Merci d’avoir choisi BlueFox comme navigateur par défaut !</div>}
  </SectionShell>
);

export default GeneralSettingsPage;
