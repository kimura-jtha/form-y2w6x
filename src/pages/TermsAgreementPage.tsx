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

import { agreeTermsOfService, getFormById } from '@/lib/lambda/form';
import type { PrizeClaimFormValues } from '@/types';

export function TermsAgreementPage() {
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
        setError('Form ID not found in URL');
        setIsLoading(false);
      }
    }
    {
      // Get hash from URL
      const match = urlHash.match(/hash=([^&]+)/);
      if (match) {
        setHash(match[1]);
      } else {
        setError('Hash not found in URL');
        setIsLoading(false);
      }
    }
  }, []);

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
        setError(error_ instanceof Error ? error_.message : 'Failed to load form data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFormData();
  }, [formId, hash]);

  const handleAgree = async () => {
    if (!formId || !hash) return;

    try {
      setIsSubmitting(true);
      setError(null);
      await agreeTermsOfService(formId, hash);
      setAlreadyAgreed(true);
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'Failed to agree to terms');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Container size="md" py="xl">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="dimmed">Loading form data...</Text>
        </Stack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="md" py="xl">
        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
          {error}
        </Alert>
      </Container>
    );
  }

  if (alreadyAgreed) {
    return (
      <Container size="md" py="xl">
        <Alert icon={<IconCheck size={16} />} title="Already Confirmed" color="green">
          This form has already been confirmed and you have agreed to the terms of service.
        </Alert>
      </Container>
    );
  }

  if (!formData) {
    return (
      <Container size="md" py="xl">
        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
          Form data not found
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="md" py="xl">
      <Paper shadow="sm" p="xl" radius="md">
        <Stack gap="lg">
          <Title order={2}>Terms of Service Agreement</Title>

          <Box>
            <Text fw={500} size="sm" mb="xs">
              Form Information
            </Text>
            <Grid>
              <Grid.Col span={6}>
                <Text size="xs" c="dimmed">
                  Name
                </Text>
                <Text size="sm">
                  {formData.lastNameKanji} {formData.firstNameKanji}
                </Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="xs" c="dimmed">
                  Email
                </Text>
                <Text size="sm">{formData.email}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="xs" c="dimmed">
                  Tournament
                </Text>
                <Text size="sm">{formData.tournamentName}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="xs" c="dimmed">
                  Rank
                </Text>
                <Text size="sm">{formData.rank}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="xs" c="dimmed">
                  Prize Amount
                </Text>
                <Text size="sm">¥{formData.amount.toLocaleString()}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="xs" c="dimmed">
                  Players ID
                </Text>
                <Text size="sm">{formData.playersId}</Text>
              </Grid.Col>
            </Grid>
          </Box>

          <Box>
            <Text fw={500} size="sm" mb="xs">
              Bank Information
            </Text>
            <Grid>
              <Grid.Col span={6}>
                <Text size="xs" c="dimmed">
                  Bank
                </Text>
                <Text size="sm">
                  {formData.bankName} ({formData.bankCode})
                </Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="xs" c="dimmed">
                  Branch
                </Text>
                <Text size="sm">
                  {formData.branchName} ({formData.branchCode})
                </Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="xs" c="dimmed">
                  Account Type
                </Text>
                <Text size="sm">{formData.accountType}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="xs" c="dimmed">
                  Account Number
                </Text>
                <Text size="sm">{formData.accountNumber}</Text>
              </Grid.Col>
              <Grid.Col span={12}>
                <Text size="xs" c="dimmed">
                  Account Holder
                </Text>
                <Text size="sm">{formData.accountHolderName}</Text>
              </Grid.Col>
            </Grid>
          </Box>

          <Alert icon={<IconAlertCircle size={16} />} title="Terms of Service" color="blue">
            <Text size="sm">
              By clicking "I Agree" below, you confirm that all the information provided is accurate
              and you agree to our terms of service for prize disbursement.
            </Text>
          </Alert>

          <Button onClick={handleAgree} loading={isSubmitting} fullWidth size="lg">
            I Agree to Terms of Service
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
