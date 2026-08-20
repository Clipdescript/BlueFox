import React from 'react';
import { MdWifi } from 'react-icons/md';
import { InfoCard, SectionShell, StatusPill } from './SettingsPrimitives.jsx';
import './VpnSettingsPage.css';

const VpnSettingsPage = () => (
  <SectionShell icon={MdWifi} title="VPN BlueFox" description="État du service de protection de la connexion.">
    <div className="bluefox-settings-status-row"><div><strong>VPN BlueFox</strong><p>Aucun tunnel VPN n’est actuellement fourni ou connecté par BlueFox.</p></div><StatusPill>Indisponible</StatusPill></div>
    <InfoCard title="À savoir" text="Le VPN n’est pas activé par défaut et BlueFox ne prétend pas masquer votre adresse IP. Pour une protection réelle, utilisez un service VPN reconnu et vérifiez sa politique de confidentialité." />
  </SectionShell>
);

export default VpnSettingsPage;
