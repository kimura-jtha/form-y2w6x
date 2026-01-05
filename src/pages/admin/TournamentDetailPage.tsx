import { useEffect, useState } from 'react';

import { useNavigate, useParams } from 'react-router';

import {
  Badge,
  Box,
  Button,
  Card,
  Center,
  Grid,
  Group,
  Loader,
  Paper,
  ScrollArea,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconArrowLeft,
  IconCalendar,
  IconEdit,
  IconRefresh,
  IconTrophy,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import { TournamentFormModal } from '@/components/TournamentFormModal';
import { ROUTES } from '@/constants';
import {
  fetchFormsByTournament,
  fetchTournamentByIdAdmin,
  toggleTournamentStatus as toggleTournamentStatusApi,
  updateTournament as updateTournamentApi,
} from '@/lib/lambda/tournament';
import type { PrizeClaimFormSubmission, Tournament } from '@/types';
import { formatDate } from '@/utils/string';

export function TournamentDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [forms, setForms] = useState<PrizeClaimFormSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingForms, setIsLoadingForms] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);

  const fetchTournament = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const tournament = await fetchTournamentByIdAdmin(id);
      setTournament(tournament);
    } catch (error_) {
      console.error('Failed to fetch tournament:', error_);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchForms = async () => {
    if (!id) return;

    try {
      setIsLoadingForms(true);
      const { forms: fetchedForms, pagination } = await fetchFormsByTournament(id, undefined, 20);
      setForms(fetchedForms || []);
      setNextCursor(pagination.nextCursor || null);
      setHasMore(pagination.hasMore);
    } catch (error_) {
      console.error('Failed to fetch forms:', error_);
    } finally {
      setIsLoadingForms(false);
    }
  };

  const loadMoreForms = async () => {
    if (!id || !nextCursor || isLoadingMore) return;

    try {
      setIsLoadingMore(true);
      const { forms: moreForms, pagination } = await fetchFormsByTournament(id, nextCursor, 20);
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
    fetchTournament();
    fetchForms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleUpdateTournament = async (
    tournamentData: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt'>,
  ) => {
    if (!tournament) return;

    try {
      setIsSubmitting(true);
      const updatedTournament = await updateTournamentApi({
        ...tournamentData,
        id: tournament.id,
        createdAt: tournament.createdAt,
        updatedAt: new Date().toISOString(),
      });
      setTournament(updatedTournament);
      close();
    } catch (error_) {
      console.error('Failed to update tournament:', error_);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!tournament) return;

    try {
      setIsTogglingStatus(true);
      const updatedTournament = await toggleTournamentStatusApi(tournament);
      setTournament(updatedTournament);
    } catch (error_) {
      console.error('Failed to toggle tournament status:', error_);
    } finally {
      setIsTogglingStatus(false);
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

  if (isLoading) {
    return (
      <Box style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <Loader />
      </Box>
    );
  }

  if (!tournament) {
    return (
      <Stack gap="lg">
        <Button
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => navigate(ROUTES.ADMIN.TOURNAMENTS)}
          variant="light"
        >
          {t('admin.tournaments.detail.backToList')}
        </Button>
        <Text>{t('admin.tournaments.detail.notFound')}</Text>
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      {/* Header */}
      <Group justify="space-between">
        <Group>
          <Button
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => navigate(ROUTES.ADMIN.TOURNAMENTS)}
            variant="light"
          >
            {t('admin.tournaments.detail.backToList')}
          </Button>
          <Stack gap={0}>
            <Title order={2}>
              {tournament.eventNameJa} / {tournament.eventName ?? '-'}
            </Title>
            <Text size="sm" c="dimmed">
              {tournament.tournamentNameJa} / {tournament.tournamentName ?? '-'}
            </Text>
          </Stack>
        </Group>
        <Group>
          <Button leftSection={<IconEdit size={16} />} onClick={open}>
            {t('common.edit')}
          </Button>
          <Button
            leftSection={<IconRefresh size={16} />}
            onClick={() => {
              fetchTournament();
              fetchForms();
            }}
            variant="light"
          >
            {t('admin.tournaments.refresh')}
          </Button>
        </Group>
      </Group>

      {/* Tournament Information */}
      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="md">
              <Text fw={500} size="lg">
                {t('admin.tournaments.detail.tournamentInfo')}
              </Text>

              {/* Event Name (Japanese) */}
              <Group gap="xs" align="flex-start">
                <Text size="sm" c="dimmed" fw={500} style={{ minWidth: 180 }}>
                  {t('admin.tournaments.modal.eventNameJa')}:
                </Text>
                <Text size="sm" flex={1}>
                  {tournament.eventNameJa}
                </Text>
              </Group>

              {/* Event Name (English) */}
              <Group gap="xs" align="flex-start">
                <Text size="sm" c="dimmed" fw={500} style={{ minWidth: 180 }}>
                  {t('admin.tournaments.modal.eventName')}:
                </Text>
                <Text size="sm" flex={1}>
                  {tournament.eventName}
                </Text>
              </Group>

              {/* Tournament Name (Japanese) */}
              <Group gap="xs" align="flex-start">
                <Text size="sm" c="dimmed" fw={500} style={{ minWidth: 180 }}>
                  {t('admin.tournaments.modal.tournamentNameJa')}:
                </Text>
                <Text size="sm" flex={1}>
                  {tournament.tournamentNameJa}
                </Text>
              </Group>

              {/* Tournament Name (English) */}
              <Group gap="xs" align="flex-start">
                <Text size="sm" c="dimmed" fw={500} style={{ minWidth: 180 }}>
                  {t('admin.tournaments.modal.tournamentName')}:
                </Text>
                <Text size="sm" flex={1}>
                  {tournament.tournamentName}
                </Text>
              </Group>

              {/* Date */}
              <Group gap="xs" align="center">
                <IconCalendar size={16} />
                <Text size="sm" c="dimmed" fw={500} style={{ minWidth: 164 }}>
                  {t('admin.tournaments.detail.date')}:
                </Text>
                <Text size="sm">{formatDate(tournament.date, false)}</Text>
              </Group>

              {/* Status with Toggle */}
              <Group gap="xs" align="center">
                <Text size="sm" c="dimmed" fw={500} style={{ minWidth: 180 }}>
                  {t('admin.tournaments.detail.status')}:
                </Text>
                <Badge color={getStatusColor(tournament.status)} size="lg">
                  {t(`admin.tournaments.status.${tournament.status}`)}
                </Badge>
                <Button
                  size="xs"
                  variant="light"
                  onClick={handleToggleStatus}
                  loading={isTogglingStatus}
                >
                  {tournament.status === 'active'
                    ? t('admin.tournaments.detail.deactivate')
                    : t('admin.tournaments.detail.activate')}
                </Button>
              </Group>
            </Stack>
          </Card>
        </Grid.Col>

        {/* Prizes Information */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="md">
              <Group gap="xs">
                <IconTrophy size={16} />
                <Text fw={500} size="lg">
                  {t('admin.tournaments.detail.prizesInfo')} ({tournament.prizes?.length || 0})
                </Text>
              </Group>
              {tournament.prizes?.length && tournament.prizes.length > 0 && (
                <ScrollArea.Autosize mah={300}>
                  <Table striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>{t('admin.tournaments.rank')}</Table.Th>
                        <Table.Th>{t('admin.tournaments.amount')}</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {tournament.prizes?.map((prize) => (
                        <Table.Tr key={prize.rank}>
                          <Table.Td>{prize.rank}</Table.Td>
                          <Table.Td>¥{prize.amount.toLocaleString()}</Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </ScrollArea.Autosize>
              )}
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Forms Table */}
      <Paper shadow="xs" p="md">
        <Stack gap="md">
          <Text fw={500} size="lg">
            {t('admin.tournaments.detail.submittedForms')}
          </Text>

          {isLoadingForms ? (
            <Box style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <Loader />
            </Box>
          ) : (
            <>
              <Text size="sm" c="dimmed">
                {forms?.length || 0} {t('admin.forms.table.formsFound')}
              </Text>
              <Table striped highlightOnHover withTableBorder>
                <Table.Thead>
                  <Table.Tr>
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
                      <Table.Td colSpan={6}>
                        <Text ta="center" c="dimmed">
                          {t('admin.tournaments.detail.noForms')}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    forms.map((form) => (
                      <Table.Tr key={form.id}>
                        <Table.Td>
                          {form.formContent.lastNameKanji} {form.formContent.firstNameKanji}
                        </Table.Td>
                        <Table.Td>{form.formContent.email}</Table.Td>
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
                      </Table.Tr>
                    ))
                  )}
                </Table.Tbody>
              </Table>
              {hasMore && !isLoadingForms && (
                <Center mt="md">
                  <Button onClick={loadMoreForms} loading={isLoadingMore} variant="light">
                    {t('common.loadMore')}
                  </Button>
                </Center>
              )}
            </>
          )}
        </Stack>
      </Paper>

      {/* Edit Tournament Modal */}
      <TournamentFormModal
        opened={opened}
        onClose={close}
        onSubmit={handleUpdateTournament}
        isSubmitting={isSubmitting}
        tournament={tournament}
      />
    </Stack>
  );
}
