import React, { useEffect, useState } from 'react';
import { MdClose, MdSecurity } from 'react-icons/md';
import { SectionShell, ToggleButton } from './SettingsPrimitives.jsx';
import './PrivacySettingsPage.css';

const PrivacySettingsPage = ({ enabled, onToggle, onClear }) => {
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
      <SectionShell icon={MdSecurity} title="Confidentialité et sécurité" description="Gardez le contrôle de vos données dans BlueFox.">
        <div className="bluefox-settings-toggle-row bluefox-settings-history-preference">
          <div>
            <strong>Enregistrer l’historique de navigation</strong>
            <p>{enabled ? 'Les pages que vous visitez sont conservées localement sur cet appareil.' : 'Les nouvelles pages visitées ne seront plus enregistrées dans votre historique local.'}</p>
          </div>
          <ToggleButton enabled={enabled && !isConfirmOpen} onClick={handleToggle} label={enabled ? 'Désactiver l’historique de navigation' : 'Activer l’historique de navigation'} />
        </div>

        <div className={`bluefox-settings-history-status ${enabled ? 'is-enabled' : 'is-disabled'}`} role="status">
          <span aria-hidden="true" />
          {enabled ? 'Historique activé' : 'Historique désactivé'}
        </div>
      </SectionShell>

      {isConfirmOpen && <div className="bluefox-history-confirm-backdrop" role="presentation" onMouseDown={cancelDisable}>
        <div className="bluefox-history-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="bluefox-history-confirm-title" onMouseDown={(event) => event.stopPropagation()}>
          <div className="bluefox-history-confirm-header">
            <div><h2 id="bluefox-history-confirm-title">Désactiver l’historique ?</h2></div>
            <button type="button" className="bluefox-history-confirm-close" onClick={cancelDisable} aria-label="Fermer"><MdClose aria-hidden="true" /></button>
          </div>
          <p>Cette action supprimera votre historique existant. Les nouvelles pages que vous visiterez ne seront plus enregistrées dans l’historique de navigation de BlueFox.</p>
          <div className="bluefox-history-confirm-actions">
            <button type="button" className="bluefox-history-confirm-cancel" onClick={cancelDisable}>Annuler</button>
            <button type="button" className="bluefox-history-confirm-disable" onClick={confirmDisable}>Désactiver</button>
          </div>
        </div>
      </div>}
    </>
  );
};

export default PrivacySettingsPage;
