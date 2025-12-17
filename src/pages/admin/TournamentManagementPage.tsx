import { useEffect, useState } from 'react';

import { useNavigate } from 'react-router';

import {
  Badge,
  Box,
  Button,
  Card,
  Grid,
  Group,
  Loader,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconCalendar,
  IconEdit,
  IconFileImport,
  IconPlus,
  IconRefresh,
  IconTrophy,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import { TournamentCSVImportModal } from '@/components/TournamentCSVImportModal';
import { TournamentFormModal } from '@/components/TournamentFormModal';
import {
  createTournament as createTournamentApi,
  fetchAllTournaments,
  updateTournament as updateTournamentApi,
} from '@/lib/lambda/tournament';
import type { Tournament } from '@/types';

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

      {isLoading ? (
        <Box style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <Loader />
        </Box>
      ) : (
        <Grid>
          {tournaments.map((tournament) => (
            <Grid.Col key={tournament.id} span={{ base: 12, sm: 6, md: 4 }}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Stack gap="md">
                  <Group justify="space-between">
                    <Stack gap={0}>
                      <Text fw={500} size="lg">
                        {tournament.eventNameJa}
                      </Text>
                      <Text size="sm" c="dimmed">
                        {tournament.eventName ?? '-'}
                      </Text>
                    </Stack>
                    <Badge color={getStatusColor(tournament.status)} size="sm">
                      {t(`admin.tournaments.status.${tournament.status}`)}
                    </Badge>
                  </Group>

                  <Text size="sm">
                    {tournament.tournamentNameJa} / {tournament.tournamentName ?? '-'}
                  </Text>

                  <Stack gap="xs">
                    <Group gap="xs">
                      <IconCalendar size={16} />
                      <Text size="sm" c="dimmed">
                        {new Date(tournament.date).toLocaleDateString()}
                      </Text>
                    </Group>
                    <Group gap="xs">
                      <IconTrophy size={16} />
                      <Text size="sm" c="dimmed">
                        {tournament.prizes.length} {t('admin.tournaments.prizes')}
                      </Text>
                    </Group>
                  </Stack>

                  {/* Prizes Table */}
                  {tournament.prizes.length > 0 && (
                    <Table striped highlightOnHover>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>{t('admin.tournaments.rank')}</Table.Th>
                          <Table.Th>{t('admin.tournaments.amount')}</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {tournament.prizes.slice(0, 3).map((prize) => (
                          <Table.Tr key={prize.rank}>
                            <Table.Td>{prize.rank}</Table.Td>
                            <Table.Td>¥{prize.amount.toLocaleString()}</Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  )}

                  {tournament.prizes.length > 3 && (
                    <Text size="xs" c="dimmed" ta="center">
                      +{tournament.prizes.length - 3} {t('admin.tournaments.morePrizes')}
                    </Text>
                  )}

                  <Group grow>
                    <Button
                      variant="light"
                      leftSection={<IconEdit size={16} />}
                      onClick={() => handleOpenEditModal(tournament)}
                    >
                      {t('common.edit')}
                    </Button>
                    <Button
                      variant="light"
                      onClick={() => navigate(`/admin/tournaments/${tournament.id}`)}
                    >
                      {t('admin.tournaments.viewDetails')}
                    </Button>
                  </Group>
                </Stack>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      )}

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
