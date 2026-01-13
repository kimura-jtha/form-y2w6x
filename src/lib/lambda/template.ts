import type { Template } from '@/types/template';
import { getUserName } from '@/utils/auth';
import { asyncDeduplicator } from '@/utils/dedupe';

import { fetchLambda } from './_helper';

const cache = new Map<string, Template>();

export async function savePrivacyPolicyTemplate({
  id,
  content,
}: {
  id: string;
  content: string;
  subject?: string;
}): Promise<void> {
  return _saveTemplate(id, 'Privacy Policy', content);
}

export async function saveTermsOfServiceTemplate({
  id,
  content,
}: {
  id: string;
  content: string;
  subject?: string;
}): Promise<void> {
  return _saveTemplate(id, 'Terms of Service', content);
}

export async function saveReceiptTemplate({
  id,
  content,
}: {
  id: string;
  content: string;
  subject?: string;
}): Promise<void> {
  return _saveTemplate(id, 'Receipt', content);
}

export async function saveConfirmationEmailTemplate({
  id,
  content,
  subject,
}: {
  id: string;
  content: string;
  subject?: string;
}): Promise<void> {
  return _saveTemplate(id, subject ?? 'Confirmation Email', content);
}

export async function saveContractEmailTemplate({
  id,
  content,
  subject,
}: {
  id: string;
  content: string;
  subject?: string;
}): Promise<void> {
  return _saveTemplate(id, subject ?? 'Contract Email', content);
}

export async function getContractEmailTemplate(lang = 'ja'): Promise<Template> {
  return _getTemplate(`contract-email-${lang}`);
}

export async function getConfirmationEmailTemplate(lang = 'ja'): Promise<Template> {
  return _getTemplate(`confirmation-email-${lang}`);
}

export async function getPrivacyPolicyTemplate(lang = 'ja'): Promise<Template> {
  return _getTemplate(`privacy-policy-${lang}`);
}

export async function getTermsOfServiceTemplate(lang = 'ja'): Promise<Template> {
  return _getTemplate(`terms-of-service-${lang}`);
}

export async function getReceiptTemplate(lang = 'ja'): Promise<Template> {
  return _getTemplate(`receipt-${lang}`);
}

async function _saveTemplate(id: string, subject: string, html: string): Promise<void> {
  await fetchLambda({
    path: `admin/templates/${id}`,
    method: 'PUT',
    body: {
      updatedBy: getUserName(),
      isDraft: false,
      content: JSON.stringify({
        subject: subject,
        html,
        // TODO: strip html tags and get text content with new line separator
        text: '',
      }),
    },
  });
}

function _getTemplate(key: string): Promise<Template> {
  return asyncDeduplicator.call(`getTemplate:${key}`, async () => {
    const cached = cache.get(key);
    if (cached) {
      return cached as Template;
    }

    const response = await fetchLambda<{
      template: {
        id: string;
        subject: string;
        content: string;
        versionHistory: {
          version: string;
          publishedAt: string;
          publishedBy: string;
        }[];
      };
    }>({
      path: `templates/key/${key}`,
      method: 'GET',
    });
    const content = JSON.parse(response.template.content);
    const template: Template = {
      id: response.template.id,
      subject: content.subject,
      content: content.html,
      versionHistory: response.template.versionHistory,
    };
    cache.set(key, template);
    return template;
  });
}
