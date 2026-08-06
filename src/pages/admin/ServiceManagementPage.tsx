import { useEffect, useMemo, useState } from 'react';

import {
  Alert,
  Box,
  Button,
  Group,
  Loader,
  Paper,
  SegmentedControl,
  Stack,
  Tabs,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconHelp, IconInfoCircle } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import { RichTextEditor } from '@/components/RichTextEditor';
import { TemplateVariablesModal } from '@/components/TemplateVariablesModal';
import type { ContractScopedBase, ContractType } from '@/lib/lambda/template';
import {
  buildContractScopedKey,
  getTemplateByKeyForAdmin,
  saveTemplateByKey,
} from '@/lib/lambda/template';

type DocType = 'terms' | 'privacy' | 'contract' | 'receipt' | 'confirmationEmail' | 'contractEmail';

const DOC_ORDER: DocType[] = [
  'terms',
  'privacy',
  'contract',
  'receipt',
  'confirmationEmail',
  'contractEmail',
];

// Documents that carry the sponsor/pro contract-type dimension (Phase 5 / FX-1).
const SCOPED_BASE: Partial<Record<DocType, ContractScopedBase>> = {
  terms: 'terms-of-service',
  privacy: 'privacy-policy',
  contract: 'contract',
};

// Single-variant (contract-type agnostic) documents and their storage keys.
const UNSCOPED_KEY: Partial<Record<DocType, string>> = {
  receipt: 'receipt-ja',
  confirmationEmail: 'confirmation-email-ja',
  contractEmail: 'contract-email-ja',
};

// Fallback subject used when the document has no editable subject field.
const DEFAULT_SUBJECT: Record<DocType, string> = {
  terms: 'Terms of Service',
  privacy: 'Privacy Policy',
  contract: 'Contract',
  receipt: 'Receipt',
  confirmationEmail: 'Confirmation Email',
  contractEmail: 'Contract Email',
};

const WITH_SUBJECT: DocType[] = ['confirmationEmail', 'contractEmail'];

const LANG = 'ja';

const isScoped = (doc: DocType): boolean => doc in SCOPED_BASE;
const hasSubject = (doc: DocType): boolean => WITH_SUBJECT.includes(doc);

// Composite state key: scoped docs keep one entry per contract type.
const entryKey = (doc: DocType, contractType: ContractType): string =>
  isScoped(doc) ? `${doc}:${contractType}` : doc;

// Storage (template) key for a given document + contract type.
const storageKey = (doc: DocType, contractType: ContractType): string => {
  const base = SCOPED_BASE[doc];
  if (base) {
    return buildContractScopedKey(base, LANG, contractType);
  }
  return UNSCOPED_KEY[doc]!;
};

interface EntryDescriptor {
  doc: DocType;
  contractType: ContractType;
  ek: string;
  key: string;
}

// Every (doc, contractType) combination that must be fetched / editable.
const ENTRIES: EntryDescriptor[] = DOC_ORDER.flatMap((doc) => {
  const contractTypes: ContractType[] = isScoped(doc) ? ['sponsor', 'pro'] : ['sponsor'];
  return contractTypes.map((contractType) => ({
    doc,
    contractType,
    ek: entryKey(doc, contractType),
    key: storageKey(doc, contractType),
  }));
});

interface EntryState {
  key: string;
  // null when the template does not exist yet (e.g. an absent pro override).
  id: string | null;
  content: string;
  subject: string;
  versionHistory: { version: string; publishedAt: string; publishedBy: string }[];
  isLoading: boolean;
  isSaving: boolean;
  success: boolean;
}

const emptyEntry = (key: string): EntryState => ({
  key,
  id: null,
  content: '',
  subject: '',
  versionHistory: [],
  isLoading: true,
  isSaving: false,
  success: false,
});

// Consider HTML "empty" when it has no textual content (RichTextEditor emits
// e.g. "<p></p>" for an empty document).
const isBlankHtml = (html: string): boolean =>
  html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, '')
    .trim().length === 0;

