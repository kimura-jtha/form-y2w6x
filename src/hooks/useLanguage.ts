/**
 * Language management hook
 */

import { useCallback } from 'react';

import { useTranslation } from 'react-i18next';

import type { SupportedLanguage } from '@/types/common';

import { isSupportedLanguage, storeLanguage } from '@/utils/language';

export function useLanguage() {
  const { i18n } = useTranslation();

  const currentLanguage = i18n.language as SupportedLanguage;

  const changeLanguage = useCallback(
    async (lang: string) => {
      if (!isSupportedLanguage(lang)) {
        console.warn(`Unsupported language: ${lang}`);
        return;
      }

      try {
        await i18n.changeLanguage(lang);
        storeLanguage(lang);

        // Update URL query parameter to reflect language change
        const url = new URL(window.location.href);
        url.searchParams.set('lang', lang);
        window.history.replaceState({}, '', url.toString());
      } catch (error) {
        console.error('Failed to change language:', error);
      }
    },
    [i18n],
  );

  return {
    currentLanguage,
    changeLanguage,
    isReady: i18n.isInitialized,
  };
}
