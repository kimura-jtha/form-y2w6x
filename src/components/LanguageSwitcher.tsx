/**
 * Language switcher component
 * Allows users to change the application language
 */

import { Select } from '@mantine/core';
import { IconLanguage } from '@tabler/icons-react';

import type { SupportedLanguage } from '@/types/common';

import { useLanguage } from '@/hooks/useLanguage';

interface LanguageOption {
  value: SupportedLanguage;
  label: string;
  flag: string;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: 'ja', label: '日本語', flag: '🇯🇵' },
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'kr', label: '한국어', flag: '🇰🇷' },
  { value: 'zh', label: '中文', flag: '🇨🇳' },
];

interface LanguageSwitcherProps {
  variant?: 'default' | 'filled' | 'unstyled';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export function LanguageSwitcher({ variant = 'default', size = 'sm' }: LanguageSwitcherProps) {
  const { currentLanguage, changeLanguage, isReady } = useLanguage();

  if (!isReady) {
    return null;
  }

  return (
    <Select
      value={currentLanguage}
      onChange={(value: string | null) => {
        if (value) {
          if (value === currentLanguage) {
            return;
          }
          changeLanguage(value);
          setTimeout(() => {
            window.location.reload();
          }, 300);
        }
      }}
      data={LANGUAGE_OPTIONS.map((option) => ({
        value: option.value,
        label: `${option.flag} ${option.label}`,
      }))}
      leftSection={<IconLanguage size={16} />}
      variant={variant}
      size={size}
      w={160}
      comboboxProps={{ withinPortal: true }}
      allowDeselect={false}
    />
  );
}
