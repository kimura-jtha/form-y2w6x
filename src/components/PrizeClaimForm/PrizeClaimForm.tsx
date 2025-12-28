import { useEffect, useMemo, useRef, useState } from 'react';

import {
  Alert,
  Box,
  Button,
  Center,
  Checkbox,
  Divider,
  Grid,
  Group,
  Loader,
  Modal,
  Paper,
  ScrollArea,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconAlertCircle } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { alive } from '@/lib/lambda/health';
import { getPrivacyPolicyTemplate } from '@/lib/lambda/template';
import { usePrizeClaimForm } from './usePrizeClaimForm';
import type { AccountType } from '@/types';

export function PrizeClaimForm() {
  const { t, i18n } = useTranslation();
  const [confirmOpened, { open: openConfirm, close: closeConfirm }] = useDisclosure(false);
  const [isCheckingHealth, setIsCheckingHealth] = useState(true);
  const [isBackendAlive, setIsBackendAlive] = useState(false);
  const [isDevMode, setIsDevMode] = useState(false);
  const hasPopulatedDevData = useRef(false);
  const [privacyPolicy, setPrivacyPolicy] = useState<string>('');
  const isJapanese = useMemo(() => i18n.language === 'ja', [i18n]);

  const {
    form,
    isSearchingAddress,
    isSubmitting,
    banks,
    branches,
    availableDates,
    searchAddress,
    getFilteredTournaments,
    getAvailableRanks,
    handleBankSelect,
    handleBranchSelect,
    handleTournamentDateChange,
    handleTournamentSelect,
    handleRankSelect,
    padAccountNumber,
    handleSubmit,
    handleClear,
  } = usePrizeClaimForm();

  // Check backend health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const isAlive = await alive();
        setIsBackendAlive(isAlive);
      } catch {
        setIsBackendAlive(false);
      } finally {
        setIsCheckingHealth(false);
      }
    };

    getPrivacyPolicyTemplate().then((template) => {
      setPrivacyPolicy(
        renderTemplate(template.content, {
          year: new Date().getFullYear().toString(),
        }),
      );
    });

    checkHealth();
  }, []);

  // Check for dev mode on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const devModeEnabled = params.get('devMode') === 'true';
    setIsDevMode(devModeEnabled);
  }, []);

  // Populate dummy data when dev mode is enabled and data is ready
  useEffect(() => {
    if (!isDevMode || hasPopulatedDevData.current) {
      return;
    }

    if (banks.length > 0 && availableDates.length > 0) {
      hasPopulatedDevData.current = true;

      // Populate form with dummy data
      form.setValues({
        lastNameKanji: '山田',
        firstNameKanji: '太郎',
        lastNameKana: 'ヤマダ',
        firstNameKana: 'タロウ',
        playersId: 'P123456789',
        postalCode: '1000001',
        address: '東京都千代田区千代田1-1',
        phoneNumber: '090-1234-5678',
        // cspell:disable-next-line
        email: `check-${Math.random().toString(36).slice(2, 8)}@jtha.info`,
        tournamentDate: availableDates[0] || '',
        accountType: 'savings',
        accountNumber: '1234567',
        accountHolderName: 'ヤマダタロウ',
        privacyAgreed: true,
      });

      // Set bank and branch
      if (banks.length > 0) {
        const firstBank = banks[0];
        handleBankSelect(firstBank.code);

        // Wait a bit for branches to load, then select first branch
        setTimeout(() => {
          if (branches.length > 0) {
            handleBranchSelect(branches[0].code);
          }
        }, 100);
      }

      // Set tournament and rank
      if (availableDates.length > 0) {
        const firstDate = availableDates[0];
        handleTournamentDateChange(firstDate);

        setTimeout(() => {
          const tournaments = getFilteredTournaments(firstDate);
          if (tournaments.length > 0) {
            handleTournamentSelect(tournaments[0].id);

            setTimeout(() => {
              const ranks = getAvailableRanks(tournaments[0].id);
              if (ranks.length > 0) {
                handleRankSelect(String(ranks[0].rank));
              }
            }, 100);
          }
        }, 100);
      }
    }
  }, [
    isDevMode,
    banks.length,
    availableDates.length,
    branches.length,
    form,
    handleBankSelect,
    handleBranchSelect,
    handleTournamentDateChange,
    handleTournamentSelect,
    handleRankSelect,
    getFilteredTournaments,
    getAvailableRanks,
    banks,
    branches,
    availableDates,
  ]);

  // Get current form values (controlled mode)
  const formValues = form.getValues();

  // Check if all required fields are filled
  const isFormComplete = useMemo(() => {
    if (isJapanese) {
      return Boolean(
        formValues.lastNameKanji &&
        formValues.firstNameKanji &&
        formValues.lastNameKana &&
        formValues.firstNameKana &&
        formValues.playersId &&
        formValues.postalCode &&
        formValues.address &&
        formValues.phoneNumber &&
        formValues.email &&
        formValues.tournamentDate &&
        formValues.tournamentId &&
        formValues.rank &&
        formValues.bankCode &&
        formValues.branchCode &&
        formValues.accountType &&
        formValues.accountNumber &&
        formValues.accountHolderName &&
        formValues.privacyAgreed,
      );
    }
    return Boolean(
      formValues.lastNameKanji &&
      formValues.firstNameKanji &&
      formValues.playersId &&
      formValues.address &&
      formValues.phoneNumber &&
      formValues.email &&
      formValues.tournamentDate &&
      formValues.tournamentId &&
      formValues.rank &&
      formValues.privacyAgreed,
    );
  }, [formValues, isJapanese]);

  // Bank options for select
  const bankOptions = useMemo(
    () =>
      banks.map((bank) => ({
        value: bank.code,
        label: bank.name,
      })),
    [banks],
  );

  // Branch options for select
  const branchOptions = useMemo(
    () =>
      branches.map((branch) => ({
        value: branch.code,
        label: branch.name,
      })),
    [branches],
  );

  // Date options for select
  const dateOptions = useMemo(
    () =>
      availableDates.map((date) => ({
        value: date,
        label: date,
      })),
    [availableDates],
  );

  // Tournament options for select - derived from formValues.tournamentDate
  const tournamentOptions = useMemo(() => {
    const filteredTournaments = getFilteredTournaments(formValues.tournamentDate);
    return filteredTournaments.map((tournament) => ({
      value: tournament.id,
      label: `${tournament.eventNameJa} - ${tournament.tournamentNameJa}`,
    }));
  }, [formValues.tournamentDate, getFilteredTournaments]);

  // Rank options for select
  const rankOptions = useMemo(() => {
    if (!formValues.tournamentId) return [];
    const availableRanks = getAvailableRanks(formValues.tournamentId);

    // Get the selected tournament to check claimed ranks
    const filteredTournaments = getFilteredTournaments(formValues.tournamentDate);
    const selectedTournament = filteredTournaments.find((t) => t.id === formValues.tournamentId);
    const claimedRanks = selectedTournament?.claimedRanks || [];

    return availableRanks.map((prize) => ({
      value: String(prize.rank),
      label: prize.rank,
      disabled: claimedRanks.includes(String(prize.rank)),
    }));
  }, [
    formValues.tournamentId,
    formValues.tournamentDate,
    getAvailableRanks,
    getFilteredTournaments,
  ]);

  // Account type options
  const accountTypeOptions = useMemo(
    () => [
      { value: 'savings', label: t('prizeClaim.fields.accountType.options.savings') },
      { value: 'checking', label: t('prizeClaim.fields.accountType.options.checking') },
    ],
    [t],
  );

  // Handle form submission with confirmation
  const onSubmit = form.onSubmit(() => {
    if (!isJapanese) {
      form.setValues({
        lastNameKana: '',
        firstNameKana: '',
        postalCode: '',
        bankName: '',
        bankCode: '',
        branchName: '',
        branchCode: '',
        accountType: '' as AccountType,
        accountNumber: '',
        accountHolderName: '',
      });
    }
    form.validate();
    console.log(form.errors);
    openConfirm();
  });

  const confirmSubmit = () => {
    closeConfirm();
    handleSubmit(form.getValues());
  };

  // Derived state for form disabled
  const isFormDisabled = isCheckingHealth || !isBackendAlive;

  // Show loading state while checking health
  if (isCheckingHealth) {
    return (
      <Box maw={900} mx="auto" p="md" h="100vh">
        <Title order={2} mb="lg">
          {t('prizeClaim.title')}
        </Title>
        <Center h="70vh">
          <Loader size="lg" />
        </Center>
      </Box>
    );
  }

  return (
    <Box maw={900} mx="auto" p="md">
      <Title order={2} mb="lg">
        {t('prizeClaim.title')}
      </Title>

      {isDevMode && (
        <Alert icon={<IconAlertCircle size={16} />} title="Development Mode" color="blue" mb="lg">
          Dev mode is active. Form has been pre-filled with dummy data for testing.
        </Alert>
      )}

      {!isBackendAlive && (
        <Alert icon={<IconAlertCircle size={16} />} title={t('common.error')} color="red" mb="lg">
          {t('prizeClaim.errors.backendUnavailable')}
        </Alert>
      )}

      <form onSubmit={onSubmit}>
        <Stack gap="xl">
          {/* Name (Not Japanese) Section */}
          {!isJapanese && (
            <Paper shadow="xs" p="md" withBorder>
              <Title order={4} mb="md">
                {t('prizeClaim.sections.name')}
              </Title>
              <Grid>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <TextInput
                    label={t('prizeClaim.fields.lastName.label')}
                    placeholder={t('prizeClaim.fields.lastName.placeholder')}
                    description={'\u00A0'}
                    withAsterisk
                    disabled={isFormDisabled}
                    key={form.key('lastNameKanji')}
                    {...form.getInputProps('lastNameKanji')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <TextInput
                    label={t('prizeClaim.fields.firstName.label')}
                    placeholder={t('prizeClaim.fields.firstName.placeholder')}
                    description={'\u00A0'}
                    withAsterisk
                    disabled={isFormDisabled}
                    key={form.key('firstNameKanji')}
                    {...form.getInputProps('firstNameKanji')}
                  />
                </Grid.Col>
              </Grid>
            </Paper>
          )}
          {/* Name (Kanji) Section */}
          {isJapanese && (
            <Paper shadow="xs" p="md" withBorder>
              <Title order={4} mb="md">
                {t('prizeClaim.sections.name')}
              </Title>
              <Grid>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <TextInput
                    label={t('prizeClaim.fields.lastNameKanji.label')}
                    placeholder={t('prizeClaim.fields.lastNameKanji.placeholder')}
                    description={t('prizeClaim.fields.lastNameKanji.description')}
                    withAsterisk
                    disabled={isFormDisabled}
                    key={form.key('lastNameKanji')}
                    {...form.getInputProps('lastNameKanji')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <TextInput
                    label={t('prizeClaim.fields.firstNameKanji.label')}
                    placeholder={t('prizeClaim.fields.firstNameKanji.placeholder')}
                    description={'\u00A0'}
                    withAsterisk
                    disabled={isFormDisabled}
                    key={form.key('firstNameKanji')}
                    {...form.getInputProps('firstNameKanji')}
                  />
                </Grid.Col>
              </Grid>
            </Paper>
          )}

          {/* Name (Kana) Section */}
          {isJapanese && (
            <Paper shadow="xs" p="md" withBorder>
              <Title order={4} mb="md">
                {t('prizeClaim.sections.nameKana')}
              </Title>
              <Grid>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <TextInput
                    label={t('prizeClaim.fields.lastNameKana.label')}
                    placeholder={t('prizeClaim.fields.lastNameKana.placeholder')}
                    description={t('prizeClaim.fields.lastNameKana.description')}
                    withAsterisk
                    disabled={isFormDisabled}
                    key={form.key('lastNameKana')}
                    {...form.getInputProps('lastNameKana')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <TextInput
                    label={t('prizeClaim.fields.firstNameKana.label')}
                    placeholder={t('prizeClaim.fields.firstNameKana.placeholder')}
                    description={'\u00A0'}
                    withAsterisk
                    disabled={isFormDisabled}
                    key={form.key('firstNameKana')}
                    {...form.getInputProps('firstNameKana')}
                  />
                </Grid.Col>
              </Grid>
            </Paper>
          )}

          {/* Players+ ID / Passport Number Section */}
          <Paper shadow="xs" p="md" withBorder>
            <Title order={4} mb="md">
              {t('prizeClaim.sections.playersId')}
            </Title>
            <TextInput
              label={t('prizeClaim.fields.playersId.label')}
              placeholder={t('prizeClaim.fields.playersId.placeholder')}
              description={t('prizeClaim.fields.playersId.description')}
              withAsterisk
              disabled={isFormDisabled}
              key={form.key('playersId')}
              {...form.getInputProps('playersId')}
            />
          </Paper>

          {/* Contact Information Section */}
          <Paper shadow="xs" p="md" withBorder>
            <Title order={4} mb="md">
              {t('prizeClaim.sections.contact')}
            </Title>
            <Stack gap="md">
              {isJapanese && (
                <Grid align="flex-end">
                  <Grid.Col span={{ base: 12, sm: 8 }}>
                    <TextInput
                      label={t('prizeClaim.fields.postalCode.label')}
                      placeholder={t('prizeClaim.fields.postalCode.placeholder')}
                      description={t('prizeClaim.fields.postalCode.description')}
                      withAsterisk
                      disabled={isFormDisabled}
                      maxLength={7}
                      key={form.key('postalCode')}
                      {...form.getInputProps('postalCode')}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 4 }}>
                    <Button
                      variant="outline"
                      onClick={searchAddress}
                      loading={isSearchingAddress}
                      disabled={isFormDisabled}
                      fullWidth
                    >
                      {t('prizeClaim.buttons.searchAddress')}
                    </Button>
                  </Grid.Col>
                </Grid>
              )}

              <TextInput
                label={t('prizeClaim.fields.address.label')}
                placeholder={t('prizeClaim.fields.address.placeholder')}
                withAsterisk
                disabled={isFormDisabled}
                key={form.key('address')}
                {...form.getInputProps('address')}
              />

              <Grid>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <TextInput
                    label={t('prizeClaim.fields.phoneNumber.label')}
                    placeholder={t('prizeClaim.fields.phoneNumber.placeholder')}
                    description={t('prizeClaim.fields.phoneNumber.description')}
                    withAsterisk
                    disabled={isFormDisabled}
                    key={form.key('phoneNumber')}
                    {...form.getInputProps('phoneNumber')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <TextInput
                    label={t('prizeClaim.fields.email.label')}
                    placeholder={t('prizeClaim.fields.email.placeholder')}
                    description={'\u00A0'}
                    withAsterisk
                    disabled={isFormDisabled}
                    type="email"
                    key={form.key('email')}
                    {...form.getInputProps('email')}
                  />
                </Grid.Col>
              </Grid>
            </Stack>
          </Paper>

          {/* Tournament Information Section */}
          <Paper shadow="xs" p="md" withBorder>
            <Title order={4} mb="md">
              {t('prizeClaim.sections.tournament')}
            </Title>
            <Stack gap="md">
              <Grid>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Select
                    label={t('prizeClaim.fields.tournamentDate.label')}
                    placeholder={t('prizeClaim.fields.tournamentDate.placeholder')}
                    description={'\u00A0'}
                    data={dateOptions}
                    withAsterisk
                    searchable
                    clearable
                    disabled={isFormDisabled}
                    value={formValues.tournamentDate || null}
                    onChange={handleTournamentDateChange}
                    error={form.errors.tournamentDate}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Select
                    label={t('prizeClaim.fields.tournamentName.label')}
                    placeholder={t('prizeClaim.fields.tournamentName.placeholder')}
                    description={'\u00A0'}
                    data={tournamentOptions}
                    withAsterisk
                    searchable
                    clearable
                    disabled={isFormDisabled || !formValues.tournamentDate}
                    value={formValues.tournamentId || null}
                    onChange={handleTournamentSelect}
                    error={form.errors.tournamentId}
                  />
                </Grid.Col>
              </Grid>

              <Grid>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Select
                    label={t('prizeClaim.fields.rank.label')}
                    placeholder={t('prizeClaim.fields.rank.placeholder')}
                    description={'\u00A0'}
                    data={rankOptions}
                    withAsterisk
                    clearable
                    disabled={isFormDisabled || !formValues.tournamentId}
                    value={formValues.rank || null}
                    onChange={handleRankSelect}
                    error={form.errors.rank}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <TextInput
                    label={t('prizeClaim.fields.prizeAmount.label')}
                    description={t('prizeClaim.fields.prizeAmount.description')}
                    value={formValues.amount > 0 ? `¥${formValues.amount.toLocaleString()}` : ''}
                    readOnly
                    styles={{
                      input: {
                        fontWeight: 'bold',
                        backgroundColor: 'var(--mantine-color-gray-1)',
                        cursor: 'not-allowed',
                      },
                    }}
                  />
                </Grid.Col>
              </Grid>
            </Stack>
          </Paper>

          {/* Bank Information Section */}
          {isJapanese && (
            <Paper shadow="xs" p="md" withBorder>
              <Title order={4} mb="md">
                {t('prizeClaim.sections.bank')}
              </Title>
              <Stack gap="md">
                <Grid>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Select
                      label={t('prizeClaim.fields.bankName.label')}
                      placeholder={t('prizeClaim.fields.bankName.placeholder')}
                      description={'\u00A0'}
                      data={bankOptions}
                      withAsterisk
                      searchable
                      clearable
                      disabled={isFormDisabled}
                      nothingFoundMessage={t('common.notFound')}
                      value={formValues.bankCode || null}
                      onChange={handleBankSelect}
                      error={form.errors.bankCode}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Select
                      label={t('prizeClaim.fields.branchName.label')}
                      placeholder={t('prizeClaim.fields.branchName.placeholder')}
                      description={'\u00A0'}
                      data={branchOptions}
                      withAsterisk
                      searchable
                      clearable
                      disabled={isFormDisabled || !formValues.bankCode}
                      nothingFoundMessage={t('common.notFound')}
                      value={formValues.branchCode || null}
                      onChange={handleBranchSelect}
                      error={form.errors.branchCode}
                    />
                  </Grid.Col>
                </Grid>

                <Grid>
                  <Grid.Col span={{ base: 12, sm: 4 }}>
                    <Select
                      label={t('prizeClaim.fields.accountType.label')}
                      placeholder={t('prizeClaim.fields.accountType.placeholder')}
                      description={'\u00A0'}
                      data={accountTypeOptions}
                      withAsterisk
                      disabled={isFormDisabled}
                      key={form.key('accountType')}
                      {...form.getInputProps('accountType')}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 4 }}>
                    <TextInput
                      label={t('prizeClaim.fields.accountNumber.label')}
                      placeholder={t('prizeClaim.fields.accountNumber.placeholder')}
                      description={t('prizeClaim.fields.accountNumber.description')}
                      withAsterisk
                      disabled={isFormDisabled}
                      maxLength={7}
                      key={form.key('accountNumber')}
                      {...form.getInputProps('accountNumber')}
                      onBlur={(e) => {
                        form.getInputProps('accountNumber').onBlur?.(e);
                        padAccountNumber(e.target.value);
                      }}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 4 }}>
                    <TextInput
                      label={t('prizeClaim.fields.accountHolderName.label')}
                      placeholder={t('prizeClaim.fields.accountHolderName.placeholder')}
                      description={t('prizeClaim.fields.accountHolderName.description')}
                      withAsterisk
                      disabled={isFormDisabled}
                      key={form.key('accountHolderName')}
                      {...form.getInputProps('accountHolderName')}
                    />
                  </Grid.Col>
                </Grid>
              </Stack>
            </Paper>
          )}

          {/* Privacy Policy Section */}
          <Paper shadow="xs" p="md" withBorder>
            <Title order={4} mb="md">
              {t('prizeClaim.sections.privacyPolicy')}
            </Title>
            <Stack gap="md">
              <Box>
                <ScrollArea h={400} type="always" offsetScrollbars>
                  <Box
                    p="md"
                    style={{
                      borderRadius: 'var(--mantine-radius-sm)',
                    }}
                    dangerouslySetInnerHTML={{ __html: privacyPolicy }}
                  />
                </ScrollArea>
              </Box>

              <Checkbox
                label={t('prizeClaim.fields.privacyAgreement.label')}
                description={t('prizeClaim.fields.privacyAgreement.description')}
                disabled={isFormDisabled}
                key={form.key('privacyAgreed')}
                {...form.getInputProps('privacyAgreed', { type: 'checkbox' })}
              />
            </Stack>
          </Paper>

          <Divider />

          {/* Action Buttons */}
          <Group justify="center" gap="md">
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={isFormDisabled || isSubmitting}
            >
              {t('prizeClaim.buttons.clear')}
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={isFormDisabled || !isFormComplete || isSubmitting}
            >
              {t('prizeClaim.buttons.submit')}
            </Button>
          </Group>
        </Stack>
      </form>

      {/* Confirmation Modal */}
      <Modal
        opened={confirmOpened}
        onClose={closeConfirm}
        title={t('prizeClaim.confirmDialog.title')}
        centered
      >
        <Stack>
          <Text>{t('prizeClaim.confirmDialog.message')}</Text>
          <Group justify="flex-end" gap="sm">
            <Button variant="outline" onClick={closeConfirm}>
              {t('prizeClaim.confirmDialog.cancel')}
            </Button>
            <Button onClick={confirmSubmit} loading={isSubmitting}>
              {t('prizeClaim.confirmDialog.confirm')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
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
