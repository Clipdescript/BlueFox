import React from 'react';
import { MdViewInAr } from 'react-icons/md';
import { SectionShell, StatusPill } from './SettingsPrimitives.jsx';

const ExtensionsSettingsPage = ({ onOpenExtensions }) => (
  <SectionShell icon={MdViewInAr} title="Extensions" description="Ajoutez des outils à BlueFox depuis le catalogue officiel.">
    <div className="bluefox-settings-status-row"><div><strong>BlueFox Add-ons</strong><p>Consultez les extensions disponibles sur le site officiel BlueFox.</p></div><StatusPill>Catalogue officiel</StatusPill></div>
    <button type="button" className="bluefox-settings-primary-button" onClick={onOpenExtensions}>Ouvrir BlueFox Add-ons</button>
    <p className="bluefox-settings-footnote">L’icône reprend celle du bouton Extensions de la barre d’outils. Installez uniquement des extensions de confiance et vérifiez leurs permissions.</p>
  </SectionShell>
);

export default ExtensionsSettingsPage;
