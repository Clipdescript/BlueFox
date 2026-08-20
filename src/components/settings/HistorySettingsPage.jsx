import React from 'react';
import { useTranslation } from 'react-i18next';
import { MdDeleteOutline, MdHistory, MdSearch } from 'react-icons/md';
import { InfoCard, SectionShell } from './SettingsPrimitives.jsx';
import './HistorySettingsPage.css';

const HistorySettingsPage = ({ history, query, onQueryChange, onClear, onRemove }) => {
  const { t } = useTranslation('common');
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleHistory = history.filter((entry) => `${entry.title || ''} ${entry.url || ''}`.toLocaleLowerCase('fr-FR').includes(normalizedQuery));

  return (
    <SectionShell icon={MdHistory} title={t('settings.nav.history')} description={t('settingsExtra.historyDescription')}>
      <div className="bluefox-settings-history-toolbar">
        <div className="bluefox-settings-history-search"><MdSearch aria-hidden="true" /><input type="search" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder={t('settingsExtra.searchPage')} aria-label={t('settingsExtra.searchHistoryLabel')} /></div>
        {history.length > 0 && <button type="button" className="bluefox-settings-history-clear" onClick={onClear}>{t('settingsExtra.deleteAll')}</button>}
      </div>
      {visibleHistory.length > 0 ? <div className="bluefox-settings-history-list">
        <div className="bluefox-settings-history-heading"><strong>{t('settingsExtra.recentVisits')}</strong><span>{t('settingsMore.pages', { count: visibleHistory.length, plural: visibleHistory.length > 1 ? 's' : '' })}</span></div>
        {visibleHistory.map((entry) => {
          let domain = entry.url;
          try { domain = new URL(entry.url).hostname.replace(/^www\./i, ''); } catch { /* URL locale ou invalide */ }
          const entryId = entry.id || `${entry.url}-${entry.timestamp}`;
          const rawTitle = String(entry.title || '').trim();
          const displayTitle = rawTitle && !/^https?:\/\//i.test(rawTitle) ? rawTitle : domain || t('settingsMore.pageVisited');
          return <div className="bluefox-settings-history-entry" key={entryId}>
            <img src={entry.favicon || `https://www.google.com/s2/favicons?domain=${domain}&sz=64`} alt="" onError={(event) => { event.currentTarget.style.visibility = 'hidden'; }} />
            <div className="bluefox-settings-history-copy"><strong title={displayTitle}>{displayTitle}</strong><small>{domain} · {entry.time || t('settingsMore.recentVisit')}</small></div>
            <button type="button" onClick={() => onRemove(entryId)} aria-label={t('settingsMore.remove', { name: displayTitle })}><MdDeleteOutline aria-hidden="true" /></button>
          </div>;
        })}
      </div> : <InfoCard title={history.length ? t('settings.noResults') : t('settingsExtra.emptyHistory')} text={history.length ? t('settingsExtra.noMatchingPage') : t('settingsExtra.historyDescription')} />}
    </SectionShell>
  );
};

export default HistorySettingsPage;
