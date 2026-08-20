import React, { useEffect, useState } from 'react';
import { MdAdd, MdLink, MdPublic, MdSearch } from 'react-icons/md';
import { addCustomSearchEngine, getSearchEngineIcon, getSearchEngineOrigin, getSearchEngines } from '../../utils/searchEngines.js';
import { SectionShell } from './SettingsPrimitives.jsx';
import './SearchEngineSettingsPage.css';

const SearchEngineSettingsPage = ({ selectedEngineId, onSelect }) => {
  const [engines, setEngines] = useState(getSearchEngines);
  const [customName, setCustomName] = useState('');
  const [customTemplate, setCustomTemplate] = useState('');
  const [customError, setCustomError] = useState('');

  useEffect(() => {
    const refreshEngines = () => setEngines(getSearchEngines());
    window.addEventListener('bluefox-search-engines-changed', refreshEngines);
    return () => window.removeEventListener('bluefox-search-engines-changed', refreshEngines);
  }, []);

  const handleAddCustomEngine = (event) => {
    event.preventDefault();
    const name = customName.trim();
    const template = customTemplate.trim();
    if (!name || !template.includes('{query}')) {
      setCustomError('Ajoutez un nom et une URL contenant {query}.');
      return;
    }
    try {
      const engine = addCustomSearchEngine({ name, template });
      setEngines(getSearchEngines());
      onSelect(engine.id);
      setCustomName('');
      setCustomTemplate('');
      setCustomError('');
    } catch {
      setCustomError('Cette URL n’est pas valide. Utilisez une adresse http:// ou https://.');
    }
  };

  return (
    <SectionShell icon={MdSearch} title="Moteur de recherche" description="Choisissez le moteur utilisé par la barre d’adresse. Votre choix est enregistré automatiquement.">
      <div className="bluefox-settings-engine-list">
        {engines.map((engine) => {
          const isSelected = engine.id === selectedEngineId;
          return <button type="button" key={engine.id} onClick={() => onSelect(engine.id)} className={`bluefox-settings-engine ${isSelected ? 'is-selected' : ''}`} aria-pressed={isSelected}>{engine.id === 'ask' ? <MdPublic className="bluefox-settings-engine-globe" aria-hidden="true" /> : <img src={getSearchEngineIcon(engine)} alt="" />}<span className="bluefox-settings-engine-copy"><strong>{engine.name}{engine.isCustom && <em>Personnalisé</em>}</strong><small>{engine.description}</small><small><b>Point fort :</b> {engine.strength}</small><small><b>Origine :</b> {getSearchEngineOrigin(engine)}</small></span>{isSelected && <span className="bluefox-settings-engine-status">Actuel</span>}</button>;
        })}
      </div>

      <form className="bluefox-settings-custom-engine" onSubmit={handleAddCustomEngine}>
        <div className="bluefox-settings-custom-engine-heading"><span className="bluefox-settings-custom-engine-icon"><MdAdd aria-hidden="true" /></span><div><strong>Ajouter un moteur personnalisé</strong><p>Ajoutez le site de recherche que vous souhaitez utiliser.</p></div></div>
        <label><span>Nom du moteur</span><input type="text" value={customName} onChange={(event) => setCustomName(event.target.value)} placeholder="Ex. Mon moteur" /></label>
        <label><span>URL de recherche</span><div className="bluefox-settings-custom-engine-input"><MdLink aria-hidden="true" /><input type="text" value={customTemplate} onChange={(event) => setCustomTemplate(event.target.value)} placeholder="https://exemple.com/search?q={query}" /></div></label>
        <p className="bluefox-settings-custom-engine-help">Remplacez le terme recherché par <code>{'{query}'}</code> dans l’URL.</p>
        {customError && <p className="bluefox-settings-custom-engine-error" role="alert">{customError}</p>}
        <button type="submit" className="bluefox-settings-custom-engine-submit">Ajouter ce moteur</button>
      </form>
    </SectionShell>
  );
};

export default SearchEngineSettingsPage;
