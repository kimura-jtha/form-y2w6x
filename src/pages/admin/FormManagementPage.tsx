import { type MouseEvent, useEffect, useMemo, useState } from 'react';

import { FormDetailModal } from '@/components/FormDetailModal';
import { POINT_PRIZE_PREFIX, PRIZE_PREFIX } from '@/config';
import { deleteForm, getForms } from '@/lib/lambda/form';
import { clearTournamentCache, fetchAllTournaments } from '@/lib/lambda/tournament';
import { useAppStore } from '@/stores';
import type { PrizeClaimFormSubmission, Tournament } from '@/types';
import { exportFormsToCSV, exportFormsToPayPayCSV, formatDate, maskEmail } from '@/utils';
import { generatePasswordV3 } from '@/utils/auth';
import {
  ActionIcon,
  Alert,
  Autocomplete,
  Badge,
  Box,
  Button,
  Center,
  Checkbox,
  Divider,
  Group,
  Loader,
  Modal,
  Pagination,
  Paper,
  Popover,
  Radio,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconArrowDown,
  IconArrowsUpDown,
  IconArrowUp,
  IconClock,
  IconCopy,
  IconDownload,
  IconFileText,
  IconInfoCircle,
  IconKey,
  IconRefresh,
  IconSearch,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

const PAGE_SIZE = 20;

async function loadFormsFromApi(options?: {
  tournamentId?: string;
  email?: string;
}): Promise<PrizeClaimFormSubmission[]> {
  const all: PrizeClaimFormSubmission[] = [];
  let cursor: string | undefined;
  let hasMoreData = true;

  while (hasMoreData) {
    const { forms: batch, pagination } = await getForms(
      cursor,
      100,
      options?.tournamentId,
      options?.email,
    );
    all.push(...batch);
    hasMoreData = pagination.hasMore;
    cursor = pagination.nextCursor || undefined;
  }

  return all;
}

export function FormManagementPage() {
  const { t } = useTranslation();
  const tournaments = useAppStore((state) => state.tournaments);
  const setTournaments = useAppStore((state) => state.setTournaments);

  // Data
  const [allForms, setAllForms] = useState<PrizeClaimFormSubmission[]>([]);
  const [displayedForms, setDisplayedForms] = useState<PrizeClaimFormSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [filterEventName, setFilterEventName] = useState('');
  const [filterTournament, setFilterTournament] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState<[Date | null, Date | null]>([
    null,
    null,
  ]);
  const [searchEmail, setSearchEmail] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Sort
  const [sortByCreatedAt, setSortByCreatedAt] = useState<'asc' | 'desc' | null>(null);

  // Detail modal
  const [selectedForm, setSelectedForm] = useState<PrizeClaimFormSubmission | null>(null);
  const [opened, { open, close }] = useDisclosure(false);

  // Delete
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] =
    useDisclosure(false);
  const [formToDelete, setFormToDelete] = useState<PrizeClaimFormSubmission | null>(null);
  const [deletingFormId, setDeletingFormId] = useState<string | null>(null);

  // Export
  const [exportModalOpened, { open: openExportModal, close: closeExportModal }] =
    useDisclosure(false);
  const [exportType, setExportType] = useState<'all' | 'japanese' | 'full'>('all');
  const [exportOnlyTermsAgreed, setExportOnlyTermsAgreed] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Password generator
  const [generatedPassword, setGeneratedPassword] = useState<string>('');
  const [passwordExpiry, setPasswordExpiry] = useState<Date | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // --- Derived data ---

  const tournamentMap = useMemo(() => {
    return tournaments.reduce(
      (acc, t) => {
        acc[t.id] = t;
        return acc;
      },
      {} as Record<string, Tournament>,
    );
  }, [tournaments]);

  const eventNameOptions = useMemo(() => {
    const [dateFrom, dateTo] = selectedDateRange;
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const from = (dateFrom ? new Date(dateFrom).getTime() : 0) - ONE_DAY;
    const to = (dateTo ? new Date(dateTo).getTime() : Infinity) + ONE_DAY;

    const uniqueEventNames = new Set<string>();
    tournaments
      .filter((t) => {
        const ts = new Date(t.date).getTime();
        return ts >= from && ts <= to;
      })
      .forEach((t) => uniqueEventNames.add(t.eventNameJa));

    return [...uniqueEventNames];
  }, [tournaments, selectedDateRange]);

  const tournamentOptions = useMemo(() => {
    const [dateFrom, dateTo] = selectedDateRange;
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const from = (dateFrom ? new Date(dateFrom).getTime() : 0) - ONE_DAY;
    const to = (dateTo ? new Date(dateTo).getTime() : Infinity) + ONE_DAY;

    return tournaments
      .filter((t) => {
        const ts = new Date(t.date).getTime();
        const dateInRange = ts >= from && ts <= to;
        const eventNameMatches =
          !filterEventName || t.eventNameJa.toLowerCase().includes(filterEventName.toLowerCase());
        return dateInRange && eventNameMatches;
      })
      .map((t) => `${t.eventNameJa} - ${t.tournamentNameJa} (${formatDate(t.date, false)})`);
  }, [tournaments, selectedDateRange, filterEventName]);

  const sortedForms = useMemo(() => {
    if (!sortByCreatedAt) return displayedForms;

    return [...displayedForms].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortByCreatedAt === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [displayedForms, sortByCreatedAt]);

  const totalPages = Math.ceil(sortedForms.length / PAGE_SIZE);

  const paginatedForms = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedForms.slice(start, start + PAGE_SIZE);
  }, [sortedForms, currentPage]);

  const hasActiveFilters =
    !!filterEventName ||
    !!filterTournament ||
    !!selectedDateRange[0] ||
    !!selectedDateRange[1] ||
    !!searchEmail;

  // --- Effects ---

  // Reset page when sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sortByCreatedAt]);

  // Load all data on mount
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const [tournamentsData, formsData] = await Promise.all([
          tournaments.length === 0 ? fetchAllTournaments() : Promise.resolve(tournaments),
          loadFormsFromApi(),
        ]);
        if (tournaments.length === 0) {
          setTournaments(tournamentsData);
        }
        setAllForms(formsData);
        setDisplayedForms(formsData);
      } catch (error) {
        console.error('Failed to load data:', error);
        notifications.show({
          title: t('common.error'),
          message: t('admin.forms.loadAll.errorMessage'),
          color: 'red',
        });
      } finally {
        setIsLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Password generator on mount
  useEffect(() => {
    const { password, limit } = generatePasswordV3();
    setGeneratedPassword(password);
    setPasswordExpiry(new Date(limit));
    const wait = limit - Date.now();
    const timer = setTimeout(
      () => {
        const { password, limit } = generatePasswordV3(true);
        setGeneratedPassword(password);
        setPasswordExpiry(new Date(limit));
      },
      Math.max(100, wait),
    );
    return () => clearTimeout(timer);
  }, []);

  // --- Handlers ---

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      clearTournamentCache();
      const [tournamentsData, formsData] = await Promise.all([
        fetchAllTournaments(),
        loadFormsFromApi(),
      ]);
      setTournaments(tournamentsData);
      setAllForms(formsData);
      setDisplayedForms(formsData);
      setFilterEventName('');
      setFilterTournament('');
      setSelectedDateRange([null, null]);
      setSearchEmail('');
      setCurrentPage(1);
      notifications.show({
        title: t('admin.forms.loadAll.success'),
        message: t('admin.forms.loadAll.successMessage', { count: formsData.length }),
        color: 'green',
      });
    } catch (error) {
      console.error('Failed to refresh data:', error);
      notifications.show({
        title: t('admin.forms.loadAll.error'),
        message: t('admin.forms.loadAll.errorMessage'),
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);

    let result = allForms;

    // Tournament-related filtering
    if (filterTournament) {
      const search = filterTournament.toLowerCase();
      const matchingTournamentIds = new Set(
        tournaments
          .filter((t) => {
            const label = `${t.eventNameJa} - ${t.tournamentNameJa} (${formatDate(t.date, false)})`;
            return label.toLowerCase().includes(search);
          })
          .map((t) => t.id),
      );
      result = result.filter((f) => matchingTournamentIds.has(f.formContent.tournamentId));
    } else {
      const hasEventFilter = !!filterEventName;
      const [dateFrom, dateTo] = selectedDateRange;
      const hasDateFilter = !!dateFrom || !!dateTo;

      if (hasEventFilter || hasDateFilter) {
        const ONE_DAY = 24 * 60 * 60 * 1000;
        const from = (dateFrom ? new Date(dateFrom).getTime() : 0) - ONE_DAY;
        const to = (dateTo ? new Date(dateTo).getTime() : Infinity) + ONE_DAY;

        const matchingTournamentIds = new Set(
          tournaments
            .filter((t) => {
              const ts = new Date(t.date).getTime();
              const dateInRange = ts >= from && ts <= to;
              const eventNameMatches =
                !filterEventName ||
                t.eventNameJa.toLowerCase().includes(filterEventName.toLowerCase());
              return dateInRange && eventNameMatches;
            })
            .map((t) => t.id),
        );

        result = result.filter((f) => matchingTournamentIds.has(f.formContent.tournamentId));
      }
    }

    // Email filtering
    if (searchEmail.trim()) {
      const email = searchEmail.trim().toLowerCase();
      result = result.filter((f) => f.formContent.email.toLowerCase().includes(email));
    }

    setDisplayedForms(result);
  };

  const handleClearFilter = () => {
    setFilterEventName('');
    setFilterTournament('');
    setSelectedDateRange([null, null]);
    setSearchEmail('');
    setCurrentPage(1);
    setDisplayedForms(allForms);
  };

  const handleRowClick = (form: PrizeClaimFormSubmission) => {
    setSelectedForm(form);
    open();
  };

  const handleModalClose = () => {
    close();
    setSelectedForm(null);
  };

  const handleSortByCreatedAt = () => {
    if (sortByCreatedAt === null) {
      setSortByCreatedAt('desc');
    } else if (sortByCreatedAt === 'desc') {
      setSortByCreatedAt('asc');
    } else {
      setSortByCreatedAt(null);
    }
  };

  const handleExportCSV = () => {
    openExportModal();
  };

  const confirmExport = async () => {
    try {
      setIsExporting(true);
      closeExportModal();

      let exportForms = [...sortedForms];

      if (exportForms.length === 0) {
        notifications.show({
          title: t('admin.forms.notifications.noData.title'),
          message: t('admin.forms.notifications.noData.message'),
          color: 'orange',
        });
        return;
      }

      const filterSuffixes: string[] = [];

      // Full data export (UTF-8, all columns like the table)
      if (exportType === 'full') {
        if (exportOnlyTermsAgreed) {
          exportForms = exportForms.filter((form) => form.formContent.termsAgreed);
          filterSuffixes.push('terms_agreed');
        }

        const filterSuffix = filterSuffixes.length > 0 ? `_${filterSuffixes.join('_')}` : '';

        if (exportForms.length === 0) {
          notifications.show({
            title: t('admin.forms.notifications.noData.title'),
            message: t('admin.forms.notifications.noData.message'),
            color: 'orange',
          });
          return;
        }

        const timestamp = new Date()
          .toISOString()
          .slice(0, -8)
          .replaceAll(/[:TZ-]/g, '_');
        const filename = `forms_full_${timestamp}${filterSuffix}`;
        exportFormsToCSV(exportForms, filename);

        notifications.show({
          title: t('admin.forms.export.success'),
          message: t('admin.forms.export.successMessage', { count: exportForms.length }),
          color: 'green',
        });
        return;
      }

      // PayPay CSV exports: exclude point-based prizes
      exportForms = exportForms.filter((form) => !form.formContent.isPoint);

      if (exportType === 'japanese') {
        exportForms = exportForms.filter(
          (form) =>
            form.formContent.lastNameKana &&
            form.formContent.lastNameKana.trim() !== '' &&
            form.formContent.firstNameKana &&
            form.formContent.firstNameKana.trim() !== '',
        );
        filterSuffixes.push('japanese');
      }

      if (exportOnlyTermsAgreed) {
        exportForms = exportForms.filter((form) => form.formContent.termsAgreed);
        filterSuffixes.push('terms_agreed');
      }

      const filterSuffix = filterSuffixes.length > 0 ? `_${filterSuffixes.join('_')}` : '';

      if (exportForms.length === 0) {
        notifications.show({
          title: t('admin.forms.notifications.noData.title'),
          message: t('admin.forms.notifications.noData.message'),
          color: 'orange',
        });
        return;
      }

      const timestamp = new Date()
        .toISOString()
        .slice(0, -8)
        .replaceAll(/[:TZ-]/g, '_');
      // cspell:disable-next-line
      const filename = `paypay_${timestamp}${filterSuffix}`;
      exportFormsToPayPayCSV(exportForms, filename);

      notifications.show({
        title: t('admin.forms.export.success'),
        message: t('admin.forms.export.successMessage', { count: exportForms.length }),
        color: 'green',
      });
    } catch (error) {
      console.error('Failed to export forms:', error);
      notifications.show({
        title: t('admin.forms.export.error'),
        message: t('admin.forms.export.errorMessage'),
        color: 'red',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = (formId: string, event: MouseEvent) => {
    event.stopPropagation();
    setFormToDelete(allForms.find((form) => form.id === formId) || null);
    openDeleteModal();
  };

  const confirmDelete = async () => {
    if (!formToDelete) return;

    try {
      setDeletingFormId(formToDelete.id);
      await deleteForm(formToDelete.id);

      setAllForms((prev) => prev.filter((form) => form.id !== formToDelete.id));
      setDisplayedForms((prev) => prev.filter((form) => form.id !== formToDelete.id));

      notifications.show({
        title: t('admin.forms.delete.success'),
        message: t('admin.forms.delete.successMessage'),
        color: 'green',
      });

      closeDeleteModal();
      setFormToDelete(null);
    } catch (error) {
      console.error('Failed to delete form:', error);
      notifications.show({
        title: t('admin.forms.delete.error'),
        message: t('admin.forms.delete.errorMessage'),
        color: 'red',
      });
    } finally {
      setDeletingFormId(null);
    }
  };

  // Password generator handlers
  const handleGeneratePassword = async () => {
    setIsGenerating(true);
    try {
      const { password, limit } = generatePasswordV3(true);
      setGeneratedPassword(password);
      setPasswordExpiry(new Date(limit));

      notifications.show({
        title: t('admin.forms.passwordGenerator.generated'),
        message: t('admin.forms.passwordGenerator.generatedMessage'),
        color: 'green',
      });
    } catch (error) {
      console.error('Failed to generate password:', error);
      notifications.show({
        title: t('common.error'),
        message: t('admin.forms.passwordGenerator.generateError'),
        color: 'red',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyPassword = () => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword);
      notifications.show({
        title: t('admin.forms.passwordGenerator.copied'),
        message: t('admin.forms.passwordGenerator.copiedMessage'),
        color: 'blue',
      });
    }
  };

  return (
    <Stack gap="lg">
      {/* Header */}
      <Group justify="space-between">
        <Title order={2}>{t('admin.forms.title')}</Title>
        <Group gap="sm">
          <Button
            leftSection={<IconRefresh size={16} />}
            onClick={handleRefresh}
            loading={isLoading}
            variant="light"
          >
            {t('common.refresh')}
          </Button>
          <Group gap={4}>
            <Button
              leftSection={<IconDownload size={16} />}
              onClick={handleExportCSV}
              loading={isExporting}
              disabled={isLoading || sortedForms.length === 0}
              color="green"
              variant="filled"
            >
              {hasActiveFilters ? t('admin.forms.exportCSV') : t('admin.forms.exportAll')}
            </Button>
            <Popover width={300} position="bottom" withArrow shadow="md">
              <Popover.Target>
                <ActionIcon variant="subtle" color="red.3" size="lg">
                  <IconInfoCircle size={18} />
                </ActionIcon>
              </Popover.Target>
              <Popover.Dropdown>
                <Text size="sm">
                  {hasActiveFilters
                    ? t('admin.forms.exportHelper')
                    : t('admin.forms.exportAllHelper')}
                </Text>
              </Popover.Dropdown>
            </Popover>
          </Group>
        </Group>
      </Group>

      {/* Password Generator */}
      <Paper shadow="xs" p="md" withBorder>
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <IconKey size={20} />
              <Title order={4}>{t('admin.forms.passwordGenerator.title')}</Title>
            </Group>
            <Button
              leftSection={<IconRefresh size={16} />}
              onClick={handleGeneratePassword}
              loading={isGenerating}
              size="sm"
            >
              {t('admin.forms.passwordGenerator.generate')}
            </Button>
          </Group>

          {generatedPassword && (
            <Paper p="md" withBorder bg="gray.0">
              <Stack gap="sm">
                <Group justify="space-between" align="center">
                  <Group gap="xs">
                    <Text size="sm" fw={500}>
                      {t('admin.forms.passwordGenerator.password')}:
                    </Text>
                    <Text
                      size="lg"
                      fw={700}
                      c="blue"
                      style={{ fontFamily: 'monospace', userSelect: 'all' }}
                    >
                      {generatedPassword}
                    </Text>
                  </Group>
                  <Button
                    leftSection={<IconCopy size={16} />}
                    onClick={handleCopyPassword}
                    size="xs"
                    variant="light"
                  >
                    {t('admin.forms.passwordGenerator.copy')}
                  </Button>
                </Group>

                {passwordExpiry && (
                  <Group gap="xs">
                    <IconClock size={16} color="orange" />
                    <Text size="xs" c="dimmed">
                      {t('admin.forms.passwordGenerator.expiresAt')}:{' '}
                      {passwordExpiry.toLocaleString()}
                    </Text>
                  </Group>
                )}

                <Alert color="orange" variant="light">
                  <Text size="xs">{t('admin.forms.passwordGenerator.instruction')}</Text>
                </Alert>
              </Stack>
            </Paper>
          )}
        </Stack>
      </Paper>

      {/* Filters */}
      <Paper shadow="xs" p="md">
        <Stack gap="sm">
          <Group align="flex-end" grow>
            <Autocomplete
              label={t('admin.forms.filters.eventName')}
              placeholder={t('admin.forms.filters.eventNamePlaceholder')}
              value={filterEventName}
              onChange={setFilterEventName}
              data={eventNameOptions}
            />
            <Autocomplete
              label={t('admin.forms.filters.tournamentName')}
              placeholder={t('admin.forms.filters.tournamentNamePlaceholder')}
              value={filterTournament}
              onChange={setFilterTournament}
              data={tournamentOptions}
            />
            <DatePickerInput
              type="range"
              label={t('admin.forms.filters.dateRange')}
              placeholder={t('admin.forms.filters.dateRangePlaceholder')}
              value={selectedDateRange}
              onChange={(value) => {
                if (Array.isArray(value)) {
                  const [start, end] = value;
                  setSelectedDateRange([
                    start && typeof start === 'object' ? start : start ? new Date(start) : null,
                    end && typeof end === 'object' ? end : end ? new Date(end) : null,
                  ]);
                } else {
                  setSelectedDateRange([null, null]);
                }
              }}
              clearable
            />
            <TextInput
              label={t('admin.forms.filters.email')}
              placeholder={t('admin.forms.filters.emailPlaceholder')}
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.currentTarget.value)}
            />
          </Group>
          <Group justify="flex-end">
            <Button leftSection={<IconSearch size={16} />} onClick={handleSearch}>
              {t('common.search')}
            </Button>
            <Button
              leftSection={<IconX size={16} />}
              onClick={handleClearFilter}
              variant="light"
              color="red"
              disabled={!hasActiveFilters}
            >
              {t('admin.forms.filters.clear')}
            </Button>
          </Group>
        </Stack>
      </Paper>

      {/* Table */}
      <Paper shadow="xs" p="md">
        {isLoading ? (
          <Box style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <Loader />
          </Box>
        ) : tournaments.length === 0 ? (
          <Alert color="red.5">{t('admin.forms.filters.noTournamentsFound')}</Alert>
        ) : (
          <>
            <Group justify="space-between" mb="md">
              <Text size="sm" c="dimmed">
                {sortedForms.length} {t('admin.forms.table.formsFound')}
              </Text>
              {totalPages > 1 && (
                <Text size="sm" c="dimmed">
                  {t('common.page')} {currentPage} / {totalPages}
                </Text>
              )}
            </Group>
            <Table striped highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('admin.forms.table.eventName')}</Table.Th>
                  <Table.Th>{t('admin.forms.table.tournament')}</Table.Th>
                  <Table.Th>{t('admin.forms.table.playerName')}</Table.Th>
                  <Table.Th>{t('admin.forms.table.playersId')}</Table.Th>
                  <Table.Th w="50">{t('admin.forms.table.rank')}</Table.Th>
                  <Table.Th>{t('admin.forms.table.amount')}</Table.Th>
                  <Table.Th w="50">{t('admin.forms.table.termsAgreed')}</Table.Th>
                  <Table.Th
                    onClick={handleSortByCreatedAt}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    {t('admin.forms.table.createdAt')}{' '}
                    {sortByCreatedAt === null && <IconArrowsUpDown size={10} />}
                    {sortByCreatedAt === 'asc' && <IconArrowUp size={10} />}
                    {sortByCreatedAt === 'desc' && <IconArrowDown size={10} />}
                  </Table.Th>
                  <Table.Th w="180px">{t('admin.forms.table.actions')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {paginatedForms.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={9}>
                      <Text ta="center" c="dimmed">
                        {t('admin.forms.table.noForms')}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  paginatedForms.map((form) => {
                    const prizePrefix = form.formContent.isPoint
                      ? POINT_PRIZE_PREFIX
                      : PRIZE_PREFIX;
                    return (
                      <Table.Tr
                        key={form.id}
                        onClick={() => handleRowClick(form)}
                        style={{ cursor: 'pointer' }}
                      >
                        <Table.Td fw="bold">
                          {tournamentMap[form.formContent.tournamentId]?.eventNameJa || '-'}
                        </Table.Td>
                        <Table.Td fw="bold">{form.formContent.tournamentName}</Table.Td>
                        <Table.Td>
                          {form.formContent.lastNameKanji} {form.formContent.firstNameKanji}
                          {form.formContent.lastNameKana ? (
                            <>
                              <br />
                              {form.formContent.lastNameKana} {form.formContent.firstNameKana}
                            </>
                          ) : null}
                        </Table.Td>
                        <Table.Td>{form.formContent.playersId || '-'}</Table.Td>
                        <Table.Td>{form.formContent.rank}</Table.Td>
                        <Table.Td>
                          {prizePrefix}
                          {form.formContent.amount.toLocaleString()}
                        </Table.Td>
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
                          <Text size="xs">{formatDate(form.createdAt, true)}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <Button
                              size="xs"
                              color="blue"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                window.open(form.termsOfService?.url, '_blank');
                              }}
                              disabled={!form.termsOfService?.url}
                              title={t('admin.forms.table.downloadTerms')}
                            >
                              <IconFileText size={16} />
                            </Button>
                            <Button
                              size="xs"
                              color="green"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                window.open(form.receipt?.url, '_blank');
                              }}
                              disabled={!form.receipt?.url}
                              title={t('admin.forms.table.downloadReceipt')}
                            >
                              <IconDownload size={16} />
                            </Button>
                            <Button
                              size="xs"
                              color="red"
                              variant="light"
                              onClick={(e) => handleDelete(form.id, e)}
                              loading={deletingFormId === form.id}
                              disabled={deletingFormId !== null}
                            >
                              <IconTrash size={16} />
                            </Button>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })
                )}
              </Table.Tbody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <Center mt="md">
                <Pagination total={totalPages} value={currentPage} onChange={setCurrentPage} />
              </Center>
            )}
          </>
        )}
      </Paper>

      {/* Export Options Modal */}
      <Modal
        opened={exportModalOpened}
        onClose={closeExportModal}
        title={t('admin.forms.export.selectType')}
        centered
        size="lg"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            {t('admin.forms.export.selectTypeDescription')}
          </Text>

          <Radio.Group
            value={exportType}
            onChange={(value) => setExportType(value as 'all' | 'japanese' | 'full')}
          >
            <Stack gap="md">
              {/* Group 1: Full Data (UTF-8) */}
              <Paper p="md" withBorder>
                <Text size="sm" fw={600} mb="sm" c="dimmed">
                  {t('admin.forms.export.groups.fullData')}
                </Text>
                <Radio
                  value="full"
                  label={t('admin.forms.export.options.full')}
                  description={t('admin.forms.export.options.fullDescription')}
                />
              </Paper>

              {/* Group 2: PayPay (Shift_JIS) */}
              <Paper p="md" withBorder>
                <Text size="sm" fw={600} mb="sm" c="dimmed">
                  {t('admin.forms.export.groups.paypay')}
                </Text>
                <Stack gap="sm">
                  <Radio
                    value="all"
                    label={t('admin.forms.export.options.all')}
                    description={t('admin.forms.export.options.allDescription')}
                  />
                  <Radio
                    value="japanese"
                    label={t('admin.forms.export.options.japanese')}
                    description={t('admin.forms.export.options.japaneseDescription')}
                  />
                  <Divider />
                  <Checkbox
                    checked={exportOnlyTermsAgreed}
                    onChange={(event) => setExportOnlyTermsAgreed(event.currentTarget.checked)}
                    label={t('admin.forms.export.options.terms')}
                    description={t('admin.forms.export.options.termsDescription')}
                    disabled={exportType === 'full'}
                  />
                </Stack>
              </Paper>
            </Stack>
          </Radio.Group>

          <Group justify="flex-end" gap="sm">
            <Button variant="light" onClick={closeExportModal}>
              {t('common.cancel')}
            </Button>
            <Button color="green" onClick={confirmExport} leftSection={<IconDownload size={16} />}>
              {t('admin.forms.export.confirm')}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title={t('admin.forms.delete.confirmTitle')}
        centered
      >
        <Stack gap="md">
          <Text>{t('admin.forms.delete.confirmMessage')}</Text>
          {formToDelete && (
            <Paper p="sm" withBorder>
              <Stack gap="xs">
                <Text size="sm">
                  <strong>{t('admin.forms.table.tournament')}:</strong>{' '}
                  {formToDelete.formContent.tournamentName}
                </Text>
                <Text size="sm">
                  <strong>{t('admin.forms.table.playerName')}:</strong>{' '}
                  {formToDelete.formContent.lastNameKanji} {formToDelete.formContent.firstNameKanji}
                </Text>
                <Text size="sm">
                  <strong>{t('admin.forms.table.email')}:</strong>{' '}
                  {maskEmail(formToDelete.formContent.email)}
                </Text>
              </Stack>
            </Paper>
          )}
          <Group justify="flex-end" gap="sm">
            <Button variant="light" onClick={closeDeleteModal} disabled={deletingFormId !== null}>
              {t('common.cancel')}
            </Button>
            <Button color="red" onClick={confirmDelete} loading={deletingFormId !== null}>
              {t('admin.forms.delete.confirm')}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Form Detail Modal */}
      <FormDetailModal opened={opened} onClose={handleModalClose} form={selectedForm} />
    </Stack>
  );
}
