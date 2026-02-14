import { PrizeClaimForm } from '@/components/PrizeClaimForm';
import { validatePasswordV3 } from '@/utils/auth';
import { Box, Button, Paper, Stack, Text, TextInput, Title } from '@mantine/core';
import { type KeyboardEvent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const PASSWORD_CACHE_KEY = '__form_password__';

export function FormPage() {
  const { t } = useTranslation();
  const [isPasswordValidated, setIsPasswordValidated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [validatedPassword, setValidatedPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isValidatingPassword, setIsValidatingPassword] = useState(false);
  const [isCheckingCache, setIsCheckingCache] = useState(true);

  // On mount, check cached password
  useEffect(() => {
    const cached = localStorage.getItem(PASSWORD_CACHE_KEY);
    if (cached && validatePasswordV3(cached)) {
      setValidatedPassword(cached);
      setIsPasswordValidated(true);
    } else {
      localStorage.removeItem(PASSWORD_CACHE_KEY);
    }
    setIsCheckingCache(false);
  }, []);

  // Handle password validation before showing form
  const handlePasswordValidation = useCallback(async () => {
    if (!passwordInput.trim()) {
      setPasswordError(t('prizeClaim.validation.required'));
      return;
    }

    setIsValidatingPassword(true);
    setPasswordError('');

    try {
      // Simulate async validation delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 300));

      const isValid = validatePasswordV3(passwordInput);

      if (isValid) {
        localStorage.setItem(PASSWORD_CACHE_KEY, passwordInput);
        setValidatedPassword(passwordInput);
        setIsPasswordValidated(true);
      } else {
        localStorage.removeItem(PASSWORD_CACHE_KEY);
        setPasswordError(t('prizeClaim.validation.invalidPassword'));
        setPasswordInput('');
      }
    } catch {
      localStorage.removeItem(PASSWORD_CACHE_KEY);
      setPasswordError(t('prizeClaim.validation.invalidPassword'));
      setPasswordInput('');
    } finally {
      setIsValidatingPassword(false);
    }
  }, [passwordInput, t]);

  const handlePasswordKeyPress = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handlePasswordValidation();
      }
    },
    [handlePasswordValidation],
  );

  // Wait for cache check before rendering
  if (isCheckingCache) {
    return null;
  }

  // Show password gate if password not validated
  if (!isPasswordValidated) {
    return (
      <Box maw={500} mx="auto" p="md">
        <Title order={2} mb="lg" ta="center">
          {t('prizeClaim.title')}
        </Title>

        <Paper shadow="md" p="xl" withBorder>
          <Stack gap="lg">
            <Stack gap="xs">
              <Title order={4} ta="center">
                {t('prizeClaim.passwordGate.title')}
              </Title>
              <Text size="sm" c="dimmed" ta="center">
                {t('prizeClaim.passwordGate.description')}
              </Text>
            </Stack>

            <TextInput
              label={t('prizeClaim.fields.password.label')}
              placeholder={t('prizeClaim.fields.password.placeholder')}
              type="password"
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                setPasswordError('');
              }}
              onKeyDown={handlePasswordKeyPress}
              error={passwordError}
              disabled={isValidatingPassword}
              autoFocus
              size="md"
            />

            <Button
              fullWidth
              size="md"
              onClick={handlePasswordValidation}
              loading={isValidatingPassword}
              disabled={!passwordInput.trim()}
            >
              {t('prizeClaim.passwordGate.submit')}
            </Button>
          </Stack>
        </Paper>
      </Box>
    );
  }

  return <PrizeClaimForm password={validatedPassword} />;
}
