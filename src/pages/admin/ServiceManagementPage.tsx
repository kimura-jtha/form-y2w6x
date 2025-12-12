import { useEffect, useState } from 'react';

import { Alert, Box, Group, Loader, Paper, Stack, Tabs, Text, Title } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import { RichTextEditor } from '@/components/RichTextEditor';
import {
  getContractTemplate,
  getPrivacyPolicyTemplate,
  getReceiptTemplate,
  getTermsOfServiceTemplate,
  saveContractTemplate,
  savePrivacyPolicyTemplate,
  saveReceiptTemplate,
  saveTermsOfServiceTemplate,
} from '@/lib/lambda/template';
import type { Template } from '@/types/template';

type TabValue = 'terms' | 'privacy' | 'contract' | 'receipt';

interface TabState {
  data: Template | null;
  content: string;
  isLoading: boolean;
  isSaving: boolean;
  success: boolean;
}

export function ServiceManagementPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabValue>('terms');

  const [tabStates, setTabStates] = useState<Record<TabValue, TabState>>({
    terms: { data: null, content: '', isLoading: true, isSaving: false, success: false },
    privacy: { data: null, content: '', isLoading: true, isSaving: false, success: false },
    contract: { data: null, content: '', isLoading: true, isSaving: false, success: false },
    receipt: { data: null, content: '', isLoading: true, isSaving: false, success: false },
  });

  // Fetch data for each tab
  useEffect(() => {
    const fetchData = async () => {
      const fetchers = {
        terms: getTermsOfServiceTemplate,
        privacy: getPrivacyPolicyTemplate,
        contract: getContractTemplate,
        receipt: getReceiptTemplate,
      };

      try {
        const [termsData, privacyData, contractData, receiptData] = await Promise.all([
          fetchers.terms(),
          fetchers.privacy(),
          fetchers.contract(),
          fetchers.receipt(),
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
          contract: {
            data: contractData,
            content: contractData.content,
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
        });
      } catch (error_) {
        console.error('Failed to fetch data:', error_);
        setTabStates((prev) => ({
          terms: { ...prev.terms, isLoading: false },
          privacy: { ...prev.privacy, isLoading: false },
          contract: { ...prev.contract, isLoading: false },
          receipt: { ...prev.receipt, isLoading: false },
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

  const handleSave = async (tab: TabValue) => {
    const updaters = {
      terms: saveTermsOfServiceTemplate,
      privacy: savePrivacyPolicyTemplate,
      contract: saveContractTemplate,
      receipt: saveReceiptTemplate,
    };

    const fetchers = {
      terms: getTermsOfServiceTemplate,
      privacy: getPrivacyPolicyTemplate,
      contract: getContractTemplate,
      receipt: getReceiptTemplate,
    };

    try {
      setTabStates((prev) => ({
        ...prev,
        [tab]: { ...prev[tab], isSaving: true, success: false },
      }));

      const tabId = tabStates[tab].data?.id ?? '';
      if (!tabId) {
        throw new Error(`Template id is not found for ${tab}`);
      }

      await updaters[tab](tabId, tabStates[tab].content);

      // Refetch the template to get updated version history
      const updatedData = await fetchers[tab]();

      setTabStates((prev) => ({
        ...prev,
        [tab]: {
          ...prev[tab],
          data: updatedData,
          content: updatedData.content,
          isSaving: false,
          success: true,
        },
      }));

      // Hide success message after 3 seconds
      setTimeout(() => {
        setTabStates((prev) => ({
          ...prev,
          [tab]: { ...prev[tab], success: false },
        }));
      }, 3000);
    } catch (error_) {
      console.error(`Failed to update ${tab}:`, error_);
      setTabStates((prev) => ({
        ...prev,
        [tab]: { ...prev[tab], isSaving: false },
      }));
    }
  };

  const renderTabPanel = (tab: TabValue) => {
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

  return (
    <Stack gap="lg">
      <Title order={2}>{t('admin.services.title')}</Title>

      <Tabs value={activeTab} onChange={(value) => setActiveTab(value as TabValue)}>
        <Tabs.List>
          <Tabs.Tab fw="bold" value="terms">
            {t('admin.services.tabs.terms')}
          </Tabs.Tab>
          <Tabs.Tab fw="bold" value="privacy">
            {t('admin.services.tabs.privacy')}
          </Tabs.Tab>
          <Tabs.Tab fw="bold" value="contract">
            {t('admin.services.tabs.contract')}
          </Tabs.Tab>
          <Tabs.Tab fw="bold" value="receipt">
            {t('admin.services.tabs.receipt')}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="terms" pt="lg">
          {renderTabPanel('terms')}
        </Tabs.Panel>

        <Tabs.Panel value="privacy" pt="lg">
          {renderTabPanel('privacy')}
        </Tabs.Panel>

        <Tabs.Panel value="contract" pt="lg">
          {renderTabPanel('contract')}
        </Tabs.Panel>

        <Tabs.Panel value="receipt" pt="lg">
          {renderTabPanel('receipt')}
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
