/**
 * Language detection and management utilities
 */

import type { SupportedLanguage } from '@/types/common';

import { storage } from './storage';

const STORAGE_KEY = 'app_language';
const SUPPORTED_LANGUAGES = ['en', 'ja', 'kr', 'zh'] as const;
const DEFAULT_LANGUAGE: SupportedLanguage = 'ja';

/**
 * Country code to language mapping
 */
const COUNTRY_TO_LANGUAGE: Record<string, SupportedLanguage> = {
  JP: 'ja', // Japan
  KR: 'kr', // South Korea
  CN: 'zh', // China
  TW: 'zh', // Taiwan
  HK: 'zh', // Hong Kong
  // All other countries default to English
};

/**
 * Validate if a language code is supported
 */
export function isSupportedLanguage(lang: string): lang is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage);
}

/**
 * Get language from URL query parameters
 * Example: ?lang=en
 */
export function getLanguageFromQuery(): SupportedLanguage | null {
  const params = new URLSearchParams(window.location.search);
  const lang = params.get('lang');

  if (lang && isSupportedLanguage(lang)) {
    return lang;
  }

  return null;
}

/**
 * Map country code to language
 */
export function mapCountryToLanguage(countryCode: string): SupportedLanguage {
  const upperCountryCode = countryCode.toUpperCase();
  return COUNTRY_TO_LANGUAGE[upperCountryCode] || 'en';
}

/**
 * Get stored language from localStorage
 */
export function getStoredLanguage(): SupportedLanguage | null {
  const stored = storage.get<string>(STORAGE_KEY);
  if (stored && isSupportedLanguage(stored)) {
    return stored;
  }
  return null;
}

/**
 * Store language preference in localStorage
 */
export function storeLanguage(lang: SupportedLanguage): void {
  storage.set(STORAGE_KEY, lang);
}

/**
 * Clear stored language preference
 */
export function clearStoredLanguage(): void {
  storage.remove(STORAGE_KEY);
}

/**
 * Detect language based on priority:
 * 1. Query parameter (?lang=xx)
 * 2. Stored preference (localStorage)
 * 3. IP geolocation (country code)
 * 4. Default (ja)
 *
 * @param countryCode - Optional country code from geolocation
 * @returns Detected language code
 */
export function detectLanguage(countryCode?: string): SupportedLanguage {
  // Priority 1: Query parameter
  const queryLang = getLanguageFromQuery();
  if (queryLang) {
    storeLanguage(queryLang); // Store for future visits
    return queryLang;
  }

  // Priority 2: Stored preference
  const storedLang = getStoredLanguage();
  if (storedLang) {
    return storedLang;
  }

  // Priority 3: IP geolocation
  if (countryCode) {
    const geoLang = mapCountryToLanguage(countryCode);
    storeLanguage(geoLang); // Store for future visits
    return geoLang;
  }

  // Priority 4: Default
  return DEFAULT_LANGUAGE;
}

/**
 * Get browser language preference (fallback method)
 */
export function getBrowserLanguage(): SupportedLanguage {
  const browserLang = navigator.language.split('-')[0];
  if (isSupportedLanguage(browserLang)) {
    return browserLang;
  }
  return DEFAULT_LANGUAGE;
}
