import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import fr from './locales/fr.json';
import en from './locales/en.json';
import { SUPPORTED_LANGUAGES } from './i18n/languages.js';

const supportedLanguageCodes = SUPPORTED_LANGUAGES.map(({ code }) => code);
export const LANGUAGE_STORAGE_KEY = 'bluefox_language';
export const LANGUAGE_MODE_STORAGE_KEY = 'bluefox_language_mode_v1';

export const detectDeviceLanguage = () => {
  const candidates = [
    ...(Array.isArray(navigator.languages) ? navigator.languages : []),
    navigator.language
  ].filter(Boolean);
  const detected = candidates
    .map((language) => String(language).split('-')[0].toLowerCase())
    .find((language) => supportedLanguageCodes.includes(language));
  return detected || 'fr';
};

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        fr: { common: fr },
        en: { common: en },
      },
      fallbackLng: 'fr',
      supportedLngs: supportedLanguageCodes,
      nonExplicitSupportedLngs: true,
      load: 'languageOnly',
      ns: ['common'],
      defaultNS: 'common',
      detection: {
        order: ['localStorage', 'navigator', 'htmlTag'],
        lookupLocalStorage: LANGUAGE_STORAGE_KEY,
        // Automatic detection must not permanently cache the device language.
        // Manual choices are saved explicitly from the language settings page.
        caches: [],
      },
      interpolation: {
        escapeValue: false,
      },
      returnNull: false,
      returnEmptyString: false,
    });
}

const applyDocumentLanguage = (language) => {
  const normalizedLanguage = language.split('-')[0];
  const languageInfo = SUPPORTED_LANGUAGES.find(({ code }) => code === normalizedLanguage);
  document.documentElement.lang = normalizedLanguage;
  document.documentElement.dir = languageInfo?.rtl ? 'rtl' : 'ltr';
  window.electron?.setBrowserLanguage?.(normalizedLanguage);
};

i18n.on('languageChanged', applyDocumentLanguage);
applyDocumentLanguage(i18n.language || detectDeviceLanguage());

window.addEventListener('languagechange', () => {
  const mode = localStorage.getItem(LANGUAGE_MODE_STORAGE_KEY);
  const hasLegacyManualChoice = mode === null && Boolean(localStorage.getItem(LANGUAGE_STORAGE_KEY));
  if (mode === 'manual' || hasLegacyManualChoice) return;
  void i18n.changeLanguage(detectDeviceLanguage());
});

export default i18n;
