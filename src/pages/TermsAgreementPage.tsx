import { useEffect, useState } from 'react';

import {
  Alert,
  Box,
  Button,
  Container,
  Grid,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import { agreeTermsOfService, getFormById } from '@/lib/lambda/form';
import type { PrizeClaimFormValues } from '@/types';

export function TermsAgreementPage() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<PrizeClaimFormValues | null>(null);
  const [formId, setFormId] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [alreadyAgreed, setAlreadyAgreed] = useState(false);

  // Extract form ID from URL hash
  useEffect(() => {
    const urlHash = window.location.hash;
    {
      // Get form id from URL
      const match = urlHash.match(/id=([^&]+)/);
      if (match) {
        setFormId(match[1]);
      } else {
        setError(t('termsAgreement.error.formIdNotFound'));
        setIsLoading(false);
      }
    }
    {
      // Get hash from URL
      const match = urlHash.match(/hash=([^&]+)/);
      if (match) {
        setHash(match[1]);
      } else {
        setError(t('termsAgreement.error.hashNotFound'));
        setIsLoading(false);
      }
    }
  }, [t]);

  // Fetch form data when formId is available
  useEffect(() => {
    if (!formId || !hash) return;

    const fetchFormData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getFormById(formId, hash);
        setFormData(response.formData);

        // Check if terms are already agreed
        if (response.formData.termsAgreed === true) {
          setAlreadyAgreed(true);
        }
      } catch (error_) {
        setError(error_ instanceof Error ? error_.message : t('termsAgreement.error.loadFailed'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchFormData();
  }, [formId, hash, t]);

  const handleAgree = async () => {
    if (!formId || !hash) return;

    try {
      setIsSubmitting(true);
      setError(null);
      await agreeTermsOfService(formId, hash);
      setAlreadyAgreed(true);
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : t('termsAgreement.error.agreeFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Container size="md" py="xl">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="dimmed">{t('termsAgreement.loading')}</Text>
        </Stack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="md" py="xl">
        <Alert
          icon={<IconAlertCircle size={16} />}
          title={t('termsAgreement.error.title')}
          color="red"
        >
          {error}
        </Alert>
      </Container>
    );
  }

  if (alreadyAgreed) {
    return (
      <Container size="md" py="xl">
        <Alert
          icon={<IconCheck size={16} />}
          title={t('termsAgreement.alreadyConfirmed.title')}
          color="green"
        >
          {t('termsAgreement.alreadyConfirmed.message')}
        </Alert>
      </Container>
    );
  }

  if (!formData) {
    return (
      <Container size="md" py="xl">
        <Alert
          icon={<IconAlertCircle size={16} />}
          title={t('termsAgreement.error.title')}
          color="red"
        >
          {t('termsAgreement.error.formNotFound')}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="md" py="xl">
      <Paper shadow="sm" p="xl" radius="md">
        <Stack gap="lg">
          <Title order={2}>{t('termsAgreement.title')}</Title>

          <Box>
            <Text fw={500} size="sm" mb="xs">
              {t('termsAgreement.formInfo.title')}
            </Text>
            <Grid>
              <Grid.Col span={6}>
                <Text size="xs" c="dimmed">
                  {t('termsAgreement.formInfo.name')}
                </Text>
                <Text size="sm">
                  {formData.lastNameKanji} {formData.firstNameKanji}
                </Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="xs" c="dimmed">
                  {t('termsAgreement.formInfo.email')}
                </Text>
                <Text size="sm">{formData.email}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="xs" c="dimmed">
                  {t('termsAgreement.formInfo.tournament')}
                </Text>
                <Text size="sm">{formData.tournamentName}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="xs" c="dimmed">
                  {t('termsAgreement.formInfo.rank')}
                </Text>
                <Text size="sm">{formData.rank}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="xs" c="dimmed">
                  {t('termsAgreement.formInfo.prizeAmount')}
                </Text>
                <Text size="sm">¥{formData.amount.toLocaleString()}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="xs" c="dimmed">
                  {t('termsAgreement.formInfo.playersId')}
                </Text>
                <Text size="sm">{formData.playersId}</Text>
              </Grid.Col>
            </Grid>
          </Box>

          <Box>
            <Text fw={500} size="sm" mb="xs">
              {t('termsAgreement.bankInfo.title')}
            </Text>
            <Grid>
              <Grid.Col span={6}>
                <Text size="xs" c="dimmed">
                  {t('termsAgreement.bankInfo.bank')}
                </Text>
                <Text size="sm">
                  {formData.bankName} ({formData.bankCode})
                </Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="xs" c="dimmed">
                  {t('termsAgreement.bankInfo.branch')}
                </Text>
                <Text size="sm">
                  {formData.branchName} ({formData.branchCode})
                </Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="xs" c="dimmed">
                  {t('termsAgreement.bankInfo.accountType')}
                </Text>
                <Text size="sm">{formData.accountType}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="xs" c="dimmed">
                  {t('termsAgreement.bankInfo.accountNumber')}
                </Text>
                <Text size="sm">{formData.accountNumber}</Text>
              </Grid.Col>
              <Grid.Col span={12}>
                <Text size="xs" c="dimmed">
                  {t('termsAgreement.bankInfo.accountHolder')}
                </Text>
                <Text size="sm">{formData.accountHolderName}</Text>
              </Grid.Col>
            </Grid>
          </Box>

          <Alert
            icon={<IconAlertCircle size={16} />}
            title={t('termsAgreement.termsAlert.title')}
            color="blue"
          >
            <Text size="sm">{t('termsAgreement.termsAlert.message')}</Text>
          </Alert>

          <Button onClick={handleAgree} loading={isSubmitting} fullWidth size="lg">
            {t('termsAgreement.agreeButton')}
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
