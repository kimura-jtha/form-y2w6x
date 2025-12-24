import { Suspense } from 'react';

import { Outlet } from 'react-router';

import { AppShell, Burger, Group, NavLink, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

import { LoadingFallback } from '@/components/LoadingFallback';

export function MainLayout() {
  const [opened, { toggle }] = useDisclosure();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 250, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Title order={3}>Form Management</Title>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <NavLink href="/" label="Home" />
      </AppShell.Navbar>

      <AppShell.Main>
        <Suspense fallback={<LoadingFallback />}>
          <Outlet />
        </Suspense>
      </AppShell.Main>
    </AppShell>
  );
}
