import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdClose, MdSecurity } from 'react-icons/md';
import { SectionShell, ToggleButton } from './SettingsPrimitives.jsx';
import './PrivacySettingsPage.css';

const PrivacySettingsPage = ({ enabled, onToggle, onClear }) => {
  const { t } = useTranslation('common');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    if (!enabled) setIsConfirmOpen(false);
  }, [enabled]);

  useEffect(() => {
    if (!isConfirmOpen) return undefined;
    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsConfirmOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isConfirmOpen]);

  const handleToggle = () => {
    if (enabled) {
      setIsConfirmOpen(true);
      return;
    }
    onToggle(true);
  };

  const cancelDisable = () => setIsConfirmOpen(false);
  const confirmDisable = () => {
    onClear();
    onToggle(false);
    setIsConfirmOpen(false);
  };

  return (
    <>
      <SectionShell icon={MdSecurity} title={t('settings.nav.privacy')} description={t('settingsPages.privacyDescription')}>
        <div className="bluefox-settings-toggle-row bluefox-settings-history-preference">
          <div>
            <strong>{t('settingsPages.historySave')}</strong>
            <p>{enabled ? t('settingsPages.historyOnText') : t('settingsPages.historyOffText')}</p>
          </div>
          <ToggleButton enabled={enabled && !isConfirmOpen} onClick={handleToggle} label={enabled ? t('settingsPages.disabled') : t('settingsPages.enabled')} />
        </div>

        <div className={`bluefox-settings-history-status ${enabled ? 'is-enabled' : 'is-disabled'}`} role="status">
          <span aria-hidden="true" />
          {enabled ? t('settingsPages.historyOn') : t('settingsPages.historyOff')}
        </div>
      </SectionShell>

      {isConfirmOpen && <div className="bluefox-history-confirm-backdrop" role="presentation" onMouseDown={cancelDisable}>
        <div className="bluefox-history-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="bluefox-history-confirm-title" onMouseDown={(event) => event.stopPropagation()}>
          <div className="bluefox-history-confirm-header">
            <div><h2 id="bluefox-history-confirm-title">{t('settingsMore.privacyDisableTitle')}</h2></div>
            <button type="button" className="bluefox-history-confirm-close" onClick={cancelDisable} aria-label="Fermer"><MdClose aria-hidden="true" /></button>
          </div>
          <p>{t('settingsMore.privacyDisableText')}</p>
          <div className="bluefox-history-confirm-actions">
            <button type="button" className="bluefox-history-confirm-cancel" onClick={cancelDisable}>{t('settingsMore.cancel')}</button>
            <button type="button" className="bluefox-history-confirm-disable" onClick={confirmDisable}>{t('settingsMore.disable')}</button>
          </div>
        </div>
      </div>}
    </>
  );
};

export default PrivacySettingsPage;
