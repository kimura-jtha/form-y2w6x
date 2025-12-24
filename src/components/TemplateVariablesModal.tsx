import { Badge, Code, Divider, Group, Modal, Stack, Table, Text, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';

interface TemplateVariablesModalProps {
  opened: boolean;
  onClose: () => void;
}

export function TemplateVariablesModal({ opened, onClose }: TemplateVariablesModalProps) {
  const { t } = useTranslation();

  const variableGroups: Array<{
    groupKey: string;
    variables: Array<{ name: string; hasExample?: boolean }>;
  }> = [
    {
      groupKey: 'common',
      variables: [
        { name: 'year', hasExample: true },
        { name: 'today', hasExample: true },
        { name: 'tosLink', hasExample: true },
        { name: 'contractNumber', hasExample: true },
        { name: 'receiptNumber', hasExample: true },
      ],
    },
    {
      groupKey: 'templateContent',
      variables: [
        { name: 'termsOfServiceHtml' },
        { name: 'termsOfServiceText' },
        { name: 'contractHtml' },
        { name: 'contractText' },
        { name: 'receiptHtml' },
        { name: 'receiptText' },
      ],
    },
    {
      groupKey: 'personalInfo',
      variables: [
        { name: 'lastNameKanji', hasExample: true },
        { name: 'firstNameKanji', hasExample: true },
        { name: 'lastNameKana', hasExample: true },
        { name: 'firstNameKana', hasExample: true },
        { name: 'email', hasExample: true },
        { name: 'phoneNumber', hasExample: true },
        { name: 'postalCode', hasExample: true },
        { name: 'address', hasExample: true },
      ],
    },
    {
      groupKey: 'tournamentInfo',
      variables: [
        { name: 'playersId', hasExample: true },
        { name: 'tournamentName', hasExample: true },
        { name: 'tournamentDate', hasExample: true },
        { name: 'rank', hasExample: true },
        { name: 'amount', hasExample: true },
      ],
    },
    {
      groupKey: 'bankingInfo',
      variables: [
        { name: 'bankName', hasExample: true },
        { name: 'bankCode', hasExample: true },
        { name: 'branchName', hasExample: true },
        { name: 'branchCode', hasExample: true },
        { name: 'accountTypeJa', hasExample: true },
        { name: 'accountTypeEn', hasExample: true },
        { name: 'accountNumber', hasExample: true },
        { name: 'accountHolderName', hasExample: true },
      ],
    },
  ];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <Title order={3}>{t('admin.services.variables.title' as any)}</Title>
          <Badge color="blue" size="sm">
            {t('admin.services.variables.helpLabel' as any)}
          </Badge>
        </Group>
      }
      size="xl"
    >
      <Stack gap="xl">
        <Text size="sm" c="dimmed">
          {t('admin.services.variables.description' as any)}
        </Text>

        {variableGroups.map((group, groupIndex) => (
          <Stack key={groupIndex} gap="md">
            <div>
              <Title order={4}>
                {t(`admin.services.variables.groups.${group.groupKey}.title` as any)}
              </Title>
              <Text size="sm" c="dimmed">
                {t(`admin.services.variables.groups.${group.groupKey}.description` as any)}
              </Text>
            </div>

            <Table striped highlightOnHover withTableBorder withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: '30%' }}>
                    {t('admin.services.variables.table.variable' as any)}
                  </Table.Th>
                  <Table.Th style={{ width: '40%' }}>
                    {t('admin.services.variables.table.description' as any)}
                  </Table.Th>
                  <Table.Th style={{ width: '30%' }}>
                    {t('admin.services.variables.table.example' as any)}
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {group.variables.map((variable, varIndex) => (
                  <Table.Tr key={varIndex}>
                    <Table.Td>
                      <Code color="blue.1">{`{{${variable.name}}}`}</Code>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {t(`admin.services.variables.fields.${variable.name}.description` as any)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      {variable.hasExample && (
                        <Code color="gray.1" style={{ fontSize: '0.85em' }}>
                          {t(`admin.services.variables.fields.${variable.name}.example` as any)}
                        </Code>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>

            {groupIndex < variableGroups.length - 1 && <Divider />}
          </Stack>
        ))}

        <Stack gap="xs">
          <Title order={5}>{t('admin.services.variables.usage.title' as any)}</Title>
          <Text size="sm">{t('admin.services.variables.usage.description' as any)}</Text>
          <Code block>
            {`Dear {{lastNameKanji}} {{firstNameKanji}},

Thank you for participating in {{tournamentName}} on {{tournamentDate}}.
Your prize amount of {{amount}} will be transferred to:

Bank: {{bankName}} ({{bankCode}})
Branch: {{branchName}} ({{branchCode}})
Account: {{accountTypeJa}} {{accountNumber}}
Holder: {{accountHolderName}}

Contract Number: {{contractNumber}}
Receipt Number: {{receiptNumber}}`}
          </Code>
        </Stack>
      </Stack>
    </Modal>
  );
}
