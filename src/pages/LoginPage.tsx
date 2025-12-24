import { type FormEvent, useState } from 'react';

import { useNavigate } from 'react-router';

import {
  Alert,
  Button,
  Card,
  Center,
  Container,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import { ROUTES } from '@/constants';
import { login } from '@/lib/lambda/auth';
import { setAccessKey } from '@/utils/auth';

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!email || !password) {
      setError(t('auth.login.errors.required'));
      return;
    }

    try {
      setIsLoading(true);
      const response = await login(email, password);

      if (response.success && response.accessKey) {
        setAccessKey(response.accessKey);
        navigate(ROUTES.ADMIN.FORMS);
      } else {
        setError(response.message || t('auth.login.errors.failed'));
      }
    } catch (error_) {
      console.error('Login error:', error_);
      setError(t('auth.login.errors.failed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container size="xs" style={{ minHeight: '100vh' }}>
      <Center style={{ minHeight: '100vh' }}>
        <Card shadow="md" padding="xl" radius="md" withBorder style={{ width: '100%' }}>
          <Stack gap="lg">
            <Stack gap="xs">
              <Title order={2} ta="center">
                {t('auth.login.title')}
              </Title>
              <Text size="sm" c="dimmed" ta="center">
                {t('auth.login.subtitle')}
              </Text>
            </Stack>

            {error && (
              <Alert icon={<IconAlertCircle size={16} />} color="red" title={t('common.error')}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Stack gap="md">
                <TextInput
                  label={t('auth.login.fields.email.label')}
                  placeholder={t('auth.login.fields.email.placeholder')}
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.currentTarget.value)}
                  required
                  disabled={isLoading}
                />

                <PasswordInput
                  label={t('auth.login.fields.password.label')}
                  placeholder={t('auth.login.fields.password.placeholder')}
                  value={password}
                  onChange={(event) => setPassword(event.currentTarget.value)}
                  required
                  disabled={isLoading}
                />

                <Button type="submit" fullWidth loading={isLoading}>
                  {t('auth.login.submit')}
                </Button>
              </Stack>
            </form>
          </Stack>
        </Card>
      </Center>
    </Container>
  );
}
