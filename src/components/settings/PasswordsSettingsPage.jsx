import React from 'react';
import { MdInfoOutline, MdKey } from 'react-icons/md';
import { InfoCard, SectionShell, StatusPill } from './SettingsPrimitives.jsx';
import './PasswordsSettingsPage.css';

const PasswordsSettingsPage = () => (
  <SectionShell icon={MdKey} title="Mots de passe et saisie automatique" description="Comprenez ce qui est actuellement géré par BlueFox.">
    <div className="bluefox-settings-status-row"><div><strong>Gestionnaire de mots de passe BlueFox</strong><p>Cette fonction n’est pas encore intégrée dans cette version.</p></div><StatusPill>Non activé</StatusPill></div>
    <InfoCard title="Vos données restent protégées" text="BlueFox ne sauvegarde ni ne synchronise vos mots de passe et données de saisie automatique dans son propre compte. Ne saisissez jamais une phrase secrète ou un mot de passe dans une extension inconnue." />
    <div className="bluefox-settings-security-note"><MdInfoOutline aria-hidden="true" /><span>Une future version pourra proposer un gestionnaire local chiffré, sans synchronisation activée par défaut.</span></div>
  </SectionShell>
);

export default PasswordsSettingsPage;
