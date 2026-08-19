import React from 'react';
import { MdClose, MdKeyboard, MdRefresh, MdSave, MdTab, MdUndo } from 'react-icons/md';
import { InfoCard, SectionShell } from './SettingsPrimitives.jsx';

const SHORTCUTS = [
  { icon: MdTab, title: 'Nouvel onglet', shortcut: 'Ctrl + T', description: 'Ouvre un nouvel onglet BlueFox.' },
  { icon: MdRefresh, title: 'Actualiser la page', shortcut: 'Ctrl + R', description: 'Recharge la page actuellement ouverte.' },
  { icon: MdRefresh, title: 'Actualiser la page', shortcut: 'F5', description: 'Recharge également la page active.' },
  { icon: MdClose, title: 'Fermer un menu', shortcut: 'Échap', description: 'Ferme le menu ouvert ou une fenêtre de suggestions.' },
  { icon: MdSave, title: 'Enregistrer un PDF', shortcut: 'Ctrl + S', description: 'Disponible dans l’éditeur PDF.' },
  { icon: MdUndo, title: 'Annuler dans un PDF', shortcut: 'Ctrl + Z', description: 'Annule la dernière modification dans l’éditeur PDF.' },
];

const ShortcutCard = ({ icon: Icon, title, shortcut, description }) => (
  <div className="bluefox-settings-action" role="group" aria-label={`${title} : ${shortcut}`}>
    <Icon aria-hidden="true" />
    <span>
      <strong>{title}</strong>
      <small>{description}</small>
    </span>
    <kbd className="bluefox-settings-shortcut-key">{shortcut}</kbd>
  </div>
);

const ActionsSettingsPage = () => (
  <SectionShell icon={MdKeyboard} title="Raccourcis clavier" description="Les raccourcis disponibles dans BlueFox et l’éditeur PDF.">
    <div className="bluefox-settings-action-grid">
      {SHORTCUTS.map((shortcut) => <ShortcutCard key={`${shortcut.title}-${shortcut.shortcut}`} {...shortcut} />)}
    </div>
    <InfoCard title="Raccourcis selon la page" text="Certains raccourcis, comme l’enregistrement et l’annulation, sont disponibles uniquement lorsque l’éditeur PDF est ouvert." />
  </SectionShell>
);

export default ActionsSettingsPage;
