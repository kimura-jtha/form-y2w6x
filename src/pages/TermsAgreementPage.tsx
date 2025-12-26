import { useDisclosure } from '@mantine/hooks';
import { useEffect, useState } from 'react';

import {
  ActionIcon,
  Alert,
  Box,
  Button,
  Center,
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
import {
  IconAlertCircle,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconDownload,
} from '@tabler/icons-react';
import html2pdf from 'html2pdf.js';
import { useTranslation } from 'react-i18next';
import { getReceiptTemplate, getTermsOfServiceTemplate } from '@/lib/lambda/template';
import { agreeTermsOfService, getFormById } from '@/lib/lambda/form';
import type { PrizeClaimFormValues } from '@/types';

export function TermsAgreementPage() {
  const { t } = useTranslation();
  const [opened, { toggle }] = useDisclosure(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<PrizeClaimFormValues | null>(null);
  const [formId, setFormId] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [alreadyAgreed, setAlreadyAgreed] = useState(false);
  const [termsOfService, setTermsOfService] = useState<string>('');
  const [receipt, setReceipt] = useState<string>('');

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
        setTermsOfService(
          renderTemplate(template.content, extractFormVariables(formData, formData.createdAt)),
        );
      });
    }
  }, [formData]);

  useEffect(() => {
    if (alreadyAgreed && formData) {
      getReceiptTemplate().then((template) => {
        setReceipt(
          renderTemplate(template.content, extractFormVariables(formData, formData.createdAt)),
        );
      });
    }
  }, [formData, alreadyAgreed]);

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

  const handleDownloadReceipt = async () => {
    if (!receipt) return;

    try {
      setIsDownloading(true);
      setError(null);

      // Create a temporary container with styled receipt content
      const element = document.createElement('div');
      element.innerHTML = `
        <div style="
          font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif;
          padding: 8mm;
          line-height: 1.4;
          font-size: 10pt;
        ">
          ${receipt}
        </div>
      `;

      // Apply additional styles to ensure proper rendering
      const styles = `
        h1 { font-size: 14pt; margin: 0 0 0.5em 0; }
        h2 { font-size: 12pt; margin: 0.8em 0 0.4em 0; }
        h3, h4, h5, h6 { font-size: 11pt; margin: 0.6em 0 0.3em 0; }
        p { margin: 0.3em 0; font-size: 10pt; }
        table { border-collapse: collapse; width: 100%; margin: 0.5em 0; font-size: 9pt; }
        th, td { border: 1px solid #ddd; padding: 4px 6px; text-align: left; }
        th { background-color: #f5f5f5; font-weight: 600; }
      `;

      const styleElement = document.createElement('style');
      styleElement.textContent = styles;
      element.append(styleElement);

      // Configure html2pdf options for 18.9cm x 10.9cm page
      const options = {
        margin: [8, 8, 8, 8] as [number, number, number, number], // 8mm margin on all sides
        filename: `receipt_${formId}_${new Date().toLocaleString('ja-JP', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric',
          timeZone: 'Asia/Tokyo', // Essential for Japan Standard Time
        })}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
        },
        jsPDF: {
          unit: 'mm' as const,
          format: [189, 109] as [number, number], // 18.9cm x 10.9cm in mm
          orientation: 'landscape' as const,
        },
      };

      // Generate and download PDF
      await html2pdf().set(options).from(element).save();
    } catch (error_) {
      console.error('PDF generation error:', error_);
      setError(error_ instanceof Error ? error_.message : t('termsAgreement.error.downloadFailed'));
    } finally {
      setIsDownloading(false);
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
      {isDownloading && (
        <Center
          style={{
            position: 'fixed',
            top: 0,
            opacity: 0.9,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'white',
            zIndex: 1000,
          }}
        >
          <Loader size="lg" />
        </Center>
      )}
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
                  <Text size="sm">
                    {t(`prizeClaim.fields.accountType.options.${formData.accountType}`)}
                  </Text>
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
            <Box></Box>
          </Collapse>

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
            {alreadyAgreed ? (
              <Alert
                icon={<IconCheck size={16} />}
                title={t('termsAgreement.alreadyConfirmed.title')}
                color="green"
                mb="lg"
              >
                {t('termsAgreement.alreadyConfirmed.message')}
              </Alert>
            ) : (
              <Alert
                icon={<IconAlertCircle size={16} />}
                title={t('termsAgreement.termsAlert.title')}
                color="blue"
              >
                <Text size="sm">{t('termsAgreement.termsAlert.message')}</Text>
              </Alert>
            )}
          </Box>

          {!alreadyAgreed && (
            <Button onClick={handleAgree} loading={isSubmitting} size="lg">
              {t('termsAgreement.agreeButton')}
            </Button>
          )}

          {alreadyAgreed && (
            <>
              <Title order={2}>{t('termsAgreement.receiptTitle')}</Title>
              <Box style={{ opacity: isDownloading ? 0 : 1 }}>
                <ScrollArea h={400} type="always" offsetScrollbars>
                  <Box
                    p="md"
                    style={{
                      borderRadius: 'var(--mantine-radius-sm)',
                    }}
                    dangerouslySetInnerHTML={{ __html: receipt }}
                  />
                </ScrollArea>
              </Box>
              <Button
                onClick={handleDownloadReceipt}
                loading={isDownloading}
                size="lg"
                leftSection={<IconDownload size={18} />}
              >
                {t('termsAgreement.downloadReceiptButton')}
              </Button>
            </>
          )}
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
const extractFormVariables = (formContent: PrizeClaimFormValues, createdAt?: string) => {
  const isSavings = formContent.accountType === 'savings';
  const accountTypeJa = isSavings ? '当座預金' : '普通預金';
  const accountTypeEn = isSavings ? 'Savings' : 'Checking';
  return {
    today: createdAt
      ? new Date(createdAt).toLocaleDateString('ja-JP', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          timeZone: 'Asia/Tokyo', // Essential for JST
        })
      : '-',
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
