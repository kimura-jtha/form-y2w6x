import { Outlet } from 'react-router';

import { Affix, AppShell } from '@mantine/core';
import { useTranslation } from 'react-i18next';

import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useDocumentTitle } from '@/hooks';

export function FormManagementLayout() {
  const { t } = useTranslation();

  useDocumentTitle(t('documentTitle.player'));

  return (
    <AppShell padding="md">
      <AppShell.Main>
        <Affix position={{ top: 10, right: 10 }}>
          <LanguageSwitcher />
        </Affix>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
