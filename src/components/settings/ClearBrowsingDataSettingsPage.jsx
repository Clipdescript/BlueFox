import React from 'react';
import { MdCleaningServices } from 'react-icons/md';
import { SectionShell } from './SettingsPrimitives.jsx';

const ClearBrowsingDataSettingsPage = ({ historyCount, onClear }) => (
  <SectionShell
    icon={MdCleaningServices}
    title="Effacer les données de navigation"
    description="Supprimez les données de navigation enregistrées localement par BlueFox."
  >
    <div className="bluefox-settings-row">
      <div>
        <strong>Historique de navigation</strong>
        <p>{historyCount > 0 ? `${historyCount} page${historyCount > 1 ? 's' : ''} enregistrée${historyCount > 1 ? 's' : ''}.` : 'Aucune page enregistrée.'}</p>
      </div>
      <button
        type="button"
        className="bluefox-settings-history-clear"
        onClick={onClear}
        disabled={historyCount === 0}
      >
        Effacer l’historique
      </button>
    </div>
  </SectionShell>
);

export default ClearBrowsingDataSettingsPage;
