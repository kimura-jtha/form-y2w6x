import { useDisclosure } from '@mantine/hooks';
import { useEffect, useState } from 'react';

import {
  ActionIcon,
  Alert,
  Box,
  Button,
  Collapse,
  Container,
  Divider,
  Grid,
  Group,
  Loader,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconAlertCircle, IconCheck, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { getTermsOfServiceTemplate } from '@/lib/lambda/template';
import { agreeTermsOfService, getFormById } from '@/lib/lambda/form';
import type { PrizeClaimFormValues } from '@/types';

export function TermsAgreementPage() {
  const { t } = useTranslation();
  const [opened, { toggle }] = useDisclosure(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<PrizeClaimFormValues | null>(null);
  const [formId, setFormId] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [alreadyAgreed, setAlreadyAgreed] = useState(false);
  const [termsOfService, setTermsOfService] = useState<string>('');



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

  useEffect(() => {
    if (formData) {
      getTermsOfServiceTemplate().then((template) => {
        setTermsOfService(renderTemplate(template.content, extractFormVariables(formData)));
      });
    }
  }, [formData]);

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

          <Group justify="start" gap="lg" onClick={toggle} style={{ cursor: 'pointer' }}>
            <Title order={4}>{t('prizeClaim.title')}</Title>
            <ActionIcon variant="transparent">
              {opened ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
            </ActionIcon>
          </Group>

          <Collapse in={opened}>
            <Box ml="lg">
              <Text fw={600} size="lg" mb="xs">
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

              <Divider my="lg" />
              <Text fw={600} size="lg" mb="xs">
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
                  <Text size="sm">{
                    t(`prizeClaim.fields.accountType.options.${formData.accountType}`)}</Text>
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
            <Box>

            </Box>
          </Collapse>

          {alreadyAgreed ? (<Alert
            icon={<IconCheck size={16} />}
            title={t('termsAgreement.alreadyConfirmed.title')}
            color="green"
            mb="lg"
          >
            {t('termsAgreement.alreadyConfirmed.message')}
          </Alert>)
            : (<Alert
              icon={<IconAlertCircle size={16} />}
              title={t('termsAgreement.termsAlert.title')}
              color="blue"
            >
              <Text size="sm">{t('termsAgreement.termsAlert.message')}</Text>
            </Alert>)}

          <Box>
            <ScrollArea h={400} type="always" offsetScrollbars>
              <Box
                p="md"
                style={{
                  borderRadius: 'var(--mantine-radius-sm)',
                }}
                dangerouslySetInnerHTML={{ __html: termsOfService }}
              />
            </ScrollArea>
          </Box>

          <Button
            disabled={alreadyAgreed}
            onClick={handleAgree}
            loading={isSubmitting}
            size="lg"
          >
            {t('termsAgreement.agreeButton')}
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}


/**
 * Render template by replacing {{variableName}} placeholders with actual values
 * @param template - Template string with placeholders
 * @param variables - Variable values to inject
 * @returns Rendered template string
 */
const renderTemplate = (template: string, variables: Record<string, string>): string => {
  return template.replaceAll(/{{(\w+)}}/g, (match, key) => {
    const value = variables[key];
    return value !== undefined ? String(value) : match;
  });
};

/**
 * Extract common form variables from PrizeFormContent
 * @param formContent - Prize form content data
 * @returns Object with formatted form variables
 */
const extractFormVariables = (
  formContent: PrizeClaimFormValues
) => {
  const isSavings = formContent.accountType === 'savings';
  const accountTypeJa = isSavings ? '当座預金' : '普通預金';
  const accountTypeEn = isSavings ? 'Savings' : 'Checking';
  return {
    year: new Date().getFullYear().toString(),
    lastNameKanji: formContent.lastNameKanji,
    firstNameKanji: formContent.firstNameKanji,
    lastNameKana: formContent.lastNameKana,
    firstNameKana: formContent.firstNameKana,
    tournamentName: formContent.tournamentName,
    tournamentDate: formContent.tournamentDate,
    rank: formContent.rank,
    amount: formatCurrency(formContent.amount),
    playersId: formContent.playersId,
    email: formContent.email,
    phoneNumber: formContent.phoneNumber,
    postalCode: formContent.postalCode,
    address: formContent.address,
    bankName: formContent.bankName,
    bankCode: formContent.bankCode,
    branchName: formContent.branchName,
    branchCode: formContent.branchCode,
    accountTypeJa,
    accountTypeEn,
    accountNumber: formContent.accountNumber,
    accountHolderName: formContent.accountHolderName,
  };
};


const formatCurrency = (amount: number): string => {
  return `¥${amount.toLocaleString('ja-JP')}`;
};
