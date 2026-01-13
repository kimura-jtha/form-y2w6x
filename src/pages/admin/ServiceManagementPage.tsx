import { useEffect, useState } from 'react';

import {
  Alert,
  Box,
  Button,
  Group,
  Loader,
  Paper,
  Stack,
  Tabs,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconCheck, IconHelp } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import { RichTextEditor } from '@/components/RichTextEditor';
import { TemplateVariablesModal } from '@/components/TemplateVariablesModal';
import {
  getConfirmationEmailTemplate,
  getContractEmailTemplate,
  getPrivacyPolicyTemplate,
  getReceiptTemplate,
  getTermsOfServiceTemplate,
  saveConfirmationEmailTemplate,
  saveContractEmailTemplate,
  savePrivacyPolicyTemplate,
  saveReceiptTemplate,
  saveTermsOfServiceTemplate,
} from '@/lib/lambda/template';
import type { Template } from '@/types/template';

type TabValue = 'terms' | 'privacy' | 'receipt' | 'confirmationEmail' | 'contractEmail';

interface TabState {
  data: Template | null;
  content: string;
  isLoading: boolean;
  isSaving: boolean;
  success: boolean;
}

// Initialize activeTab from hash or default to 'terms'
const getTabFromHash = (): TabValue => {
  const hash = window.location.hash.slice(1); // Remove the '#' character
  if (
    hash &&
    ['terms', 'privacy', 'receipt', 'confirmationEmail', 'contractEmail'].includes(hash)
  ) {
    return hash as TabValue;
  }
  return 'terms';
};
export function ServiceManagementPage() {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<TabValue>(getTabFromHash);
  const [variablesModalOpened, setVariablesModalOpened] = useState(false);

  const [tabSubjects, setTabSubjects] = useState<Record<TabValue, string>>({
    terms: '',
    privacy: '',
    receipt: '',
    confirmationEmail: '',
    contractEmail: '',
  });

  const [tabStates, setTabStates] = useState<Record<TabValue, TabState>>({
    terms: { data: null, content: '', isLoading: true, isSaving: false, success: false },
    privacy: { data: null, content: '', isLoading: true, isSaving: false, success: false },
    receipt: { data: null, content: '', isLoading: true, isSaving: false, success: false },
    confirmationEmail: {
      data: null,
      content: '',
      isLoading: true,
      isSaving: false,
      success: false,
    },
    contractEmail: { data: null, content: '', isLoading: true, isSaving: false, success: false },
  });

  // Fetch data for each tab
  useEffect(() => {
    const fetchData = async () => {
      const fetchers = {
        terms: getTermsOfServiceTemplate,
        privacy: getPrivacyPolicyTemplate,
        receipt: getReceiptTemplate,
        confirmationEmail: getConfirmationEmailTemplate,
        contractEmail: getContractEmailTemplate,
      };

      try {
        const [termsData, privacyData, receiptData, confirmationEmailData, contractEmailData] =
          await Promise.all([
            fetchers.terms(),
            fetchers.privacy(),
            fetchers.receipt(),
            fetchers.confirmationEmail(),
            fetchers.contractEmail(),
          ]);

        setTabStates({
          terms: {
            data: termsData,
            content: termsData.content,
            isLoading: false,
            isSaving: false,
            success: false,
          },
          privacy: {
            data: privacyData,
            content: privacyData.content,
            isLoading: false,
            isSaving: false,
            success: false,
          },
          receipt: {
            data: receiptData,
            content: receiptData.content,
            isLoading: false,
            isSaving: false,
            success: false,
          },
          confirmationEmail: {
            data: confirmationEmailData,
            content: confirmationEmailData.content,
            isLoading: false,
            isSaving: false,
            success: false,
          },
          contractEmail: {
            data: contractEmailData,
            content: contractEmailData.content,
            isLoading: false,
            isSaving: false,
            success: false,
          },
        });

        setTabSubjects((prev) => ({
          ...prev,
          terms: termsData.subject,
          privacy: privacyData.subject,
          receipt: receiptData.subject,
          confirmationEmail: confirmationEmailData.subject,
          contractEmail: contractEmailData.subject,
        }));
      } catch (error_) {
        console.error('Failed to fetch data:', error_);
        setTabStates((prev) => ({
          terms: { ...prev.terms, isLoading: false },
          privacy: { ...prev.privacy, isLoading: false },
          receipt: { ...prev.receipt, isLoading: false },
          confirmationEmail: { ...prev.confirmationEmail, isLoading: false },
          contractEmail: { ...prev.contractEmail, isLoading: false },
        }));
        setTabSubjects((prev) => ({
          ...prev,
          terms: '',
          privacy: '',
          receipt: '',
          confirmationEmail: '',
          contractEmail: '',
        }));
      }
    };

    fetchData();
  }, []);

  const handleContentChange = (tab: TabValue, content: string) => {
    setTabStates((prev) => ({
      ...prev,
      [tab]: { ...prev[tab], content },
    }));
  };

  const handleSubjectChange = (tab: TabValue, subject: string) => {
    setTabSubjects((prev) => ({
      ...prev,
      [tab]: subject,
    }));
  };

  const handleSave = async (tab: TabValue) => {
    const updaters = {
      terms: saveTermsOfServiceTemplate,
      privacy: savePrivacyPolicyTemplate,
      receipt: saveReceiptTemplate,
      confirmationEmail: saveConfirmationEmailTemplate,
      contractEmail: saveContractEmailTemplate,
    };

    const fetchers = {
      terms: getTermsOfServiceTemplate,
      privacy: getPrivacyPolicyTemplate,
      receipt: getReceiptTemplate,
      confirmationEmail: getConfirmationEmailTemplate,
      contractEmail: getContractEmailTemplate,
    };

    try {
      setTabStates((prev) => ({
        ...prev,
        [tab]: { ...prev[tab], isSaving: true, success: false, subject: tabSubjects[tab] },
      }));

      const tabId = tabStates[tab].data?.id ?? '';
      if (!tabId) {
        throw new Error(`Template id is not found for ${tab}`);
      }

      await updaters[tab]({
        id: tabId,
        content: tabStates[tab].content,
        subject: tabSubjects[tab],
      });

      // Refetch the template to get updated version history
      const updatedData = await fetchers[tab]();

      setTabStates((prev) => ({
        ...prev,
        [tab]: {
          ...prev[tab],
          data: updatedData,
          content: updatedData.content,
          subject: updatedData.subject,
          isSaving: false,
          success: true,
        },
      }));

      // Hide success message after 1 seconds
      setTimeout(() => {
        {
          setTabStates((prev) => ({
            ...prev,
            [tab]: { ...prev[tab], success: false },
          }));
          // Reload the page
          window.location.reload();
        }
      }, 1000);
    } catch (error_) {
      console.error(`Failed to update ${tab}:`, error_);
      setTabStates((prev) => ({
        ...prev,
        [tab]: { ...prev[tab], isSaving: false },
      }));
    }
  };

  const renderTabPanel = (tab: TabValue, withSubject: boolean = false) => {
    const state = tabStates[tab];

    if (state.isLoading) {
      return (
        <Box style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <Loader />
        </Box>
      );
    }

    // Get the latest version from versionHistory (assuming first item is most recent)
    const latestVersion = state.data?.versionHistory?.[0];

    return (
      <Stack gap="md">
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
            {t(`admin.services.successMessage.${tab}`)}
          </Alert>
        )}

        {withSubject && (
          <TextInput
            size="sm"
            fw={500}
            label={t(`admin.services.editor.${tab}SubjectLabel`)}
            value={tabSubjects[tab]}
            onChange={(event) => handleSubjectChange(tab, event.currentTarget.value)}
          ></TextInput>
        )}

        <RichTextEditor
          content={state.content}
          onChange={(content) => handleContentChange(tab, content)}
          onSave={() => handleSave(tab)}
          isSaving={state.isSaving}
          label={t(`admin.services.editor.${tab}Label`)}
        />
      </Stack>
    );
  };

  // Sync hash with activeTab on hash changes (browser back/forward)
  useEffect(() => {
    const handleHashChange = () => {
      const newTab = getTabFromHash();
      setActiveTab(newTab);
    };

    // Listen for hash changes (browser back/forward navigation)
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

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
            const newTab = value as TabValue;
            setActiveTab(newTab);
            window.location.hash = newTab;
          }
        }}
      >
        <Tabs.List>
          <Tabs.Tab fw="bold" value="terms">
            {t('admin.services.tabs.terms')}
          </Tabs.Tab>
          <Tabs.Tab fw="bold" value="privacy">
            {t('admin.services.tabs.privacy')}
          </Tabs.Tab>
          <Tabs.Tab fw="bold" value="receipt">
            {t('admin.services.tabs.receipt')}
          </Tabs.Tab>
          <Tabs.Tab fw="bold" value="confirmationEmail">
            {t('admin.services.tabs.confirmationEmail')}
          </Tabs.Tab>
          <Tabs.Tab fw="bold" value="contractEmail">
            {t('admin.services.tabs.contractEmail')}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="terms" pt="lg">
          {renderTabPanel('terms')}
        </Tabs.Panel>

        <Tabs.Panel value="privacy" pt="lg">
          {renderTabPanel('privacy')}
        </Tabs.Panel>

        <Tabs.Panel value="receipt" pt="lg">
          {renderTabPanel('receipt')}
        </Tabs.Panel>

        <Tabs.Panel value="confirmationEmail" pt="lg">
          {renderTabPanel('confirmationEmail', true)}
        </Tabs.Panel>

        <Tabs.Panel value="contractEmail" pt="lg">
          {renderTabPanel('contractEmail', true)}
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
