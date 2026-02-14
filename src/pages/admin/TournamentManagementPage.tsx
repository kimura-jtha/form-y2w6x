import { useEffect, useMemo, useState } from 'react';

import { useNavigate } from 'react-router';

import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Center,
  Group,
  Loader,
  Pagination,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import {
  IconArrowDown,
  IconArrowUp,
  IconEdit,
  IconEye,
  IconFileImport,
  IconLock,
  IconLockOpen,
  IconPlus,
  IconRefresh,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import { TournamentCSVImportModal } from '@/components/TournamentCSVImportModal';
import { TournamentFormModal } from '@/components/TournamentFormModal';
import {
  createTournament as createTournamentApi,
  deleteTournament as deleteTournamentApi,
  fetchAllTournaments,
  updateTournament as updateTournamentApi,
} from '@/lib/lambda/tournament';
import type { Tournament } from '@/types';
import { formatDate } from '@/utils/string';

type SortField = 'eventNameJa' | 'tournamentNameJa' | 'date' | 'status';
type SortDirection = 'asc' | 'desc';

export function TournamentManagementPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [importOpened, { open: openImport, close: closeImport }] = useDisclosure(false);
  const [isImporting, setIsImporting] = useState(false);
  const [togglingTournamentId, setTogglingTournamentId] = useState<string | null>(null);
  const [deletingTournamentId, setDeletingTournamentId] = useState<string | null>(null);

  // Filters
  const [selectedEventName, setSelectedEventName] = useState<string | null>(null);
  const [selectedTournamentName, setSelectedTournamentName] = useState<string | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<[Date | null, Date | null]>([
    null,
    null,
  ]);

  // Sorting
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const fetchTournaments = async () => {
    try {
      setIsLoading(true);
      const data = await fetchAllTournaments();
      setTournaments(data);
    } catch (error_) {
      console.error('Failed to fetch tournaments:', error_);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const handleCreateTournament = async (
    tournament: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt'>,
  ) => {
    try {
      setIsSubmitting(true);
      const createdTournament = await createTournamentApi(tournament);
      // Add new tournament to list
      setTournaments([createdTournament, ...tournaments]);
      close();
      setEditingTournament(null);
    } catch (error_) {
      console.error('Failed to create tournament:', error_);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTournament = async (
    tournamentData: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt'>,
  ) => {
    if (!editingTournament) return;

    try {
      setIsSubmitting(true);
      const updatedTournament = await updateTournamentApi({
        ...tournamentData,
        id: editingTournament.id,
        createdAt: editingTournament.createdAt,
        updatedAt: new Date().toISOString(),
      });
      // Update tournament in list
      setTournaments(
        tournaments.map((t) => (t.id === updatedTournament.id ? updatedTournament : t)),
      );
      close();
      setEditingTournament(null);
    } catch (error_) {
      console.error('Failed to update tournament:', error_);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditModal = (tournament: Tournament) => {
    setEditingTournament(tournament);
    open();
  };

  const handleOpenCreateModal = () => {
    setEditingTournament(null);
    open();
  };

  const handleCloseModal = () => {
    close();
    setEditingTournament(null);
  };

  const handleBulkImport = async (
    tournamentsData: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt'>[],
  ) => {
    try {
      setIsImporting(true);
      const createdTournaments: Tournament[] = [];

      // Create tournaments one by one
      for (const tournamentData of tournamentsData) {
        const createdTournament = await createTournamentApi(tournamentData);
        createdTournaments.push(createdTournament);
      }

      // Add all created tournaments to the list
      setTournaments([...createdTournaments, ...tournaments]);
      closeImport();
    } catch (error_) {
      console.error('Failed to import tournaments:', error_);
      throw error_;
    } finally {
      setIsImporting(false);
    }
  };

  const handleClearFilter = () => {
    setSelectedEventName(null);
    setSelectedTournamentName(null);
    setSelectedDateRange([null, null]);
    setCurrentPage(1);
  };

  const handleToggleStatus = async (tournament: Tournament) => {
    try {
      setTogglingTournamentId(tournament.id);
      const newStatus = tournament.status === 'active' ? 'inactive' : 'active';

      const updatedTournament = await updateTournamentApi({
        ...tournament,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });

      // Update tournament in list
      setTournaments(
        tournaments.map((t) => (t.id === updatedTournament.id ? updatedTournament : t)),
      );
    } catch (error_) {
      console.error('Failed to toggle tournament status:', error_);
    } finally {
      setTogglingTournamentId(null);
    }
  };

  const handleDeleteTournament = async (tournament: Tournament) => {
    const confirmed = window.confirm(
      t('admin.tournaments.deleteConfirm', {
        name: tournament.tournamentNameJa,
        defaultValue: `Are you sure you want to delete "${tournament.tournamentNameJa}"?`,
      }),
    );
    if (!confirmed) return;

    try {
      setDeletingTournamentId(tournament.id);
      await deleteTournamentApi(tournament.id);
      setTournaments(tournaments.filter((t) => t.id !== tournament.id));
    } catch (error_) {
      console.error('Failed to delete tournament:', error_);
    } finally {
      setDeletingTournamentId(null);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with default descending for date, ascending for others
      setSortField(field);
      setSortDirection(field === 'date' ? 'desc' : 'asc');
    }
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': {
        return 'green';
      }
      case 'inactive': {
        return 'gray';
      }
      default: {
        return 'gray';
      }
    }
  };

  // Event name options for filter
  const eventNameOptions = useMemo(() => {
    const [dateFrom, dateTo] = selectedDateRange;

    let filtered = [...tournaments];

    // Apply date range filter to get available event names
    if (dateFrom || dateTo) {
      filtered = filtered.filter((t) => {
        const tournamentDate = new Date(t.date);
        const from = dateFrom ? new Date(dateFrom.setHours(0, 0, 0, 0)) : null;
        const to = dateTo ? new Date(dateTo.setHours(23, 59, 59, 999)) : null;

        if (from && to) {
          return tournamentDate >= from && tournamentDate <= to;
        }
        if (from) {
          return tournamentDate >= from;
        }
        if (to) {
          return tournamentDate <= to;
        }
        return true;
      });
    }

    // Get unique event names
    const uniqueEventNames = new Map<string, string>();
    filtered.forEach((t) => {
      if (!uniqueEventNames.has(t.eventNameJa)) {
        uniqueEventNames.set(t.eventNameJa, t.eventNameJa);
      }
    });

    return [...uniqueEventNames.entries()].map(([value, label]) => ({
      value,
      label,
    }));
  }, [tournaments, selectedDateRange]);

  // Tournament name options for filter
  const tournamentNameOptions = useMemo(() => {
    const [dateFrom, dateTo] = selectedDateRange;

    let filtered = [...tournaments];

    // Apply event name filter to get available tournament names
    if (selectedEventName) {
      filtered = filtered.filter((t) => t.eventNameJa === selectedEventName);
    }

    // Apply date range filter
    if (dateFrom || dateTo) {
      filtered = filtered.filter((t) => {
        const tournamentDate = new Date(t.date);
        const from = dateFrom ? new Date(dateFrom.setHours(0, 0, 0, 0)) : null;
        const to = dateTo ? new Date(dateTo.setHours(23, 59, 59, 999)) : null;

        if (from && to) {
          return tournamentDate >= from && tournamentDate <= to;
        }
        if (from) {
          return tournamentDate >= from;
        }
        if (to) {
          return tournamentDate <= to;
        }
        return true;
      });
    }

    // Get unique tournament names with event names
    const uniqueTournaments = new Map<string, string>();
    filtered.forEach((t) => {
      const key = `${t.eventNameJa} - ${t.tournamentNameJa}`;
      if (!uniqueTournaments.has(key)) {
        uniqueTournaments.set(key, key);
      }
    });

    return [...uniqueTournaments.entries()].map(([value, label]) => ({
      value,
      label,
    }));
  }, [tournaments, selectedEventName, selectedDateRange]);

  // Filtered and sorted tournaments
  const filteredAndSortedTournaments = useMemo(() => {
    let filtered = [...tournaments];

    // Apply event name filter
    if (selectedEventName) {
      filtered = filtered.filter((t) => t.eventNameJa === selectedEventName);
    }

    // Apply tournament name filter
    if (selectedTournamentName) {
      filtered = filtered.filter((t) => {
        const tournamentKey = `${t.eventNameJa} - ${t.tournamentNameJa}`;
        return tournamentKey === selectedTournamentName;
      });
    }

    // Apply date range filter
    const [dateFrom, dateTo] = selectedDateRange;
    if (dateFrom || dateTo) {
      filtered = filtered.filter((t) => {
        const tournamentDate = new Date(t.date);
        const from = dateFrom ? new Date(dateFrom.setHours(0, 0, 0, 0)) : null;
        const to = dateTo ? new Date(dateTo.setHours(23, 59, 59, 999)) : null;

        if (from && to) {
          return tournamentDate >= from && tournamentDate <= to;
        }
        if (from) {
          return tournamentDate >= from;
        }
        if (to) {
          return tournamentDate <= to;
        }
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'eventNameJa': {
          aValue = a.eventNameJa;
          bValue = b.eventNameJa;
          break;
        }
        case 'tournamentNameJa': {
          aValue = a.tournamentNameJa;
          bValue = b.tournamentNameJa;
          break;
        }
        case 'date': {
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        }
        case 'status': {
          aValue = a.status;
          bValue = b.status;
          break;
        }
        default: {
          return 0;
        }
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortDirection === 'asc' ? (aValue > bValue ? 1 : -1) : aValue < bValue ? 1 : -1;
    });

    return filtered;
  }, [
    tournaments,
    selectedEventName,
    selectedTournamentName,
    selectedDateRange,
    sortField,
    sortDirection,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedTournaments.length / itemsPerPage);
  const paginatedTournaments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedTournaments.slice(startIndex, endIndex);
  }, [filteredAndSortedTournaments, currentPage, itemsPerPage]);

  // Clear tournament name when event name or date range changes
  useEffect(() => {
    setSelectedTournamentName(null);
  }, [selectedEventName, selectedDateRange]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedEventName, selectedTournamentName, selectedDateRange]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <IconArrowUp size={14} style={{ marginLeft: 4 }} />
    ) : (
      <IconArrowDown size={14} style={{ marginLeft: 4 }} />
    );
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2}>{t('admin.tournaments.title')}</Title>
        <Group>
          <Button
            leftSection={<IconRefresh size={16} />}
            onClick={fetchTournaments}
            variant="light"
          >
            {t('admin.tournaments.refresh')}
          </Button>
          <Button
            leftSection={<IconFileImport size={16} />}
            onClick={openImport}
            variant="light"
            color="blue"
          >
            {t('admin.tournaments.import.button')}
          </Button>
          <Button leftSection={<IconPlus size={16} />} onClick={handleOpenCreateModal}>
            {t('admin.tournaments.create')}
          </Button>
        </Group>
      </Group>

      {/* Filters */}
      <Paper shadow="xs" p="md">
        <Group align="flex-end">
          <Select
            label={t('admin.tournaments.filters.eventName')}
            placeholder={t('admin.tournaments.filters.eventNamePlaceholder')}
            value={selectedEventName}
            onChange={setSelectedEventName}
            data={eventNameOptions}
            searchable
            clearable
            style={{ flex: 1 }}
          />
          <Select
            label={t('admin.tournaments.filters.tournamentName')}
            placeholder={t('admin.tournaments.filters.tournamentNamePlaceholder')}
            value={selectedTournamentName}
            onChange={setSelectedTournamentName}
            data={tournamentNameOptions}
            searchable
            clearable
            style={{ flex: 1 }}
          />
          <DatePickerInput
            type="range"
            label={t('admin.tournaments.filters.dateRange')}
            placeholder={t('admin.tournaments.filters.dateRangePlaceholder')}
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
          <Button
            leftSection={<IconX size={16} />}
            onClick={handleClearFilter}
            variant="light"
            color="gray"
            disabled={
              !selectedEventName &&
              !selectedTournamentName &&
              !selectedDateRange[0] &&
              !selectedDateRange[1]
            }
          >
            {t('admin.tournaments.filters.clear')}
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
            <Group justify="space-between" mb="md">
              <Text size="sm" c="dimmed">
                {filteredAndSortedTournaments.length}{' '}
                {t('admin.tournaments.table.tournamentsFound')}
              </Text>
              {totalPages > 1 && (
                <Text size="sm" c="dimmed">
                  {t('common.page', 'Page')} {currentPage} / {totalPages}
                </Text>
              )}
            </Group>

            <Table striped highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th
                    onClick={() => handleSort('eventNameJa')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    <Group gap={4}>
                      {t('admin.tournaments.table.eventName')}
                      {renderSortIcon('eventNameJa')}
                    </Group>
                  </Table.Th>
                  <Table.Th
                    onClick={() => handleSort('tournamentNameJa')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    <Group gap={4}>
                      {t('admin.tournaments.table.tournamentName')}
                      {renderSortIcon('tournamentNameJa')}
                    </Group>
                  </Table.Th>
                  <Table.Th
                    onClick={() => handleSort('date')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    <Group gap={4}>
                      {t('admin.tournaments.table.date')}
                      {renderSortIcon('date')}
                    </Group>
                  </Table.Th>
                  <Table.Th
                    onClick={() => handleSort('status')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    <Group gap={4}>
                      {t('admin.tournaments.table.status')}
                      {renderSortIcon('status')}
                    </Group>
                  </Table.Th>
                  <Table.Th style={{ cursor: 'pointer', userSelect: 'none' }}>
                    <Group gap={4}>{t('admin.tournaments.table.prizes')}</Group>
                  </Table.Th>
                  <Table.Th w="180px">{t('admin.tournaments.table.actions')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {paginatedTournaments.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={6}>
                      <Text ta="center" c="dimmed">
                        {t('admin.tournaments.table.noTournaments')}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  paginatedTournaments.map((tournament) => (
                    <Table.Tr key={tournament.id}>
                      <Table.Td>
                        <Stack gap={0}>
                          <Text fw={500}>{tournament.eventNameJa}</Text>
                          <Text size="xs" c="dimmed">
                            {tournament.eventName || '-'}
                          </Text>
                        </Stack>
                      </Table.Td>
                      <Table.Td>
                        <Stack gap={0}>
                          <Text>{tournament.tournamentNameJa}</Text>
                          <Text size="xs" c="dimmed">
                            {tournament.tournamentName || '-'}
                          </Text>
                        </Stack>
                      </Table.Td>
                      <Table.Td>{formatDate(tournament.date, false)}</Table.Td>
                      <Table.Td>
                        <Badge color={getStatusColor(tournament.status)} size="sm">
                          {t(`admin.tournaments.status.${tournament.status}`)}
                        </Badge>
                      </Table.Td>
                      <Table.Td>{tournament.prizes.length}</Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <ActionIcon
                            variant="light"
                            color={tournament.status === 'active' ? 'red' : 'green'}
                            onClick={() => handleToggleStatus(tournament)}
                            loading={togglingTournamentId === tournament.id}
                            disabled={togglingTournamentId !== null}
                            title={
                              tournament.status === 'active'
                                ? t('admin.tournaments.detail.deactivate')
                                : t('admin.tournaments.detail.activate')
                            }
                          >
                            {tournament.status === 'active' ? (
                              <IconLock size={16} />
                            ) : (
                              <IconLockOpen size={16} />
                            )}
                          </ActionIcon>
                          <ActionIcon
                            variant="light"
                            color="blue"
                            onClick={() => handleOpenEditModal(tournament)}
                            title={t('common.edit')}
                          >
                            <IconEdit size={16} />
                          </ActionIcon>
                          <ActionIcon
                            variant="light"
                            color="gray"
                            onClick={() => navigate(`/admin/tournaments/${tournament.id}`)}
                            title={t('admin.tournaments.viewDetails')}
                          >
                            <IconEye size={16} />
                          </ActionIcon>
                          <ActionIcon
                            variant="light"
                            color="red"
                            onClick={() => handleDeleteTournament(tournament)}
                            loading={deletingTournamentId === tournament.id}
                            disabled={deletingTournamentId !== null}
                            title={t('admin.tournaments.delete', 'Delete')}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))
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

      {/* Create/Edit Tournament Modal */}
      <TournamentFormModal
        opened={opened}
        onClose={handleCloseModal}
        onSubmit={editingTournament ? handleUpdateTournament : handleCreateTournament}
        isSubmitting={isSubmitting}
        tournament={editingTournament}
      />

      {/* CSV Import Modal */}
      <TournamentCSVImportModal
        opened={importOpened}
        onClose={closeImport}
        onImport={handleBulkImport}
        isSubmitting={isImporting}
      />
    </Stack>
  );
}
