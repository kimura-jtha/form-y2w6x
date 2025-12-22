import { useState } from 'react';

import { Outlet, useLocation, useNavigate } from 'react-router';

import { AppShell, Button, Container, Group, Tabs } from '@mantine/core';
import { IconFileText, IconKey, IconLogout, IconSettings, IconTrophy } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import { ChangePasswordModal } from '@/components/ChangePasswordModal';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ROUTES } from '@/constants';
import { clearAuth } from '@/utils/auth';

export function AdminLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = location.pathname;
  const [changePasswordOpened, setChangePasswordOpened] = useState(false);

  const handleLogout = () => {
    clearAuth();
    navigate(ROUTES.AUTH.LOGIN);
  };

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Container size="xl" h="100%" style={{ display: 'flex', alignItems: 'center' }}>
          <Group justify="space-between" w="100%">
            <Tabs value={activeTab} onChange={(value) => value && navigate(value)}>
              <Tabs.List>
                <Tabs.Tab
                  fw="600"
                  value={ROUTES.ADMIN.FORMS}
                  leftSection={<IconFileText size={16} />}
                >
                  {t('admin.navigation.forms')}
                </Tabs.Tab>
                <Tabs.Tab
                  fw="600"
                  value={ROUTES.ADMIN.TOURNAMENTS}
                  leftSection={<IconTrophy size={16} />}
                >
                  {t('admin.navigation.tournaments')}
                </Tabs.Tab>
                <Tabs.Tab
                  fw="600"
                  value={ROUTES.ADMIN.SERVICES}
                  leftSection={<IconSettings size={16} />}
                >
                  {t('admin.navigation.services')}
                </Tabs.Tab>
              </Tabs.List>
            </Tabs>
            <Group gap="xs">
              <LanguageSwitcher />
              <Button
                variant="light"
                color="blue"
                leftSection={<IconKey size={16} />}
                onClick={() => setChangePasswordOpened(true)}
              >
                {t('admin.changePassword.button')}
              </Button>
              <Button
                variant="light"
                color="red"
                leftSection={<IconLogout size={16} />}
                onClick={handleLogout}
              >
                {t('common.logout')}
              </Button>
            </Group>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="xl">
          <Outlet />
        </Container>
      </AppShell.Main>

      <ChangePasswordModal
        opened={changePasswordOpened}
        onClose={() => setChangePasswordOpened(false)}
      />
    </AppShell>
  );
}
