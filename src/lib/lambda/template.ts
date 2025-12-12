import type { Template } from '@/types/template';
import { getUserName } from '@/utils/auth';
import { asyncDeduplicator } from '@/utils/dedupe';

import { fetchLambda } from './_helper';

const cache = new Map<string, Template>();

export async function savePrivacyPolicyTemplate(id: string, content: string): Promise<void> {
  return _saveTemplate(id, content);
}

export async function saveTermsOfServiceTemplate(id: string, content: string): Promise<void> {
  return _saveTemplate(id, content);
}

export async function saveContractTemplate(id: string, content: string): Promise<void> {
  return _saveTemplate(id, content);
}

export async function saveReceiptTemplate(id: string, content: string): Promise<void> {
  return _saveTemplate(id, content);
}

export async function getPrivacyPolicyTemplate(): Promise<Template> {
  return _getTemplate('privacy-policy-ja');
}

export async function getTermsOfServiceTemplate(): Promise<Template> {
  return _getTemplate('terms-of-service-ja');
}

export async function getContractTemplate(): Promise<Template> {
  return _getTemplate('contract-ja');
}

export async function getReceiptTemplate(): Promise<Template> {
  return _getTemplate('receipt-ja');
}

function _extractBodyContent(content: string): string {
  const body = content.match(/<body[^>]*>(.|\n)*<\/body>/g);
  // extract only content inside body
  if (body) {
    return body[0]
      .replace(/<body[^>]*>/, '')
      .replace(/<\/body>/, '')
      .trim();
  }
  return '';
}

function _generateHtmlTemplate(content: string): string {
  return `<!DOCTYPE html>
<html>

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>

<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
${content}
</body>

</html>`;
}

async function _saveTemplate(id: string, content: string): Promise<void> {
  const html = _generateHtmlTemplate(content);
  await fetchLambda({
    path: `admin/templates/${id}`,
    method: 'PUT',
    body: {
      updatedBy: getUserName(),
      isDraft: false,
      content: JSON.stringify({
        html: html,
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
      content: _extractBodyContent(content.html),
      versionHistory: response.template.versionHistory,
    };
    cache.set(key, template);
    return template;
  });
}
