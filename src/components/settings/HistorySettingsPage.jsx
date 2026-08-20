import React from 'react';
import { MdDeleteOutline, MdHistory, MdSearch } from 'react-icons/md';
import { InfoCard, SectionShell } from './SettingsPrimitives.jsx';
import './HistorySettingsPage.css';

const HistorySettingsPage = ({ history, query, onQueryChange, onClear, onRemove }) => {
  const normalizedQuery = query.trim().toLocaleLowerCase('fr-FR');
  const visibleHistory = history.filter((entry) => `${entry.title || ''} ${entry.url || ''}`.toLocaleLowerCase('fr-FR').includes(normalizedQuery));

  return (
    <SectionShell icon={MdHistory} title="Historique" description="Retrouvez vos pages récentes et gérez facilement vos visites.">
      <div className="bluefox-settings-history-toolbar">
        <div className="bluefox-settings-history-search"><MdSearch aria-hidden="true" /><input type="search" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Rechercher une page" aria-label="Rechercher une page dans l’historique" /></div>
        {history.length > 0 && <button type="button" className="bluefox-settings-history-clear" onClick={onClear}>Tout supprimer</button>}
      </div>
      {visibleHistory.length > 0 ? <div className="bluefox-settings-history-list">
        <div className="bluefox-settings-history-heading"><strong>Visites récentes</strong><span>{visibleHistory.length} page{visibleHistory.length > 1 ? 's' : ''}</span></div>
        {visibleHistory.map((entry) => {
          let domain = entry.url;
          try { domain = new URL(entry.url).hostname.replace(/^www\./i, ''); } catch { /* URL locale ou invalide */ }
          const entryId = entry.id || `${entry.url}-${entry.timestamp}`;
          const rawTitle = String(entry.title || '').trim();
          const displayTitle = rawTitle && !/^https?:\/\//i.test(rawTitle) ? rawTitle : domain || 'Page visitée';
          return <div className="bluefox-settings-history-entry" key={entryId}>
            <img src={entry.favicon || `https://www.google.com/s2/favicons?domain=${domain}&sz=64`} alt="" onError={(event) => { event.currentTarget.style.visibility = 'hidden'; }} />
            <div className="bluefox-settings-history-copy"><strong title={displayTitle}>{displayTitle}</strong><small>{domain} · {entry.time || 'Visite récente'}</small></div>
            <button type="button" onClick={() => onRemove(entryId)} aria-label={`Supprimer ${displayTitle}`}><MdDeleteOutline aria-hidden="true" /></button>
          </div>;
        })}
      </div> : <InfoCard title={history.length ? 'Aucun résultat' : 'Historique vide'} text={history.length ? 'Aucune page ne correspond à votre recherche.' : 'Les titres des pages visitées apparaîtront ici après votre navigation.'} />}
    </SectionShell>
  );
};

export default HistorySettingsPage;