// Initialize activeTab from hash or default to 'terms'
const getTabFromHash = (): DocType => {
  const hash = window.location.hash.slice(1);
  if (hash && (DOC_ORDER as string[]).includes(hash)) {
    return hash as DocType;
  }
  return 'terms';
};

export function ServiceManagementPage() {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<DocType>(getTabFromHash);
  const [variablesModalOpened, setVariablesModalOpened] = useState(false);

  // Active contract type per scoped document (sponsor by default).
  const [contractTypeByDoc, setContractTypeByDoc] = useState<Record<string, ContractType>>({
    terms: 'sponsor',
    privacy: 'sponsor',
    contract: 'sponsor',
  });

  const [entries, setEntries] = useState<Record<string, EntryState>>(() =>
    Object.fromEntries(ENTRIES.map((e) => [e.ek, emptyEntry(e.key)])),
  );

  // Fetch every (doc, contractType) template. Scoped pro overrides may not exist
  // yet: getTemplateByKeyForAdmin returns null in that case so we can create it.
  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      const results = await Promise.all(
        ENTRIES.map(async (e) => ({
          e,
          template: await getTemplateByKeyForAdmin(e.key),
        })),
      );

      if (cancelled) return;

      setEntries((prev) => {
        const next = { ...prev };
        for (const { e, template } of results) {
          next[e.ek] = {
            key: e.key,
            id: template?.id ?? null,
            content: template?.content ?? '',
            subject: template?.subject ?? '',
            versionHistory: template?.versionHistory ?? [],
            isLoading: false,
            isSaving: false,
            success: false,
          };
        }
        return next;
      });
    };

    fetchAll().catch((error_) => {
      console.error('Failed to fetch templates:', error_);
      if (cancelled) return;
      setEntries((prev) => {
        const next = { ...prev };
        for (const ek of Object.keys(next)) {
          next[ek] = { ...next[ek], isLoading: false };
        }
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleContentChange = (ek: string, content: string) => {
    setEntries((prev) => ({ ...prev, [ek]: { ...prev[ek], content } }));
  };

  const handleSubjectChange = (ek: string, subject: string) => {
    setEntries((prev) => ({ ...prev, [ek]: { ...prev[ek], subject } }));
  };

  const handleSave = async (doc: DocType, contractType: ContractType) => {
    const ek = entryKey(doc, contractType);
    const state = entries[ek];
    if (!state) return;

    // Guard: never create an empty pro override — that would replace the
    // sponsor fallback with a blank document on the form side.
    if (isScoped(doc) && contractType === 'pro' && !state.id && isBlankHtml(state.content)) {
      notifications.show({
        color: 'red',
        message: t('admin.services.contractType.emptyProGuard'),
      });
      return;
    }

    const subject = hasSubject(doc) ? state.subject : DEFAULT_SUBJECT[doc];

    try {
      setEntries((prev) => ({
        ...prev,
        [ek]: { ...prev[ek], isSaving: true, success: false },
      }));

      await saveTemplateByKey({
        key: state.key,
        id: state.id ?? undefined,
        subject,
        content: state.content,
      });

      // Refetch to pick up the new id (on create) and version history.
      const updated = await getTemplateByKeyForAdmin(state.key);

      setEntries((prev) => ({
        ...prev,
        [ek]: {
          ...prev[ek],
          id: updated?.id ?? prev[ek].id,
          content: updated?.content ?? prev[ek].content,
          subject: updated?.subject ?? prev[ek].subject,
          versionHistory: updated?.versionHistory ?? prev[ek].versionHistory,
          isSaving: false,
          success: true,
        },
      }));

      // Reload after a short delay to refresh caches / version history, matching
      // the previous behaviour.
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error_) {
      console.error(`Failed to save ${ek}:`, error_);
      setEntries((prev) => ({ ...prev, [ek]: { ...prev[ek], isSaving: false } }));
    }
  };

  const renderTabPanel = (doc: DocType) => {
    const scoped = isScoped(doc);
    const contractType: ContractType = scoped ? contractTypeByDoc[doc] : 'sponsor';
    const ek = entryKey(doc, contractType);
    const state = entries[ek];

    if (!state || state.isLoading) {
      return (
        <Box style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <Loader />
        </Box>
      );
    }

    const latestVersion = state.versionHistory?.[0];
    const proNotCreated = scoped && contractType === 'pro' && !state.id;

    return (
      <Stack gap="md">
        {scoped && (
          <SegmentedControl
            value={contractType}
            onChange={(value) =>
              setContractTypeByDoc((prev) => ({ ...prev, [doc]: value as ContractType }))
            }
            data={[
              { value: 'sponsor', label: t('admin.services.contractType.sponsor') },
              { value: 'pro', label: t('admin.services.contractType.pro') },
            ]}
          />
        )}

        {proNotCreated && (
          <Alert icon={<IconInfoCircle size={16} />} color="blue">
            {t('admin.services.contractType.proFallbackNotice')}
          </Alert>
        )}

        {latestVersion && (
          <Paper p="md" shadow="xs" withBorder>
            <Group justify="space-between">
              <Stack gap={4}>
                <Text size="sm" fw={500}>
                  {t('admin.services.version')}: {latestVersion.version}
                </Text>
                <Group gap="lg">
                  <Text size="xs" c="dimmed">
                    {t('admin.services.lastUpdated')}:{' '}
                    {new Date(latestVersion.publishedAt).toLocaleString()}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {t('admin.services.updatedBy')}: {latestVersion.publishedBy}
                  </Text>
                </Group>
              </Stack>
            </Group>
          </Paper>
        )}

        {state.success && (
          <Alert icon={<IconCheck size={16} />} title={t('admin.services.success')} color="green">
            {t(`admin.services.successMessage.${doc}`)}
          </Alert>
        )}

        {hasSubject(doc) && (
          <TextInput
            size="sm"
            fw={500}
            label={t(`admin.services.editor.${doc}SubjectLabel`)}
            value={state.subject}
            onChange={(event) => handleSubjectChange(ek, event.currentTarget.value)}
          ></TextInput>
        )}

        <RichTextEditor
          key={ek}
          content={state.content}
          onChange={(content) => handleContentChange(ek, content)}
          onSave={() => handleSave(doc, contractType)}
          isSaving={state.isSaving}
          label={t(`admin.services.editor.${doc}Label`)}
        />
      </Stack>
    );
  };

  // Sync hash with activeTab on hash changes (browser back/forward)
  useEffect(() => {
    const handleHashChange = () => {
      setActiveTab(getTabFromHash());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const tabList = useMemo(() => DOC_ORDER, []);

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <Title order={2}>{t('admin.services.title')}</Title>
        <Button
          leftSection={<IconHelp size={16} />}
          variant="light"
          onClick={() => setVariablesModalOpened(true)}
        >
          {t('admin.services.variables.buttonLabel')}
        </Button>
      </Group>

      <TemplateVariablesModal
        opened={variablesModalOpened}
        onClose={() => setVariablesModalOpened(false)}
      />

      <Tabs
        value={activeTab}
        onChange={(value) => {
          if (value) {
            const newTab = value as DocType;
            setActiveTab(newTab);
            window.location.hash = newTab;
          }
        }}
      >
        <Tabs.List>
          {tabList.map((doc) => (
            <Tabs.Tab key={doc} fw="bold" value={doc}>
              {t(`admin.services.tabs.${doc}`)}
            </Tabs.Tab>
          ))}
        </Tabs.List>

        {tabList.map((doc) => (
          <Tabs.Panel key={doc} value={doc} pt="lg">
            {renderTabPanel(doc)}
          </Tabs.Panel>
        ))}
      </Tabs>
    </Stack>
  );
}
