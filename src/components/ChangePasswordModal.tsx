import { type FormEvent, useState } from 'react';

import { Alert, Button, Group, Modal, PasswordInput, Stack, Text } from '@mantine/core';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import { changePassword } from '@/lib/lambda/auth';

interface ChangePasswordModalProps {
  opened: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ opened, onClose }: ChangePasswordModalProps) {
  const { t } = useTranslation();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess(false);

    // Validation
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError(t('admin.changePassword.errors.required'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('admin.changePassword.errors.mismatch'));
      return;
    }

    if (newPassword.length < 8) {
      setError(t('admin.changePassword.errors.tooShort'));
      return;
    }

    if (oldPassword === newPassword) {
      setError(t('admin.changePassword.errors.samePassword'));
      return;
    }

    try {
      setIsLoading(true);
      const response = await changePassword(oldPassword, newPassword);

      if (response.success) {
        setSuccess(true);
        resetForm();
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        setError(response.message || t('admin.changePassword.errors.failed'));
      }
    } catch (error_) {
      console.error('Change password error:', error_);
      setError(t('admin.changePassword.errors.failed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Text fw={600} size="lg">
          {t('admin.changePassword.title')}
        </Text>
      }
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          {error && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" title={t('common.error')}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert icon={<IconCheck size={16} />} color="green" title={t('common.success')}>
              {t('admin.changePassword.success')}
            </Alert>
          )}

          <PasswordInput
            label={t('admin.changePassword.fields.oldPassword.label')}
            placeholder={t('admin.changePassword.fields.oldPassword.placeholder')}
            value={oldPassword}
            onChange={(event) => setOldPassword(event.currentTarget.value)}
            required
            disabled={isLoading || success}
          />

          <PasswordInput
            label={t('admin.changePassword.fields.newPassword.label')}
            placeholder={t('admin.changePassword.fields.newPassword.placeholder')}
            value={newPassword}
            onChange={(event) => setNewPassword(event.currentTarget.value)}
            required
            disabled={isLoading || success}
          />

          <PasswordInput
            label={t('admin.changePassword.fields.confirmPassword.label')}
            placeholder={t('admin.changePassword.fields.confirmPassword.placeholder')}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.currentTarget.value)}
            required
            disabled={isLoading || success}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={handleClose} disabled={isLoading}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={isLoading} disabled={success}>
              {t('admin.changePassword.submit')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
