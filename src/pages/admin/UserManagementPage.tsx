import { useEffect, useState } from 'react';

import { addUser, fetchUsers } from '@/lib/lambda/user';
import { formatDate } from '@/utils/string';
import {
  Box,
  Button,
  Group,
  Loader,
  Modal,
  Paper,
  PasswordInput,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconRefresh } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

type User = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

type AddUserFormValues = {
  name: string;
  email: string;
  password: string;
};

export function UserManagementPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addModalOpened, { open: openAddModal, close: closeAddModal }] = useDisclosure(false);

  const form = useForm<AddUserFormValues>({
    initialValues: {
      name: '',
      email: '',
      password: '',
    },
    validate: {
      email: (value) => {
        if (!value) return t('common.required');
        if (!/^\S+@\S+$/.test(value)) return 'Invalid email format';
        return null;
      },
      password: (value) => {
        if (!value) return t('common.required');
        if (value.length < 8) return 'Password must be at least 8 characters';
        return null;
      },
    },
  });

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const data = await fetchUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      notifications.show({
        title: t('admin.users.notifications.loadError.title'),
        message: t('admin.users.notifications.loadError.message'),
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAddUser = async (values: AddUserFormValues) => {
    try {
      setIsSubmitting(true);
      await addUser({ name: values.name, email: values.email, password: values.password });

      notifications.show({
        title: t('admin.users.notifications.addSuccess.title'),
        message: t('admin.users.notifications.addSuccess.message'),
        color: 'green',
      });

      form.reset();
      closeAddModal();
      loadUsers();
    } catch (error) {
      console.error('Failed to add user:', error);
      notifications.show({
        title: t('admin.users.notifications.addError.title'),
        message: t('admin.users.notifications.addError.message'),
        color: 'red',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2}>{t('admin.users.title')}</Title>
        <Group gap="sm">
          <Button leftSection={<IconRefresh size={16} />} onClick={loadUsers} variant="light">
            {t('admin.users.refresh')}
          </Button>
          <Button leftSection={<IconPlus size={16} />} onClick={openAddModal} color="green">
            {t('admin.users.addButton')}
          </Button>
        </Group>
      </Group>

      {/* Table */}
      <Paper shadow="xs" p="md">
        {isLoading ? (
          <Box style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <Loader />
          </Box>
        ) : (
          <>
            <Text size="sm" c="dimmed" mb="md">
              {users.length} {t('admin.users.table.usersFound')}
            </Text>
            <Table striped highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('admin.users.table.name')}</Table.Th>
                  <Table.Th>{t('admin.users.table.email')}</Table.Th>
                  <Table.Th>{t('admin.users.table.createdAt')}</Table.Th>
                  <Table.Th>{t('admin.users.table.updatedAt')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {users.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={4}>
                      <Text ta="center" c="dimmed">
                        {t('admin.users.table.noUsers')}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  users.map((user) => (
                    <Table.Tr key={user.id}>
                      <Table.Td>{user.name}</Table.Td>
                      <Table.Td>{user.email}</Table.Td>
                      <Table.Td>
                        <Text size="xs">
                          {formatDate(user.createdAt, false)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs">
                          {formatDate(user.updatedAt, false)}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </>
        )}
      </Paper>

      {/* Add User Modal */}
      <Modal
        opened={addModalOpened}
        onClose={closeAddModal}
        title={t('admin.users.modal.addTitle')}
        centered
      >
        <form
          onSubmit={form.onSubmit(() => {
            handleAddUser(form.values);
          })}
        >
          <Stack gap="md">
            <TextInput
              label={t('admin.users.modal.nameLabel')}
              placeholder={t('admin.users.modal.namePlaceholder')}
              required
              {...form.getInputProps('name')}
            />
            <TextInput
              label={t('admin.users.modal.emailLabel')}
              placeholder={t('admin.users.modal.emailPlaceholder')}
              required
              {...form.getInputProps('email')}
            />
            <PasswordInput
              label={t('admin.users.modal.passwordLabel')}
              placeholder={t('admin.users.modal.passwordPlaceholder')}
              required
              {...form.getInputProps('password')}
            />
            <Group justify="flex-end" gap="sm">
              <Button variant="light" onClick={closeAddModal} disabled={isSubmitting}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" color="green" loading={isSubmitting}>
                {t('admin.users.addButton')}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
