import { type KeyboardEvent, useState } from 'react';

import { PrizeClaimForm } from '@/components/PrizeClaimForm';
import { validatePasswordV2 } from '@/utils/auth';
import { Box, Button, Paper, Stack, Text, TextInput, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';

export function FormPage() {
  const { t } = useTranslation();
  const [isPasswordValidated, setIsPasswordValidated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [validatedPassword, setValidatedPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isValidatingPassword, setIsValidatingPassword] = useState(false);

  // Handle password validation before showing form
  const handlePasswordValidation = async () => {
    if (!passwordInput.trim()) {
      setPasswordError(t('prizeClaim.validation.required'));
      return;
    }

    setIsValidatingPassword(true);
    setPasswordError('');

    try {
      // Simulate async validation delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 300));

      const isValid = validatePasswordV2(passwordInput);

      if (isValid) {
        setValidatedPassword(passwordInput);
        setIsPasswordValidated(true);
      } else {
        setPasswordError(t('prizeClaim.validation.invalidPassword'));
        setPasswordInput('');
      }
    } catch {
      setPasswordError(t('prizeClaim.validation.invalidPassword'));
      setPasswordInput('');
    } finally {
      setIsValidatingPassword(false);
    }
  };

  const handlePasswordKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handlePasswordValidation();
    }
  };

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
