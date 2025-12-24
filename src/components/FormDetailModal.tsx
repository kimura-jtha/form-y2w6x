import { Badge, Divider, Grid, Group, Modal, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';

import type { PrizeClaimFormSubmission } from '@/types';

interface FormDetailModalProps {
  opened: boolean;
  onClose: () => void;
  form: PrizeClaimFormSubmission | null;
}

export function FormDetailModal({ opened, onClose, form }: FormDetailModalProps) {
  const { t } = useTranslation();

  if (!form) return null;

  // const getStatusColor = (status: string) => {
  //   switch (status) {
  //     case 'approved': {
  //       return 'green';
  //     }
  //     case 'pending': {
  //       return 'yellow';
  //     }
  //     case 'rejected': {
  //       return 'red';
  //     }
  //     default: {
  //       return 'gray';
  //     }
  //   }
  // };

  const DetailRow = ({ label, value, blank }: {
    blank?: boolean;
    label: string; value: string | number | boolean }) => (
    <Grid gutter="xs">
      <Grid.Col span={5}>
        <Text size="sm" fw={600} c="dimmed">
          {label}
        </Text>
      </Grid.Col>
      <Grid.Col span={7}>
        <Text size="sm" fw={600}>
          {blank ? '-' : (value || '-')}
        </Text>
      </Grid.Col>
    </Grid>
  );

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <Text fw={600} size="lg">
            {t('admin.forms.detail.title')}
          </Text>
          {/* <Badge color={getStatusColor(form.status)} size="lg">
            {t(`admin.forms.status.${form.status}`)}
          </Badge> */}
        </Group>
      }
      size="lg"
      padding="xl"
    >
      <Stack gap="lg">
        {/* Form ID and Created Date */}
        <Stack gap="xs">
          {/* <DetailRow label={t('admin.forms.detail.formId')} value={form.id} /> */}
          <DetailRow
            label={t('admin.forms.detail.submittedAt')}
            value={`${new Date(form.createdAt).toLocaleDateString()} ${new Date(form.createdAt).toLocaleTimeString()}`}
          />
        </Stack>

        <Divider label={t('admin.forms.detail.personalInfo')} labelPosition="left" />

        {/* Personal Information */}
        <Stack gap="xs">
          <DetailRow
            label={t('prizeClaim.fields.lastNameKanji.label')}
            value={form.formContent.lastNameKanji}
          />
          <DetailRow
            label={t('prizeClaim.fields.firstNameKanji.label')}
            value={form.formContent.firstNameKanji}
          />
          <DetailRow
            label={t('prizeClaim.fields.lastNameKana.label')}
            value={form.formContent.lastNameKana}
          />
          <DetailRow
            label={t('prizeClaim.fields.firstNameKana.label')}
            value={form.formContent.firstNameKana}
          />
          <DetailRow
            label={t('prizeClaim.fields.playersId.label')}
            value={form.formContent.playersId}
          />
        </Stack>

        <Divider label={t('admin.forms.detail.contactInfo')} labelPosition="left" />

        {/* Contact Information */}
        <Stack gap="xs">
          <DetailRow
            blank={!form.formContent.postalCode}
            label={t('prizeClaim.fields.postalCode.label')}
            value={form.formContent.postalCode}
          />
          <DetailRow
            label={t('prizeClaim.fields.address.label')}
            value={form.formContent.address}
          />
          <DetailRow
            label={t('prizeClaim.fields.phoneNumber.label')}
            value={form.formContent.phoneNumber}
          />
          <DetailRow label={t('prizeClaim.fields.email.label')} value={form.formContent.email} />
        </Stack>

        <Divider label={t('admin.forms.detail.tournamentInfo')} labelPosition="left" />

        {/* Tournament Information */}
        <Stack gap="xs">
          <DetailRow
            label={t('prizeClaim.fields.tournamentName.label')}
            value={form.formContent.tournamentName}
          />
          <DetailRow
            label={t('prizeClaim.fields.tournamentDate.label')}
            value={new Date(form.formContent.tournamentDate).toLocaleDateString()}
          />
          <DetailRow label={t('prizeClaim.fields.rank.label')} value={form.formContent.rank} />
          <DetailRow
            label={t('prizeClaim.fields.prizeAmount.label')}
            value={`¥${form.formContent.amount.toLocaleString()}`}
          />
        </Stack>

        <Divider label={t('admin.forms.detail.bankInfo')} labelPosition="left" />

        {/* Bank Information */}
        <Stack gap="xs">
          <DetailRow
            blank={!form.formContent.bankName}
            label={t('prizeClaim.fields.bankName.label')}
            value={`${form.formContent.bankName} (${form.formContent.bankCode})`}
          />
          <DetailRow
            blank={!form.formContent.branchName}
            label={t('prizeClaim.fields.branchName.label')}
            value={`${form.formContent.branchName} (${form.formContent.branchCode})`}
          />
          <DetailRow
            blank={!form.formContent.accountType}
            label={t('prizeClaim.fields.accountType.label')}
            value={
              form.formContent.accountType ?
              t(`prizeClaim.fields.accountType.options.${form.formContent.accountType}`) : '-'}
          />
          <DetailRow
            blank={!form.formContent.accountNumber}
            label={t('prizeClaim.fields.accountNumber.label')}
            value={form.formContent.accountNumber}
          />
          <DetailRow

            label={t('prizeClaim.fields.accountHolderName.label')}
            value={form.formContent.accountHolderName}
          />
        </Stack>

        <Divider label={t('admin.forms.detail.agreements')} labelPosition="left" />

        {/* Agreements */}
        <Stack gap="xs">
          <Grid gutter="xs">
            <Grid.Col span={5}>
              <Text size="sm" fw={500} c="dimmed">
                {t('prizeClaim.fields.privacyAgreement.label')}
              </Text>
            </Grid.Col>
            <Grid.Col span={7}>
              <Badge color={form.formContent.privacyAgreed ? 'green' : 'red'} size="sm">
                {form.formContent.privacyAgreed ? t('common.yes') : t('common.no')}
              </Badge>
            </Grid.Col>
          </Grid>
          <Grid gutter="xs">
            <Grid.Col span={5}>
              <Text size="sm" fw={500} c="dimmed">
                {t('admin.forms.table.termsAgreed')}
              </Text>
            </Grid.Col>
            <Grid.Col span={7}>
              <Badge color={form.formContent.termsAgreed ? 'green' : 'red'} size="sm">
                {form.formContent.termsAgreed ? t('common.yes') : t('common.no')}
              </Badge>
            </Grid.Col>
          </Grid>
        </Stack>
      </Stack>
    </Modal>
  );
}
