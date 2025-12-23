import type { PrizeClaimFormSubmission, PrizeClaimFormValues } from '@/types';
import { asyncDeduplicator } from '@/utils/dedupe';

import { fetchLambda } from './_helper';

/**
 * Response from prize claim form submission
 */
export interface PrizeClaimSubmitResponse {
  success: boolean;
  message: string;
  claimId?: string;
  submittedAt?: string;
}

/**
 * Submit prize claim form data to the database
 * @param formData - Prize claim form values
 * @returns Promise<PrizeClaimSubmitResponse> - Submission result
 */
export async function submitPrizeClaimForm(
  formData: PrizeClaimFormValues,
): Promise<PrizeClaimSubmitResponse> {
  const response = await fetchLambda<{ form: { id: string } }>({
    path: 'forms',
    method: 'POST',
    body: {
      formContent: formData,
    },
  });

  return {
    success: true,
    message: 'Prize claim submitted successfully',
    claimId: response.form.id,
    submittedAt: new Date().toISOString(),
  };
}

/**
 * Get form by ID
 * @param formId - Form ID
 * @param hash - Hash
 * @returns Promise<{ formId: string; formData: PrizeClaimFormValues }> - Form data
 */
export async function getFormById(
  formId: string,
  hash: string,
): Promise<{
  formId: string;
  formData: PrizeClaimFormValues;
}> {
  const response = await fetchLambda<{
    form: {
      id: string;
      formContent: PrizeClaimFormValues;
    };
  }>({
    path: `forms/${formId}?hash=${hash}`,
    method: 'GET',
  });
  return {
    formId: response.form.id,
    formData: response.form.formContent,
  };
}

/**
 * Agree to terms of service
 * @param formId - Form ID
 * @param hash - Hash
 * @returns Promise<{ success: boolean; message: string }> - Agreement result
 */
export async function agreeTermsOfService(
  formId: string,
  hash: string,
): Promise<{ success: boolean; message: string }> {
  const response = await fetchLambda<{ form: { id: string } }>({
    path: `forms/${formId}/terms-agreement?hash=${hash}`,
    method: 'PATCH',
    body: {
      termsAgreed: true,
    },
  });
  if (response?.form?.id) {
    return {
      success: true,
      message: 'Terms of service agreed successfully',
    };
  }
  throw new Error('Failed to agree terms of service');
}

/**
 * Get forms
 * @param cursor - Cursor
 * @param limit - Limit
 * @param tournamentId - Tournament ID filter
 * @param dateFrom - Start date filter (ISO 8601 string)
 * @param dateTo - End date filter (ISO 8601 string)
 * @returns Promise<{ forms: PrizeClaimFormSubmission[]; pagination: { total, hasMore, nextCursor } }> - Forms with pagination
 */
export async function getForms(
  cursor?: string,
  limit?: number,
  tournamentId?: string,
  dateFrom?: string,
  dateTo?: string,
): Promise<{
  forms: PrizeClaimFormSubmission[];
  pagination: {
    total: number;
    hasMore: boolean;
    nextCursor: string;
  };
}> {
  return asyncDeduplicator.call(
    `getForms:${cursor || ''}:${limit || 100}:${tournamentId || ''}:${dateFrom || ''}:${dateTo || ''}`,
    async () => {
      let path = `admin/forms?limit=${limit || 20}`;
      if (cursor) {
        path += `&cursor=${cursor}`;
      }
      if (tournamentId) {
        path += `&tournamentId=${tournamentId}`;
      }
      if (dateFrom) {
        path += `&dateFrom=${dateFrom}`;
      }
      if (dateTo) {
        path += `&dateTo=${dateTo}`;
      }
      const response = await fetchLambda<{
        items: PrizeClaimFormSubmission[];
        pagination: {
          total: number;
          hasMore: boolean;
          nextCursor: string;
        };
      }>({
        path,
        method: 'GET',
      });
      return {
        forms: response.items.map((item) => ({
          ...item,
          formContent: item.formContent as PrizeClaimFormValues,
        })),
        pagination: response.pagination,
      };
    },
  );
}
