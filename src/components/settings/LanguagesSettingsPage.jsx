import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdLanguage, MdSearch, MdCheck } from 'react-icons/md';
import { detectDeviceLanguage, LANGUAGE_MODE_STORAGE_KEY, LANGUAGE_STORAGE_KEY } from '../../i18n.js';
import { SectionShell } from './SettingsPrimitives.jsx';
import './LanguagesSettingsPage.css';

const LanguagesSettingsPage = ({ languages }) => {
  const { t, i18n } = useTranslation('common');
  const [query, setQuery] = useState('');
  const [languageMode, setLanguageMode] = useState(() => {
    const mode = localStorage.getItem(LANGUAGE_MODE_STORAGE_KEY);
    return mode === 'manual' || (mode === null && Boolean(localStorage.getItem(LANGUAGE_STORAGE_KEY))) ? 'manual' : 'automatic';
  });
  const deviceLanguage = detectDeviceLanguage();
  const deviceLanguageName = languages.find(({ code }) => code === deviceLanguage)?.nativeName || deviceLanguage;
  const currentLanguage = i18n.language || 'fr';
  const currentBaseLanguage = currentLanguage.split('-')[0];
  const selectedLanguage = languages.some(({ code }) => code === currentLanguage)
    ? currentLanguage
    : currentBaseLanguage;

  const filteredLanguages = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return languages;
    return languages.filter(({ code, nativeName }) => `${code} ${nativeName}`.toLocaleLowerCase().includes(normalizedQuery));
  }, [languages, query]);

  const selectLanguage = (code) => {
    localStorage.setItem(LANGUAGE_MODE_STORAGE_KEY, 'manual');
    localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
    setLanguageMode('manual');
    void i18n.changeLanguage(code);
  };

  const selectAutomaticLanguage = () => {
    const detectedLanguage = detectDeviceLanguage();
    localStorage.setItem(LANGUAGE_MODE_STORAGE_KEY, 'automatic');
    localStorage.removeItem(LANGUAGE_STORAGE_KEY);
    setLanguageMode('automatic');
    void i18n.changeLanguage(detectedLanguage);
  };

  return (
    <SectionShell icon={MdLanguage} title={t('languages.title')} description={t('languages.description')}>
      <div className="bluefox-language-picker">
        <div className="bluefox-language-picker-header">
          <div>
            <strong>{t('languages.interfaceTitle')}</strong>
            <p>{t('languages.interfaceDescription')}</p>
          </div>
          <span className="bluefox-language-count">{t('languages.availableCount', { count: languages.length })}</span>
        </div>

        <button type="button" className={`bluefox-language-auto ${languageMode === 'automatic' ? 'is-selected' : ''}`} onClick={selectAutomaticLanguage} aria-pressed={languageMode === 'automatic'}>
          <span className="bluefox-language-option-copy"><strong>{t('languages.automatic')}</strong><small>{t('languages.automaticDescription', { language: deviceLanguageName })}</small></span>
          {languageMode === 'automatic' && <span className="bluefox-language-current"><MdCheck aria-hidden="true" />{t('languages.selected')}</span>}
        </button>

        <div className="bluefox-language-search">
          <MdSearch aria-hidden="true" />
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('languages.searchPlaceholder')} aria-label={t('languages.searchLabel')} />
        </div>

        <div className="bluefox-language-list" role="listbox" aria-label={t('languages.interfaceTitle')}>
          {filteredLanguages.map(({ code, nativeName, rtl }) => {
            const isSelected = code === selectedLanguage;
            return (
              <button type="button" role="option" aria-selected={isSelected} key={code} className={`bluefox-language-option ${isSelected ? 'is-selected' : ''}`} onClick={() => selectLanguage(code)} dir={rtl ? 'rtl' : 'ltr'}>
                <span className="bluefox-language-option-copy"><strong>{nativeName}</strong><small>{code}{rtl ? ` · ${t('languages.directionRtl')}` : ''}</small></span>
                {isSelected && <span className="bluefox-language-current"><MdCheck aria-hidden="true" />{t('languages.selected')}</span>}
              </button>
            );
          })}
          {filteredLanguages.length === 0 && <p className="bluefox-language-empty">{t('languages.noResults')}</p>}
        </div>

        <p className="bluefox-language-note">{t('languages.fallbackNote')}</p>
        {currentBaseLanguage !== 'fr' && <button type="button" className="bluefox-language-reset" onClick={() => selectLanguage('fr')}>{t('languages.reset')}</button>}
      </div>
    </SectionShell>
  );
};

export default LanguagesSettingsPage;
