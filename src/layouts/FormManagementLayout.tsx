import { Outlet } from 'react-router';

import { Affix, AppShell } from '@mantine/core';

import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export function FormManagementLayout() {
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
