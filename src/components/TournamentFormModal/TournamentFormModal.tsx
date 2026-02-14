import { useEffect, useState } from 'react';

import {
  ActionIcon,
  Button,
  Grid,
  Group,
  Modal,
  NumberInput,
  ScrollArea,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconEdit, IconPlus, IconTrash, IconX } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import { PRIZE_PREFIX } from '@/config';
import type { PrizeRank, Tournament } from '@/types';

interface TournamentFormModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (tournament: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  isSubmitting?: boolean;
  tournament?: Tournament | null;
}

export function TournamentFormModal({
  opened,
  onClose,
  onSubmit,
  isSubmitting = false,
  tournament = null,
}: TournamentFormModalProps) {
  const { t } = useTranslation();
  const isEditMode = !!tournament;

  // Form state
  const [eventName, setEventName] = useState('');
  const [eventNameJa, setEventNameJa] = useState('');
  const [tournamentName, setTournamentName] = useState('');
  const [tournamentNameJa, setTournamentNameJa] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [prizes, setPrizes] = useState<PrizeRank[]>([]);

  // Prize form state
  const [newRank, setNewRank] = useState<string>('');
  const [newAmount, setNewAmount] = useState<number | string>('');

  // Edit prize state
  const [editingRank, setEditingRank] = useState<string | null>(null);
  const [editRank, setEditRank] = useState<string>('');
  const [editAmount, setEditAmount] = useState<number | string>('');

  // Populate form when editing
  useEffect(() => {
    if (tournament && opened) {
      setEventName(tournament.eventName);
      setEventNameJa(tournament.eventNameJa);
      setTournamentName(tournament.tournamentName);
      setTournamentNameJa(tournament.tournamentNameJa);
      setDate(new Date(tournament.date));
      setPrizes(tournament.prizes);
    } else if (!opened) {
      // Reset form when modal closes
      setEventName('');
      setEventNameJa('');
      setTournamentName('');
      setTournamentNameJa('');
      setDate(null);
      setPrizes([]);
      setNewRank('');
      setNewAmount('');
      // Clear edit state
      setEditingRank(null);
      setEditRank('');
      setEditAmount('');
    }
  }, [tournament, opened]);

  const handleAddPrize = () => {
    if (!newRank || !newAmount) {
      notifications.show({
        title: t('admin.tournaments.modal.notifications.fillAllFields.title'),
        message: t('admin.tournaments.modal.notifications.fillAllFields.message'),
        color: 'red',
      });
      return;
    }
    const rank = newRank;
    const amount = typeof newAmount === 'string' ? Number.parseInt(newAmount) : newAmount;

    // Check if rank already exists
    if (prizes.some((p) => p.rank === rank)) {
      return;
    }

    setPrizes([...prizes, { rank, amount }]);
    setNewRank('');
    setNewAmount('');
  };

  const handleRemovePrize = (rank: string) => {
    setPrizes(prizes.filter((p) => p.rank !== rank));
  };

  const handleStartEdit = (prize: PrizeRank) => {
    setEditingRank(prize.rank);
    setEditRank(prize.rank);
    setEditAmount(prize.amount);
  };

  const handleCancelEdit = () => {
    setEditingRank(null);
    setEditRank('');
    setEditAmount('');
  };

  const handleSaveEdit = () => {
    if (!editRank || !editAmount) {
      notifications.show({
        title: t('admin.tournaments.modal.notifications.fillAllFieldsEdit.title'),
        message: t('admin.tournaments.modal.notifications.fillAllFieldsEdit.message'),
        color: 'red',
      });
      return;
    }

    const amount = typeof editAmount === 'string' ? Number.parseInt(editAmount) : editAmount;

    // Check if new rank conflicts with existing (excluding current)
    if (editRank !== editingRank && prizes.some((p) => p.rank === editRank)) {
      notifications.show({
        title: t('admin.tournaments.modal.notifications.rankExists.title'),
        message: t('admin.tournaments.modal.notifications.rankExists.message'),
        color: 'red',
      });
      return;
    }

    // Update the prize
    setPrizes(prizes.map((p) => (p.rank === editingRank ? { rank: editRank, amount } : p)));

    // Clear edit state
    handleCancelEdit();
  };

  const handleSubmit = async () => {
    if (
      !eventName ||
      !eventNameJa ||
      !tournamentName ||
      !tournamentNameJa ||
      !date ||
      prizes.length === 0
    ) {
      return;
    }

    await onSubmit({
      eventName,
      eventNameJa,
      tournamentName,
      tournamentNameJa,
      date: date.toISOString().split('T')[0],
      status: tournament?.status || 'active',
      prizes,
    });
  };

  const isFormValid =
    eventName.trim() !== '' &&
    eventNameJa.trim() !== '' &&
    tournamentName.trim() !== '' &&
    tournamentNameJa.trim() !== '' &&
    date !== null &&
    prizes.length > 0;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Text fw={600} size="lg">
          {isEditMode ? t('admin.tournaments.modal.editTitle') : t('admin.tournaments.modal.title')}
        </Text>
      }
      size="75vw"
    >
      <Stack gap="md" p="lg">
        {/* Event Information */}
        <Grid>
          <Grid.Col span={6}>
            <TextInput
              label={t('admin.tournaments.modal.eventNameJa')}
              placeholder=""
              value={eventNameJa}
              onChange={(event) => setEventNameJa(event.currentTarget.value)}
              required
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput
              label={t('admin.tournaments.modal.eventName')}
              placeholder=""
              value={eventName}
              onChange={(event) => setEventName(event.currentTarget.value)}
              required
            />
          </Grid.Col>
        </Grid>

        {/* Tournament Information */}
        <Grid>
          <Grid.Col span={6}>
            <TextInput
              label={t('admin.tournaments.modal.tournamentNameJa')}
              placeholder=""
              value={tournamentNameJa}
              onChange={(event) => setTournamentNameJa(event.currentTarget.value)}
              required
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput
              label={t('admin.tournaments.modal.tournamentName')}
              placeholder=""
              value={tournamentName}
              onChange={(event) => setTournamentName(event.currentTarget.value)}
              required
            />
          </Grid.Col>
        </Grid>

        <DateInput
          label={t('admin.tournaments.modal.date')}
          placeholder={t('admin.tournaments.modal.datePlaceholder')}
          value={date}
          onChange={(value) => {
            if (!value) {
              setDate(null);
            } else if (typeof value === 'string') {
              setDate(new Date(value));
            } else {
              setDate(value);
            }
          }}
          required
        />

        {/* Prizes Section */}
        <Stack gap="xs">
          <Text fw={500} size="sm">
            {t('admin.tournaments.modal.prizes')}
          </Text>

          {/* Existing Prizes Table */}
          {prizes.length > 0 && (
            <ScrollArea.Autosize mah={300}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('admin.tournaments.modal.rank')}</Table.Th>
                    <Table.Th>{t('admin.tournaments.modal.amount')}</Table.Th>
                    <Table.Th style={{ width: 100 }}></Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {prizes.map((prize) => (
                    <Table.Tr key={prize.rank}>
                      {editingRank === prize.rank ? (
                        // Edit mode
                        <>
                          <Table.Td>
                            <TextInput
                              value={editRank}
                              onChange={(e) => setEditRank(e.currentTarget.value)}
                              size="xs"
                            />
                          </Table.Td>
                          <Table.Td>
                            <NumberInput
                              value={editAmount}
                              onChange={setEditAmount}
                              min={0}
                              allowNegative={false}
                              allowDecimal={false}
                              thousandSeparator=","
                              prefix={PRIZE_PREFIX}
                              size="xs"
                            />
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs">
                              <ActionIcon
                                color="green"
                                variant="subtle"
                                onClick={handleSaveEdit}
                                size="sm"
                              >
                                <IconCheck size={16} />
                              </ActionIcon>
                              <ActionIcon
                                color="gray"
                                variant="subtle"
                                onClick={handleCancelEdit}
                                size="sm"
                              >
                                <IconX size={16} />
                              </ActionIcon>
                            </Group>
                          </Table.Td>
                        </>
                      ) : (
                        // View mode
                        <>
                          <Table.Td>{prize.rank}</Table.Td>
                          <Table.Td>
                            {PRIZE_PREFIX}
                            {prize.amount.toLocaleString()}
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs">
                              <ActionIcon
                                color="blue"
                                variant="subtle"
                                onClick={() => handleStartEdit(prize)}
                                size="sm"
                              >
                                <IconEdit size={16} />
                              </ActionIcon>
                              <ActionIcon
                                color="red"
                                variant="subtle"
                                onClick={() => handleRemovePrize(prize.rank)}
                                disabled={prizes.length === 1}
                                size="sm"
                              >
                                <IconTrash size={16} />
                              </ActionIcon>
                            </Group>
                          </Table.Td>
                        </>
                      )}
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea.Autosize>
          )}

          {/* Add Prize Form */}
          <Grid align="flex-end">
            <Grid.Col span={4}>
              <TextInput
                label={t('admin.tournaments.modal.rank')}
                placeholder=""
                value={newRank}
                onChange={(e) => setNewRank(e.currentTarget.value)}
              />
            </Grid.Col>
            <Grid.Col span={5}>
              <NumberInput
                label={t('admin.tournaments.modal.amount')}
                placeholder=""
                value={newAmount}
                onChange={setNewAmount}
                min={0}
                allowNegative={false}
                allowDecimal={false}
                thousandSeparator=","
                prefix={PRIZE_PREFIX}
              />
            </Grid.Col>
            <Grid.Col span={3}>
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={handleAddPrize}
                fullWidth
                variant="light"
              >
                {t('admin.tournaments.modal.addPrize')}
              </Button>
            </Grid.Col>
          </Grid>
        </Stack>

        {/* Action Buttons */}
        <Group justify="flex-end" mt="md">
          <Button variant="light" onClick={onClose} disabled={isSubmitting}>
            {t('admin.tournaments.modal.cancel')}
          </Button>
          <Button onClick={handleSubmit} loading={isSubmitting} disabled={!isFormValid}>
            {isEditMode
              ? t('admin.tournaments.modal.updateButton')
              : t('admin.tournaments.modal.createButton')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
