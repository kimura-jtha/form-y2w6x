import { type MouseEvent, useEffect, useMemo, useState } from 'react';

import { FormDetailModal } from '@/components/FormDetailModal';
import { env } from '@/config/env';
import { deleteForm, getForms } from '@/lib/lambda/form';
import { fetchAllTournaments } from '@/lib/lambda/tournament';
import { useAppStore } from '@/stores';
import type { PrizeClaimFormSubmission, Tournament } from '@/types';
import { exportFormsToPayPayCSV, formatDate, maskEmail } from '@/utils';
import { generatePasswordV3 } from '@/utils/auth';
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Center,
  Checkbox,
  Group,
  Loader,
  Modal,
  Paper,
  Popover,
  Radio,
  Select,
  Stack,
  Table,
  Text,
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
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

export function FormManagementPage() {
  const { t } = useTranslation();
  const tournaments = useAppStore((state) => state.tournaments);
  const setTournaments = useAppStore((state) => state.setTournaments);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] =
    useDisclosure(false);
  const [formToDelete, setFormToDelete] = useState<PrizeClaimFormSubmission | null>(null);
  const [exportModalOpened, { open: openExportModal, close: closeExportModal }] =
    useDisclosure(false);
  const [exportType, setExportType] = useState<'all' | 'japanese'>('all');
  const [exportOnlyTermsAgreed, setExportOnlyTermsAgreed] = useState(false);

  const [allForms, setAllForms] = useState<PrizeClaimFormSubmission[]>([]);
  const [forms, setForms] = useState<PrizeClaimFormSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [deletingFormId, setDeletingFormId] = useState<string | null>(null);
  const [selectedEventName, setSelectedEventName] = useState<string | null>(null);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [appliedTournamentId, setAppliedTournamentId] = useState<string | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<[Date | null, Date | null]>([
    null,
    null,
  ]);
  const [appliedDateRange, setAppliedDateRange] = useState<[Date | null, Date | null]>([
    null,
    null,
  ]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [allDataLoaded, setAllDataLoaded] = useState(false);
  const [selectedForm, setSelectedForm] = useState<PrizeClaimFormSubmission | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [sortByCreatedAt, setSortByCreatedAt] = useState<'asc' | 'desc' | null>(null);

  // Password generator states
  const [generatedPassword, setGeneratedPassword] = useState<string>('');
  const [passwordExpiry, setPasswordExpiry] = useState<Date | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

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

    // Get unique event names from tournaments filtered by date range
    const uniqueEventNames = new Map<string, string>();
    tournaments
      .filter((t) => {
        const ts = new Date(t.date).getTime();
        return ts >= from && ts <= to;
      })
      .forEach((t) => {
        if (!uniqueEventNames.has(t.eventNameJa)) {
          uniqueEventNames.set(t.eventNameJa, t.eventNameJa);
        }
      });

    return [...uniqueEventNames.entries()].map(([value, label]) => ({
      value,
      label,
    }));
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
        const eventNameMatches = !selectedEventName || t.eventNameJa === selectedEventName;
        return dateInRange && eventNameMatches;
      })
      .map((t) => ({
        value: t.id,
        label: `${t.eventNameJa} - ${t.tournamentNameJa} (${formatDate(t.date, false)})`,
      }));
  }, [tournaments, selectedDateRange, selectedEventName]);

  const filterFormsClientSide = (
    formsToFilter: PrizeClaimFormSubmission[],
    tournamentId: string | null,
    dateRange: [Date | null, Date | null],
  ) => {
    let filtered = formsToFilter;

    // Filter by tournament
    if (tournamentId) {
      filtered = filtered.filter((form) => form.formContent.tournamentId === tournamentId);
    }

    // Filter by date range
    const [dateFrom, dateTo] = dateRange;
    if (dateFrom || dateTo) {
      filtered = filtered.filter((form) => {
        const formDate = new Date(form.createdAt);
        const from = dateFrom ? new Date(dateFrom).setHours(0, 0, 0, 0) : 0;
        const to = dateTo ? new Date(dateTo).setHours(23, 59, 59, 999) : Infinity;
        const formTime = formDate.getTime();
        return formTime >= from && formTime <= to;
      });
    }

    return filtered;
  };

  const sortedForms = useMemo(() => {
    if (!sortByCreatedAt) return forms;

    return [...forms].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();

      if (sortByCreatedAt === 'asc') {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    });
  }, [forms, sortByCreatedAt]);

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

  const fetchForms = async (
    tournamentId?: string | null,
    dateRange?: [Date | null, Date | null],
  ) => {
    try {
      setIsLoading(true);
      const [dateFrom, dateTo] = dateRange || [null, null];
      const { forms: fetchedForms, pagination } = await getForms(
        undefined,
        50,
        tournamentId || undefined,
        dateFrom ? dateFrom.toISOString().split('T')[0] : undefined,
        dateTo ? dateTo.toISOString().split('T')[0] : undefined,
      );
      setAllForms(fetchedForms);
      setForms(fetchedForms);
      setNextCursor(pagination.nextCursor || null);
      setHasMore(pagination.hasMore);
      setAllDataLoaded(!pagination.hasMore);
      setAppliedTournamentId(tournamentId || null);
      setAppliedDateRange(dateRange || [null, null]);
    } catch (error_) {
      console.error('Failed to fetch forms:', error_);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    }
  };

  const loadMoreForms = async () => {
    if (!nextCursor || isLoadingMore) return;

    try {
      setIsLoadingMore(true);
      const [dateFrom, dateTo] = appliedDateRange;
      const { forms: moreForms, pagination } = await getForms(
        nextCursor,
        20,
        appliedTournamentId || undefined,
        dateFrom ? dateFrom.toISOString().split('T')[0] : undefined,
        dateTo ? dateTo.toISOString().split('T')[0] : undefined,
      );
      const updatedAllForms = [...allForms, ...moreForms];
      setAllForms(updatedAllForms);
      setForms([...forms, ...moreForms]);
      setNextCursor(pagination.nextCursor || null);
      setHasMore(pagination.hasMore);
      setAllDataLoaded(!pagination.hasMore);
    } catch (error_) {
      console.error('Failed to load more forms:', error_);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const loadAllForms = async () => {
    if (!nextCursor || isLoadingAll || isLoadingMore) return;

    try {
      setIsLoadingAll(true);
      let cursor = nextCursor;
      let hasMoreData = hasMore;
      let loadedForms = [...allForms];

      const [dateFrom, dateTo] = appliedDateRange;

      // Keep loading until there's no more data
      while (cursor && hasMoreData) {
        const { forms: moreForms, pagination } = await getForms(
          cursor,
          100,
          appliedTournamentId || undefined,
          dateFrom ? dateFrom.toISOString().split('T')[0] : undefined,
          dateTo ? dateTo.toISOString().split('T')[0] : undefined,
        );

        loadedForms = [...loadedForms, ...moreForms];
        cursor = pagination.nextCursor || '';
        hasMoreData = pagination.hasMore;
      }

      setAllForms(loadedForms);
      setForms(loadedForms);
      setNextCursor(null);
      setHasMore(false);
      setAllDataLoaded(true);

      notifications.show({
        title: t('admin.forms.loadAll.success'),
        message: t('admin.forms.loadAll.successMessage', { count: loadedForms.length }),
        color: 'green',
      });
    } catch (error_) {
      console.error('Failed to load all forms:', error_);
      notifications.show({
        title: t('admin.forms.loadAll.error'),
        message: t('admin.forms.loadAll.errorMessage'),
        color: 'red',
      });
    } finally {
      setIsLoadingAll(false);
    }
  };

  const fetchAllFormsWithFilter = async (
    tournamentId?: string | null,
    dateRange?: [Date | null, Date | null],
  ) => {
    try {
      setIsLoading(true);
      const [dateFrom, dateTo] = dateRange || [null, null];

      let cursor: string | undefined;
      let hasMoreData = true;
      let loadedForms: PrizeClaimFormSubmission[] = [];

      // Keep loading until there's no more data
      while (hasMoreData) {
        const { forms: moreForms, pagination } = await getForms(
          cursor,
          100,
          tournamentId || undefined,
          dateFrom ? dateFrom.toISOString().split('T')[0] : undefined,
          dateTo ? dateTo.toISOString().split('T')[0] : undefined,
        );

        loadedForms = [...loadedForms, ...moreForms];
        cursor = pagination.nextCursor || undefined;
        hasMoreData = pagination.hasMore;
      }

      setAllForms(loadedForms);
      setForms(loadedForms);
      setNextCursor(null);
      setHasMore(false);
      setAllDataLoaded(true);
      setAppliedTournamentId(tournamentId || null);
      setAppliedDateRange(dateRange || [null, null]);

      if (loadedForms.length > 0) {
        notifications.show({
          title: t('admin.forms.loadAll.success'),
          message: t('admin.forms.loadAll.successMessage', { count: loadedForms.length }),
          color: 'green',
        });
      }
    } catch (error_) {
      console.error('Failed to fetch all forms:', error_);
      notifications.show({
        title: t('admin.forms.loadAll.error'),
        message: t('admin.forms.loadAll.errorMessage'),
        color: 'red',
      });
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    }
  };

  useEffect(() => {
    fetchTournaments();
    fetchForms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilter = () => {
    // If all data is already loaded, filter on client side
    if (allDataLoaded) {
      const filtered = filterFormsClientSide(allForms, selectedTournamentId, selectedDateRange);
      setForms(filtered);
      setAppliedTournamentId(selectedTournamentId);
      setAppliedDateRange(selectedDateRange);

      notifications.show({
        title: t('admin.forms.filters.apply'),
        message: `${filtered.length} ${t('admin.forms.table.formsFound')}`,
        color: 'blue',
      });
    } else {
      // When tournament is selected, load all data automatically
      if (selectedTournamentId) {
        fetchAllFormsWithFilter(selectedTournamentId, selectedDateRange);
      } else {
        fetchForms(selectedTournamentId, selectedDateRange);
      }
    }
  };

  const handleClearFilter = () => {
    setSelectedEventName(null);
    setSelectedTournamentId(null);
    setSelectedDateRange([null, null]);

    // If all data is loaded, just show all forms
    if (allDataLoaded) {
      setForms(allForms);
      setAppliedTournamentId(null);
      setAppliedDateRange([null, null]);
    } else {
      fetchForms(null, [null, null]);
    }
  };

  const handleExportCSV = () => {
    // Allow export if all data is loaded OR tournament is selected
    if (!allDataLoaded && !appliedTournamentId) {
      notifications.show({
        title: t('admin.forms.notifications.noTournamentSelected.title'),
        message: t('admin.forms.notifications.noTournamentSelected.message'),
        color: 'orange',
      });
      return;
    }

    // Open export options modal
    openExportModal();
  };

  const confirmExport = async () => {
    try {
      setIsExporting(true);
      closeExportModal();

      let exportForms: PrizeClaimFormSubmission[] = [];

      // If all data is already loaded, use filtered forms from client side
      if (allDataLoaded) {
        exportForms = filterFormsClientSide(allForms, appliedTournamentId, appliedDateRange);
      } else {
        // Fetch all forms for the selected tournament with pagination
        let cursor: string | undefined;
        let hasMoreData = true;

        const [dateFrom, dateTo] = appliedDateRange;

        while (hasMoreData) {
          const { forms: fetchedForms, pagination } = await getForms(
            cursor,
            100, // Use larger page size for export
            appliedTournamentId || undefined,
            dateFrom ? dateFrom.toISOString().split('T')[0] : undefined,
            dateTo ? dateTo.toISOString().split('T')[0] : undefined,
          );

          exportForms.push(...fetchedForms);

          hasMoreData = pagination.hasMore;
          cursor = pagination.nextCursor;
        }
      }

      if (exportForms.length === 0) {
        notifications.show({
          title: t('admin.forms.notifications.noData.title'),
          message: t('admin.forms.notifications.noData.message'),
          color: 'orange',
        });
        return;
      }

      // Filter forms based on export type
      let filteredForms = exportForms;
      const filterSuffixes: string[] = [];

      // First, filter by user type (all or japanese)
      if (exportType === 'japanese') {
        // Filter for Japanese users (has Katakana name)
        filteredForms = filteredForms.filter(
          (form) =>
            form.formContent.lastNameKana &&
            form.formContent.lastNameKana.trim() !== '' &&
            form.formContent.firstNameKana &&
            form.formContent.firstNameKana.trim() !== '',
        );
        filterSuffixes.push('japanese');
      }

      // Then, optionally filter by terms agreed
      if (exportOnlyTermsAgreed) {
        filteredForms = filteredForms.filter((form) => form.formContent.termsAgreed);
        filterSuffixes.push('terms_agreed');
      }

      const filterSuffix = filterSuffixes.length > 0 ? `_${filterSuffixes.join('_')}` : '';

      if (filteredForms.length === 0) {
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
      const filename = `paypay_${timestamp}${filterSuffix}`;
      // Export to CSV
      exportFormsToPayPayCSV(filteredForms, filename);

      notifications.show({
        title: t('admin.forms.export.success'),
        message: t('admin.forms.export.successMessage', { count: filteredForms.length }),
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
    // Prevent row click event from firing
    event.stopPropagation();

    setFormToDelete(forms.find((form) => form.id === formId) || null);
    openDeleteModal();
  };

  const confirmDelete = async () => {
    if (!formToDelete) return;

    try {
      setDeletingFormId(formToDelete.id);
      await deleteForm(formToDelete.id);

      // Remove the deleted form from both lists
      setAllForms(allForms.filter((form) => form.id !== formToDelete.id));
      setForms(forms.filter((form) => form.id !== formToDelete.id));

      // Show success notification
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

  useEffect(() => {
    if (tournamentOptions.length === 1) {
      setSelectedTournamentId(tournamentOptions[0].value);
    } else {
      setSelectedTournamentId(null);
    }
  }, [tournamentOptions]);

  useEffect(() => {
    // Generate password on mount
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
      <Group justify="space-between">
        <Title order={2}>{t('admin.forms.title')}</Title>
        <Group gap="sm">
          <Group gap={4}>
            {!appliedTournamentId && allDataLoaded ? (
              <>
                <Button
                  leftSection={<IconDownload size={16} />}
                  onClick={handleExportCSV}
                  loading={isExporting}
                  disabled={isLoading}
                  color="green"
                  variant="filled"
                >
                  {t('admin.forms.exportAll')}
                </Button>
                <Popover width={300} position="bottom" withArrow shadow="md">
                  <Popover.Target>
                    <ActionIcon variant="subtle" color="red.3" size="lg">
                      <IconInfoCircle size={18} />
                    </ActionIcon>
                  </Popover.Target>
                  <Popover.Dropdown>
                    <Text size="sm">{t('admin.forms.exportAllHelper')}</Text>
                  </Popover.Dropdown>
                </Popover>
              </>
            ) : (
              <>
                <Button
                  leftSection={<IconDownload size={16} />}
                  onClick={handleExportCSV}
                  loading={isExporting}
                  disabled={!appliedTournamentId || isLoading}
                  color="green"
                >
                  {t('admin.forms.exportCSV')}
                </Button>
                <Popover width={300} position="bottom" withArrow shadow="md">
                  <Popover.Target>
                    <ActionIcon variant="subtle" color="red.3" size="lg">
                      <IconInfoCircle size={18} />
                    </ActionIcon>
                  </Popover.Target>
                  <Popover.Dropdown>
                    <Text size="sm">{t('admin.forms.exportHelper')}</Text>
                  </Popover.Dropdown>
                </Popover>
              </>
            )}
          </Group>
        </Group>
      </Group>

      {/* Password Generator */}
      {!env.IS_PROD && (
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
      )}

      {/* Filters */}
      <Paper shadow="xs" p="md">
        <Group align="flex-end">
          <Select
            label={t('admin.forms.filters.eventName')}
            placeholder={t('admin.forms.filters.eventNamePlaceholder')}
            value={selectedEventName}
            onChange={setSelectedEventName}
            disabled={eventNameOptions.length === 0}
            data={eventNameOptions}
            searchable
            clearable
            style={{ flex: 1 }}
          />
          <Select
            label={t('admin.forms.filters.tournamentName')}
            placeholder={t('admin.forms.filters.tournamentNamePlaceholder')}
            value={selectedTournamentId}
            onChange={setSelectedTournamentId}
            disabled={tournamentOptions.length === 0}
            data={tournamentOptions}
            searchable
            clearable
            style={{ flex: 1 }}
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
            style={{ minWidth: 280 }}
          />
          <Button onClick={applyFilter} disabled={!selectedTournamentId}>
            {t('admin.forms.filters.apply')}
          </Button>
          <Button
            leftSection={<IconX size={16} />}
            onClick={handleClearFilter}
            variant="light"
            color="red"
            disabled={
              !selectedEventName &&
              !selectedTournamentId &&
              selectedDateRange[0] === null &&
              selectedDateRange[1] === null
            }
          >
            {t('admin.forms.filters.clear')}
          </Button>
          <Button
            onClick={loadAllForms}
            loading={isLoadingAll}
            variant="filled"
            disabled={isLoadingMore || allDataLoaded}
          >
            {t('admin.forms.loadAll')}
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
            {/* Alert if no tournaments found */}
            {tournamentOptions.length === 0 ? (
              <>
                <Alert color="red.5">{t('admin.forms.filters.noTournamentsFound')}</Alert>
              </>
            ) : (
              <>
                <Text size="sm" c="dimmed" mb="md">
                  {forms.length}{' '}
                  {t(
                    appliedTournamentId
                      ? 'admin.forms.table.formsFound'
                      : 'admin.forms.table.latestFormsFound',
                  )}
                </Text>
                <Table striped highlightOnHover withTableBorder>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>{t('admin.forms.table.eventName')}</Table.Th>
                      <Table.Th>{t('admin.forms.table.tournament')}</Table.Th>
                      <Table.Th>{t('admin.forms.table.playerName')}</Table.Th>
                      <Table.Th>{t('admin.forms.table.email')}</Table.Th>
                      <Table.Th>{t('admin.forms.table.rank')}</Table.Th>
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
                    {sortedForms.length === 0 ? (
                      <Table.Tr>
                        <Table.Td colSpan={8}>
                          <Text ta="center" c="dimmed">
                            {t('admin.forms.table.noForms')}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ) : (
                      sortedForms.map((form) => (
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
                                title={t('admin.forms.table.downloadTerms', 'Download Terms')}
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
                                title={t('admin.forms.table.downloadReceipt', 'Download Receipt')}
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
                      ))
                    )}
                  </Table.Tbody>
                </Table>
                {hasMore && !isLoading && (
                  <Center mt="md">
                    <Group gap="sm">
                      <Button
                        onClick={loadMoreForms}
                        loading={isLoadingMore}
                        variant="light"
                        disabled={isLoadingAll}
                      >
                        {t('common.loadMore')}
                      </Button>
                      <Button
                        onClick={loadAllForms}
                        loading={isLoadingAll}
                        variant="filled"
                        disabled={isLoadingMore}
                      >
                        {t('admin.forms.loadAll')}
                      </Button>
                    </Group>
                  </Center>
                )}
              </>
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
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            {t('admin.forms.export.selectTypeDescription')}
          </Text>

          <Radio.Group
            value={exportType}
            onChange={(value) => setExportType(value as 'all' | 'japanese')}
          >
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
            </Stack>
          </Radio.Group>

          <Checkbox
            checked={exportOnlyTermsAgreed}
            onChange={(event) => setExportOnlyTermsAgreed(event.currentTarget.checked)}
            label={t('admin.forms.export.options.terms')}
            description={t('admin.forms.export.options.termsDescription')}
            mt="md"
          />

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
