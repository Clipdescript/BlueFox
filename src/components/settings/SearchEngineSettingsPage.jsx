import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdLink, MdPublic, MdSearch } from 'react-icons/md';
import { addCustomSearchEngine, getSearchEngineIcon, getSearchEngineOrigin, getSearchEngines } from '../../utils/searchEngines.js';
import { SectionShell } from './SettingsPrimitives.jsx';
import './SearchEngineSettingsPage.css';

const SearchEngineSettingsPage = ({ selectedEngineId, onSelect }) => {
  const { t, i18n } = useTranslation('common');
  const activeLanguage = i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'fr';
  const localizeEngine = (engine) => {
    const translationId = engine.isCustom ? 'custom' : engine.id;
    return {
      name: engine.id === 'wikipedia'
        ? t('searchEngines.wikipedia.name', { lng: activeLanguage, defaultValue: 'Wikipedia' })
        : engine.name,
      description: t(`searchEngines.${translationId}.description`, { lng: activeLanguage, defaultValue: activeLanguage === 'en' ? 'Search engine description unavailable.' : engine.description }),
      strength: t(`searchEngines.${translationId}.strength`, { lng: activeLanguage, defaultValue: activeLanguage === 'en' ? 'Search engine information unavailable.' : engine.strength })
    };
  };
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
      setCustomError(t('settingsMore.customInvalid', { query: '{query}' }));
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
      setCustomError(t('settingsMore.customUrlInvalid'));
    }
  };

  return (
    <SectionShell icon={MdSearch} title={t('settings.nav.search')} description={t('settingsExtra.searchEngineDescription')}>
      <div className="bluefox-settings-engine-list">
        {engines.map((engine) => {
          const isSelected = engine.id === selectedEngineId;
          const localizedEngine = localizeEngine(engine);
          return <button type="button" key={engine.id} onClick={() => onSelect(engine.id)} className={`bluefox-settings-engine ${isSelected ? 'is-selected' : ''}`} aria-pressed={isSelected}>{engine.id === 'ask' ? <MdPublic className="bluefox-settings-engine-globe" aria-hidden="true" /> : <img src={getSearchEngineIcon(engine)} alt="" />}<span className="bluefox-settings-engine-copy"><strong>{localizedEngine.name}{engine.isCustom && <em>{t('settingsExtra.searchEngineCustom')}</em>}</strong><small>{localizedEngine.description}</small><small><b>{t('settingsExtra.strength')} :</b> {localizedEngine.strength}</small><small><b>{t('settingsExtra.origin')} :</b> {getSearchEngineOrigin(engine, activeLanguage)}</small></span>{isSelected && <span className="bluefox-settings-engine-status">{t('settings.current')}</span>}</button>;
        })}
      </div>

      <form className="bluefox-settings-custom-engine" onSubmit={handleAddCustomEngine}>
        <div className="bluefox-settings-custom-engine-heading"><span className="bluefox-settings-custom-engine-icon"><MdAdd aria-hidden="true" /></span><div><strong>{t('settingsExtra.searchEngineCustom')}</strong><p>{t('settingsMore.customEngineIntro')}</p></div></div>
        <label><span>{t('settingsMore.customName')}</span><input type="text" value={customName} onChange={(event) => setCustomName(event.target.value)} placeholder={t('settingsMore.customPlaceholder')} /></label>
        <label><span>{t('settingsMore.customUrl')}</span><div className="bluefox-settings-custom-engine-input"><MdLink aria-hidden="true" /><input type="text" value={customTemplate} onChange={(event) => setCustomTemplate(event.target.value)} placeholder={t('settingsMore.customUrlPlaceholder', { query: '{query}' })} /></div></label>
        <p className="bluefox-settings-custom-engine-help">{t('settingsMore.customEngineHelp', { query: '{query}' })}</p>
        {customError && <p className="bluefox-settings-custom-engine-error" role="alert">{customError}</p>}
        <button type="submit" className="bluefox-settings-custom-engine-submit">{t('settingsExtra.add')} {t('settingsExtra.searchEngineCustom')}</button>
      </form>
    </SectionShell>
  );
};

export default SearchEngineSettingsPage;
