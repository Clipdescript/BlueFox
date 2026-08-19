import React from 'react';
import { MdSearch } from 'react-icons/md';
import { getSearchEngineIcon, SEARCH_ENGINES } from '../../utils/searchEngines.js';
import { SectionShell } from './SettingsPrimitives.jsx';

const SearchEngineSettingsPage = ({ selectedEngineId, onSelect }) => (
  <SectionShell icon={MdSearch} title="Moteur de recherche" description="Choisissez le moteur utilisé par la barre d’adresse. Votre choix est enregistré automatiquement.">
    <div className="bluefox-settings-engine-list">
      {SEARCH_ENGINES.map((engine) => {
        const isSelected = engine.id === selectedEngineId;
        return <button type="button" key={engine.id} onClick={() => onSelect(engine.id)} className={`bluefox-settings-engine ${isSelected ? 'is-selected' : ''}`} aria-pressed={isSelected}><img src={getSearchEngineIcon(engine)} alt="" /><span className="bluefox-settings-engine-copy"><strong>{engine.name}</strong><small>{engine.description}</small><small><b>Point fort :</b> {engine.strength}</small></span>{isSelected && <span className="bluefox-settings-engine-status">Actuel</span>}</button>;
      })}
    </div>
  </SectionShell>
);

export default SearchEngineSettingsPage;
