import React from 'react';
import { MdSecurity } from 'react-icons/md';
import { SectionShell, StatusPill } from './SettingsPrimitives.jsx';

const PrivacySettingsPage = () => (
  <SectionShell icon={MdSecurity} title="Confidentialité et sécurité" description="Gardez le contrôle de vos données dans BlueFox.">
    <div className="bluefox-settings-row"><div><strong>Historique de navigation</strong><p>BlueFox conserve uniquement les pages que vous choisissez de garder dans votre historique local.</p></div><StatusPill>Local</StatusPill></div>
  </SectionShell>
);

export default PrivacySettingsPage;
