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

export type ContractType = 'sponsor' | 'pro';

/**
 * Bases that carry the contract-type (sponsor/pro) dimension (Phase 5 / FX-1).
 */
export type ContractScopedBase = 'privacy-policy' | 'terms-of-service' | 'contract';

/**
 * Build the storage key for a contract-type-scoped document.
 *
 * Key scheme:
 *   sponsor / undefined -> `{base}-{lang}`      (existing base template)
 *   pro                 -> `{base}-pro-{lang}`  (additive override)
 */
export function buildContractScopedKey(
  base: ContractScopedBase,
  lang: string,
  contractType: ContractType,
): string {
  return contractType === 'pro' ? `${base}-pro-${lang}` : `${base}-${lang}`;
}

/**
 * Resolve a contract-type-scoped template (privacy-policy / terms-of-service /
 * contract) honouring the contract-type dimension (Phase 5).
 *
 * For `pro` the pro-specific override is tried first and falls back to the base
 * (sponsor) template when the override does not exist yet. This is the
 * *display-side* behaviour so forms never show a blank document.
 */
async function _getContractScopedTemplate(
  base: string,
  lang: string,
  contractType: ContractType,
): Promise<Template> {
  if (contractType === 'pro') {
    try {
      return await _getTemplate(`${base}-pro-${lang}`);
    } catch {
      // No pro-specific override yet: fall back to the base template.
    }
  }
  return _getTemplate(`${base}-${lang}`);
}

export async function getPrivacyPolicyTemplate(
  lang = 'ja',
  contractType: ContractType = 'sponsor',
): Promise<Template> {
  return _getContractScopedTemplate('privacy-policy', lang, contractType);
}

export async function getTermsOfServiceTemplate(
  lang = 'ja',
  contractType: ContractType = 'sponsor',
): Promise<Template> {
  return _getContractScopedTemplate('terms-of-service', lang, contractType);
}

/**
 * Resolve the contract (契約書) document honouring the contract-type dimension,
 * with sponsor fallback for `pro`. Used for display/parity with the backend.
 */
export async function getContractTemplate(
  lang = 'ja',
  contractType: ContractType = 'sponsor',
): Promise<Template> {
  return _getContractScopedTemplate('contract', lang, contractType);
}

export async function getReceiptTemplate(lang = 'ja'): Promise<Template> {
  return _getTemplate(`receipt-${lang}`);
}

// ---------------------------------------------------------------------------
// Admin helpers (ServiceManagement)
//
// Editing must target the EXACT storage key (no sponsor fallback) so that a
// pro-specific override can be created and edited independently. Saving upserts:
// it creates the template by business key when it does not exist yet, otherwise
// it publishes a new version of the existing template.
// ---------------------------------------------------------------------------

/**
 * Fetch a template by its exact key for admin editing. Returns `null` when the
 * template has not been created yet (e.g. a pro override that is still absent),
 * instead of throwing, so the editor can start blank / create-on-save.
 */
export async function getTemplateByKeyForAdmin(key: string): Promise<Template | null> {
  try {
    return await _getTemplate(key);
  } catch {
    return null;
  }
}

/**
 * Create a template by its business key (admin only). Backing endpoint added in
 * Phase 5 (POST /admin/templates).
 */
async function _createTemplate(key: string, subject: string, html: string): Promise<void> {
  await fetchLambda({
    path: 'admin/templates',
    method: 'POST',
    body: {
      key,
      updatedBy: getUserName(),
      content: JSON.stringify({
        subject,
        html,
        text: '',
      }),
    },
  });
}

/**
 * Upsert a template by key: create it when it does not exist yet (no `id`),
 * otherwise publish a new version of the existing template.
 */
export async function saveTemplateByKey({
  key,
  id,
  subject,
  content,
}: {
  key: string;
  id?: string;
  subject: string;
  content: string;
}): Promise<void> {
  if (id) {
    return _saveTemplate(id, subject, content);
  }
  await _createTemplate(key, subject, content);
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
