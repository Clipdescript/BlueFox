import React from 'react';
import { useTranslation } from 'react-i18next';
import { MdClose, MdKeyboard, MdRefresh, MdSave, MdTab, MdUndo } from 'react-icons/md';
import { InfoCard, SectionShell } from './SettingsPrimitives.jsx';
import './ActionsSettingsPage.css';

const SHORTCUTS = [
  { icon: MdTab, titleKey: 'settingsExtra.shortcutNewTab', descriptionKey: 'settingsExtra.shortcutNewTabText', shortcut: 'Ctrl + T' },
  { icon: MdRefresh, titleKey: 'settingsExtra.shortcutReload', descriptionKey: 'settingsExtra.shortcutReloadText', shortcut: 'Ctrl + R' },
  { icon: MdRefresh, titleKey: 'settingsExtra.shortcutReload', descriptionKey: 'settingsExtra.shortcutReloadF5Text', shortcut: 'F5' },
  { icon: MdClose, titleKey: 'settingsExtra.shortcutClose', descriptionKey: 'settingsExtra.shortcutCloseText', shortcut: 'Échap' },
  { icon: MdSave, titleKey: 'settingsExtra.shortcutSavePdf', descriptionKey: 'settingsExtra.shortcutSavePdfText', shortcut: 'Ctrl + S' },
  { icon: MdUndo, titleKey: 'settingsExtra.shortcutUndoPdf', descriptionKey: 'settingsExtra.shortcutUndoPdfText', shortcut: 'Ctrl + Z' },
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

const ActionsSettingsPage = () => {
  const { t } = useTranslation('common');
  return <SectionShell icon={MdKeyboard} title={t('settings.nav.actions')} description={t('settingsExtra.actionsDescription')}>
    <div className="bluefox-settings-action-grid">
      {SHORTCUTS.map((shortcut) => <ShortcutCard key={`${shortcut.titleKey}-${shortcut.shortcut}`} {...shortcut} title={t(shortcut.titleKey)} description={t(shortcut.descriptionKey)} />)}
    </div>
    <InfoCard title={t('settingsExtra.shortcutsByPage')} text={t('settingsExtra.shortcutsByPageText')} />
  </SectionShell>;
};

export default ActionsSettingsPage;
