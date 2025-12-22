import { useEffect, useState } from 'react';

import {
  Badge,
  Box,
  Button,
  Center,
  Group,
  Loader,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconDownload, IconRefresh, IconX } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import { FormDetailModal } from '@/components/FormDetailModal';
import { getForms } from '@/lib/lambda/form';
import { fetchAllTournaments } from '@/lib/lambda/tournament';
import { useAppStore } from '@/stores';
import type { PrizeClaimFormSubmission } from '@/types';
import { exportFormsToPayPayCSV, maskEmail } from '@/utils';

export function FormManagementPage() {
  const { t } = useTranslation();
  const tournaments = useAppStore((state) => state.tournaments);
  const setTournaments = useAppStore((state) => state.setTournaments);

  const [forms, setForms] = useState<PrizeClaimFormSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [appliedTournamentId, setAppliedTournamentId] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [selectedForm, setSelectedForm] = useState<PrizeClaimFormSubmission | null>(null);
  const [opened, { open, close }] = useDisclosure(false);

  const handleRowClick = (form: PrizeClaimFormSubmission) => {
    setSelectedForm(form);
    open();
  };

  const handleModalClose = () => {
    close();
    setSelectedForm(null);
  };

  const fetchTournaments = async () => {
    if (tournaments.length === 0) {
      try {
        const data = await fetchAllTournaments();
        setTournaments(data);
      } catch (error_) {
        console.error('Failed to fetch tournaments:', error_);
      }
    }
  };

  const fetchForms = async (tournamentId?: string | null) => {
    try {
      setIsLoading(true);
      const { forms: fetchedForms, pagination } = await getForms(
        undefined,
        20,
        tournamentId || undefined,
      );
      setForms(fetchedForms);
      setNextCursor(pagination.nextCursor || null);
      setHasMore(pagination.hasMore);
      setAppliedTournamentId(tournamentId || null);
    } catch (error_) {
      console.error('Failed to fetch forms:', error_);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreForms = async () => {
    if (!nextCursor || isLoadingMore) return;

    try {
      setIsLoadingMore(true);
      const { forms: moreForms, pagination } = await getForms(
        nextCursor,
        20,
        appliedTournamentId || undefined,
      );
      setForms([...forms, ...moreForms]);
      setNextCursor(pagination.nextCursor || null);
      setHasMore(pagination.hasMore);
    } catch (error_) {
      console.error('Failed to load more forms:', error_);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
    fetchForms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilter = () => {
    fetchForms(selectedTournamentId);
  };

  const handleClearFilter = () => {
    setSelectedTournamentId(null);
    fetchForms(null);
  };

  const handleExportCSV = async () => {
    if (!appliedTournamentId) {
      notifications.show({
        title: t('admin.forms.notifications.noTournamentSelected.title'),
        message: t('admin.forms.notifications.noTournamentSelected.message'),
        color: 'orange',
      });
      return;
    }

    try {
      setIsExporting(true);

      // Fetch all forms for the selected tournament with pagination
      const allForms: PrizeClaimFormSubmission[] = [];
      let cursor: string | undefined;
      let hasMoreData = true;

      while (hasMoreData) {
        const { forms: fetchedForms, pagination } = await getForms(
          cursor,
          100, // Use larger page size for export
          appliedTournamentId,
        );

        allForms.push(...fetchedForms);

        hasMoreData = pagination.hasMore;
        cursor = pagination.nextCursor;
      }

      if (allForms.length === 0) {
        notifications.show({
          title: t('admin.forms.notifications.noData.title'),
          message: t('admin.forms.notifications.noData.message'),
          color: 'orange',
        });
        return;
      }
      // Generate filename with tournament name and timestamp
      const timestamp = new Date()
        .toISOString()
        .slice(0, -8)
        .replaceAll(/[:TZ-]/g, '_');
      // cspell:disable-next-line
      const filename = `paypay_${timestamp}`;
      // Export to CSV
      exportFormsToPayPayCSV(allForms, filename);
    } catch (error) {
      console.error('Failed to export forms:', error);
      notifications.show({
        title: t('admin.forms.notifications.exportError.title'),
        message: t('admin.forms.notifications.exportError.message'),
        color: 'red',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2}>{t('admin.forms.title')}</Title>
        <Group gap="sm">
          <Button
            leftSection={<IconDownload size={16} />}
            onClick={handleExportCSV}
            loading={isExporting}
            disabled={!appliedTournamentId || isLoading}
            color="green"
          >
            {t('admin.forms.exportCSV')}
          </Button>
          <Button
            leftSection={<IconRefresh size={16} />}
            onClick={() => fetchForms(appliedTournamentId)}
            variant="light"
          >
            {t('admin.forms.refresh')}
          </Button>
        </Group>
      </Group>

      {/* Filters */}
      <Paper shadow="xs" p="md">
        <Group align="flex-end">
          <Select
            label={t('admin.forms.filters.tournamentName')}
            placeholder={t('admin.forms.filters.tournamentNamePlaceholder')}
            value={selectedTournamentId}
            onChange={setSelectedTournamentId}
            data={tournaments.map((t) => ({
              value: t.id,
              label: `${t.eventNameJa} - ${t.tournamentNameJa}`,
            }))}
            searchable
            clearable
            style={{ flex: 1 }}
          />
          <Button onClick={applyFilter} disabled={!selectedTournamentId}>
            {t('admin.forms.filters.apply')}
          </Button>
          <Button
            leftSection={<IconX size={16} />}
            onClick={handleClearFilter}
            variant="light"
            color="gray"
            disabled={!selectedTournamentId}
          >
            {t('admin.forms.filters.clear')}
          </Button>
        </Group>
      </Paper>

      {/* Table */}
      <Paper shadow="xs" p="md">
        {isLoading ? (
          <Box style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <Loader />
          </Box>
        ) : (
          <>
            <Text size="sm" c="dimmed" mb="md">
              {forms.length} {t('admin.forms.table.formsFound')}
            </Text>
            <Table striped highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('admin.forms.table.tournament')}</Table.Th>
                  <Table.Th>{t('admin.forms.table.playerName')}</Table.Th>
                  <Table.Th>{t('admin.forms.table.email')}</Table.Th>
                  <Table.Th>{t('admin.forms.table.rank')}</Table.Th>
                  <Table.Th>{t('admin.forms.table.amount')}</Table.Th>
                  <Table.Th w="120px">{t('admin.forms.table.termsAgreed')}</Table.Th>
                  <Table.Th>{t('admin.forms.table.createdAt')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {forms.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={7}>
                      <Text ta="center" c="dimmed">
                        {t('admin.forms.table.noForms')}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  forms.map((form) => (
                    <Table.Tr
                      key={form.id}
                      onClick={() => handleRowClick(form)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Table.Td fw="bold">{form.formContent.tournamentName}</Table.Td>
                      <Table.Td>
                        {form.formContent.lastNameKanji} {form.formContent.firstNameKanji}
                      </Table.Td>
                      <Table.Td>{maskEmail(form.formContent.email)}</Table.Td>
                      <Table.Td>{form.formContent.rank}</Table.Td>
                      <Table.Td>¥{form.formContent.amount.toLocaleString()}</Table.Td>
                      <Table.Td>
                        <Center w="100%">
                          <Badge
                            fz="xl"
                            variant="transparent"
                            color={form.formContent.termsAgreed ? 'green' : 'red'}
                          >
                            {form.formContent.termsAgreed ? '☑︎' : '☐'}
                          </Badge>
                        </Center>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs">
                          {new Date(form.createdAt).toLocaleDateString()} <br />
                          {new Date(form.createdAt).toLocaleTimeString()}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
            {hasMore && !isLoading && (
              <Center mt="md">
                <Button onClick={loadMoreForms} loading={isLoadingMore} variant="light">
                  {t('common.loadMore')}
                </Button>
              </Center>
            )}
          </>
        )}
      </Paper>

      {/* Form Detail Modal */}
      <FormDetailModal opened={opened} onClose={handleModalClose} form={selectedForm} />
    </Stack>
  );
}
