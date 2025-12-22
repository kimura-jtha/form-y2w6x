import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { getCountryCodeWithCache } from '@/services/geolocation';
import { detectLanguage } from '@/utils/language';

import en from './locales/en.json';
import ja from './locales/ja.json';
import kr from './locales/kr.json';
import zh from './locales/zh.json';

export const defaultNS = 'translation';
export const resources = {
  en: { translation: en },
  ja: { translation: ja },
  kr: { translation: kr },
  zh: { translation: zh },
} as const;

/**
 * Initialize i18n with language detection
 */
async function initializeI18n() {
  // Get country code from geolocation (cached or fresh)
  const countryCode = await getCountryCodeWithCache();

  // Detect language based on priority:
  // 1. Query parameter (?lang=xx)
  // 2. Stored preference (localStorage)
  // 3. IP geolocation (country code)
  // 4. Default (ja)
  const detectedLanguage = detectLanguage(countryCode || undefined);

  await i18n.use(initReactI18next).init({
    resources,
    lng: detectedLanguage,
    fallbackLng: 'en',
    defaultNS,
    interpolation: {
      escapeValue: false,
    },
  });

  return i18n;
}

// Initialize i18n asynchronously
initializeI18n().catch((error) => {
  console.error('Failed to initialize i18n:', error);
  // Fallback to default initialization if detection fails
  i18n.use(initReactI18next).init({
    resources,
    lng: 'ja',
    fallbackLng: 'en',
    defaultNS,
    interpolation: {
      escapeValue: false,
    },
  });
});

export default i18n;
