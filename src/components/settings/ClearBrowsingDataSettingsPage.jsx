import React from 'react';
import { useTranslation } from 'react-i18next';
import { MdCleaningServices } from 'react-icons/md';
import { SectionShell } from './SettingsPrimitives.jsx';
import './ClearBrowsingDataSettingsPage.css';

const ClearBrowsingDataSettingsPage = ({ historyCount, onClear }) => {
  const { t } = useTranslation('common');
  return <SectionShell
    icon={MdCleaningServices}
    title={t('settings.nav.clearData')}
    description={t('settingsExtra.clearDataDescription')}
  >
    <div className="bluefox-settings-row">
      <div>
        <strong>{t('settingsExtra.browsingHistory')}</strong>
        <p>{historyCount > 0 ? t('settingsMore.savedPage', { count: historyCount, plural: historyCount > 1 ? 's' : '' }) : t('settingsMore.noSavedPage')}</p>
      </div>
      <button
        type="button"
        className="bluefox-settings-history-clear"
        onClick={onClear}
        disabled={historyCount === 0}
      >
        {t('settingsExtra.clearHistory')}
      </button>
    </div>
  </SectionShell>;
};

export default ClearBrowsingDataSettingsPage;
