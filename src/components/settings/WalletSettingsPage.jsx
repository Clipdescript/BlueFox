import React from 'react';
import { MdInfoOutline, MdWallet } from 'react-icons/md';
import { SectionShell, StatusPill } from './SettingsPrimitives.jsx';
import './WalletSettingsPage.css';

const WalletSettingsPage = () => (
  <SectionShell icon={MdWallet} title="Portefeuille BlueFox" description="Informations importantes avant toute utilisation d’un portefeuille numérique.">
    <div className="bluefox-settings-status-row"><div><strong>Portefeuille BlueFox</strong><p>Aucun portefeuille ou service de paiement intégré n’est actif dans cette version.</p></div><StatusPill>Non disponible</StatusPill></div>
    <div className="bluefox-settings-security-note is-warning"><MdInfoOutline aria-hidden="true" /><span>Ne partagez jamais votre phrase de récupération et ne signez pas une transaction depuis une extension dont vous ne connaissez pas l’origine.</span></div>
  </SectionShell>
);

export default WalletSettingsPage;
