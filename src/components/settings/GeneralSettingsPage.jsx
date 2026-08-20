import React from 'react';
import { FaDiscord } from 'react-icons/fa';
import { MdAccountCircle } from 'react-icons/md';
import { SectionShell } from './SettingsPrimitives.jsx';
import './GeneralSettingsPage.css';

const GeneralSettingsPage = ({ defaultBrowserState, onOpenDefaultBrowserSettings, discordProfile, onDiscordLogin, onDiscordLogout }) => (
  <SectionShell icon={MdAccountCircle} title="BlueFox et vous" description="Personnalisez votre navigateur et connectez votre compte Discord si vous le souhaitez.">
    <div className={`bluefox-settings-default-browser ${defaultBrowserState.isDefault ? 'is-confirmed' : ''}`}>
      <div>
        <strong>{defaultBrowserState.isDefault ? 'BlueFox est votre navigateur par défaut' : 'Définir BlueFox comme navigateur par défaut'}</strong>
        <p>{defaultBrowserState.isDefault ? 'Vous pouvez maintenant naviguer avec BlueFox en toute simplicité.' : 'Ouvrez les paramètres Windows pour choisir BlueFox comme navigateur utilisé par défaut.'}</p>
      </div>
      {defaultBrowserState.isDefault ? <span className="bluefox-settings-thanks">🎉 Merci !</span> : <button type="button" className="bluefox-settings-default-button" onClick={onOpenDefaultBrowserSettings}>Définir par défaut</button>}
    </div>
    {defaultBrowserState.isDefault && <div className="bluefox-settings-default-success">🎉 Merci d’avoir choisi BlueFox comme navigateur par défaut !</div>}

    <div className="bluefox-settings-discord-card">
      {discordProfile ? <img src={discordProfile.avatarUrl} alt="" className="bluefox-settings-discord-avatar" /> : <span className="bluefox-settings-discord-icon"><FaDiscord aria-hidden="true" /></span>}
      <div className="bluefox-settings-discord-copy">
        <strong>{discordProfile ? `Connecté en tant que ${discordProfile.globalName || discordProfile.username}` : 'Connecter Discord'}</strong>
        <p>{discordProfile ? `@${discordProfile.username} · Votre avatar apparaît dans la barre supérieure.` : 'Affichez votre avatar Discord dans BlueFox. La connexion est facultative.'}</p>
      </div>
      {discordProfile ? <button type="button" className="bluefox-settings-discord-button is-secondary" onClick={onDiscordLogout}>Déconnecter</button> : <button type="button" className="bluefox-settings-discord-button" onClick={onDiscordLogin}>Se connecter</button>}
    </div>
  </SectionShell>
);

export default GeneralSettingsPage;
