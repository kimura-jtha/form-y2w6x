import { useRef, useState } from 'react';

import {
  Alert,
  Badge,
  Box,
  Button,
  Group,
  List,
  Modal,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconCheck,
  IconDownload,
  IconFileUpload,
  IconX,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import type { Tournament } from '@/types';
import type { CSVImportError, CSVImportResult } from '@/utils/csv';
import { downloadTournamentCSVTemplate, parseTournamentCSV } from '@/utils/csv';

interface TournamentCSVImportModalProps {
  opened: boolean;
  onClose: () => void;
  onImport: (tournaments: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
  isSubmitting: boolean;
}

export function TournamentCSVImportModal({
  opened,
  onClose,
  onImport,
  isSubmitting,
}: TournamentCSVImportModalProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parseResult, setParseResult] = useState<CSVImportResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (event: { target: { files?: FileList | null } }) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    // Read and parse CSV file
    const reader = new FileReader();
    reader.addEventListener('load', (e) => {
      const text = e.target?.result as string;
      const result = parseTournamentCSV(text);
      setParseResult(result);
    });
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!parseResult || parseResult.data.length === 0) return;

    await onImport(parseResult.data);
    handleModalClose();
  };

  const handleModalClose = () => {
    setParseResult(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleModalClose}
      title={<Title order={3}>{t('admin.tournaments.import.title')}</Title>}
      size="xl"
      closeOnClickOutside={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <Stack gap="md">
        {/* Instructions and Template Download */}
        <Alert icon={<IconAlertCircle size={16} />} color="blue" variant="light">
          <Stack gap="xs">
            <Text size="sm">{t('admin.tournaments.import.instructions')}</Text>
            <Button
              size="xs"
              variant="light"
              leftSection={<IconDownload size={14} />}
              onClick={downloadTournamentCSVTemplate}
            >
              {t('admin.tournaments.import.downloadTemplate')}
            </Button>
          </Stack>
        </Alert>

        {/* File Upload */}
        <Box>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <Button
            leftSection={<IconFileUpload size={16} />}
            onClick={handleUploadClick}
            fullWidth
            disabled={isSubmitting}
          >
            {selectedFile ? selectedFile.name : t('admin.tournaments.import.selectFile')}
          </Button>
        </Box>

        {/* Parse Results */}
        {parseResult && (
          <Stack gap="md">
            {/* Status Badge */}
            <Group justify="space-between">
              <Badge
                size="lg"
                color={parseResult.success ? 'green' : 'red'}
                leftSection={parseResult.success ? <IconCheck size={14} /> : <IconX size={14} />}
              >
                {parseResult.success
                  ? t('admin.tournaments.import.validationSuccess')
                  : t('admin.tournaments.import.validationFailed')}
              </Badge>
              <Text size="sm" c="dimmed">
                {t('admin.tournaments.import.validRecords', { count: parseResult.data.length })}
              </Text>
            </Group>

            {/* Errors List */}
            {parseResult.errors.length > 0 && (
              <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
                <Stack gap="xs">
                  <Text fw={500}>{t('admin.tournaments.import.errors')}:</Text>
                  <List size="sm" spacing="xs">
                    {parseResult.errors.map((error: CSVImportError, index: number) => (
                      <List.Item key={index}>
                        <Text size="sm">
                          <strong>
                            {t('admin.tournaments.import.row')} {error.row}
                          </strong>
                          {error.field && ` (${error.field})`}: {error.message}
                        </Text>
                      </List.Item>
                    ))}
                  </List>
                </Stack>
              </Alert>
            )}

            {/* Preview Table */}
            {parseResult.data.length > 0 && (
              <Box>
                <Text size="sm" fw={500} mb="xs">
                  {t('admin.tournaments.import.preview')}:
                </Text>
                <Box
                  style={{
                    maxHeight: '300px',
                    overflowY: 'auto',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                  }}
                >
                  <Table striped highlightOnHover>
                    <Table.Thead style={{ position: 'sticky', top: 0, background: 'white' }}>
                      <Table.Tr>
                        <Table.Th>{t('admin.tournaments.import.eventName')}</Table.Th>
                        <Table.Th>{t('admin.tournaments.import.tournamentName')}</Table.Th>
                        <Table.Th>{t('admin.tournaments.import.date')}</Table.Th>
                        <Table.Th>{t('admin.tournaments.import.status')}</Table.Th>
                        <Table.Th>{t('admin.tournaments.import.prizesCount')}</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {parseResult.data.map((tournament, index) => (
                        <Table.Tr key={index}>
                          <Table.Td>
                            <Stack gap={0}>
                              <Text size="sm">{tournament.eventName}</Text>
                              <Text size="xs" c="dimmed">
                                {tournament.eventNameJa}
                              </Text>
                            </Stack>
                          </Table.Td>
                          <Table.Td>
                            <Stack gap={0}>
                              <Text size="sm">{tournament.tournamentName}</Text>
                              <Text size="xs" c="dimmed">
                                {tournament.tournamentNameJa}
                              </Text>
                            </Stack>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{tournament.date}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge
                              size="sm"
                              color={tournament.status === 'active' ? 'green' : 'gray'}
                            >
                              {t(`admin.tournaments.status.${tournament.status}`)}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{tournament.prizes.length}</Text>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Box>
              </Box>
            )}
          </Stack>
        )}

        {/* Action Buttons */}
        <Group justify="flex-end">
          <Button variant="light" onClick={handleModalClose} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleImport}
            disabled={!parseResult || parseResult.data.length === 0 || isSubmitting}
            loading={isSubmitting}
          >
            {t('admin.tournaments.import.import', { count: parseResult?.data.length ?? 0 })}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
