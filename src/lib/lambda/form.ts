import type { PrizeClaimFormSubmission, PrizeClaimFormValues } from '@/types';
import { asyncDeduplicator } from '@/utils/dedupe';

import { validatePasswordV2 } from '@/utils/auth';
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
  password: string,
): Promise<PrizeClaimSubmitResponse> {
  if (!validatePasswordV2(password)) {
    throw new Error('Invalid password');
  }
  try {
    const response = await fetchLambda<{ form: { id: string } }>({
      path: 'forms',
      method: 'POST',
      body: {
        formContent: formData,
        password,
      },
    });

    localStorage.removeItem('__tournaments__');

    return {
      success: true,
      message: 'Prize claim submitted successfully',
      claimId: response.form.id,
      submittedAt: new Date().toISOString(),
    };
  } catch {
    return {
      success: false,
      message: 'Failed to submit prize claim',
    };
  }
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
  receipt?: {
    valid: boolean;
    issuedAt: number;
    url: string;
  };
  termsOfService?: {
    valid: boolean;
    issuedAt: number;
    url: string;
  };
}> {
  const response = await fetchLambda<{
    form: {
      id: string;
      formContent: PrizeClaimFormValues;
      receipt?: {
        valid: boolean;
        issuedAt: number;
        url: string;
      };
      createdAt?: string;
    };
  }>({
    path: `forms/${formId}?hash=${hash}`,
    method: 'GET',
  });
  return {
    formId: response.form.id,
    receipt: response.form.receipt,
    formData: {
      ...response.form.formContent,
      createdAt: response.form.createdAt,
    },
  };
}

type ReceiptUploadUrlResponse = {
  uploadUrl: string;
  s3Url: string;
  formId: string;
  expiresIn: number;
};

export async function getReceiptUploadUrl(
  formId: string,
  hash: string,
): Promise<ReceiptUploadUrlResponse> {
  const response = await fetchLambda<ReceiptUploadUrlResponse>({
    path: `forms/${formId}/receipt/upload-url?hash=${hash}&ext=pdf`,
    method: 'GET',
  });
  return {
    uploadUrl: response.uploadUrl,
    s3Url: response.s3Url,
    formId: response.formId,
    expiresIn: response.expiresIn,
  };
}

export async function saveReceiptUrl(formId: string, receiptUrl: string, hash: string) {
  await fetchLambda({
    path: `forms/${formId}/receipt`,
    method: 'POST',
    body: {
      hash,
      receiptUrl,
    },
  });
}

type TermsOfServiceUploadUrlResponse = {
  uploadUrl: string;
  s3Url: string;
  formId: string;
  expiresIn: number;
};

export async function getTermsOfServiceUploadUrl(
  formId: string,
  hash: string,
): Promise<TermsOfServiceUploadUrlResponse> {
  const response = await fetchLambda<TermsOfServiceUploadUrlResponse>({
    path: `forms/${formId}/terms-of-service/upload-url?hash=${hash}&ext=pdf`,
    method: 'GET',
  });
  return response;
}

export async function saveTermsOfServiceUrl(formId: string, tosUrl: string, hash: string) {
  await fetchLambda({
    path: `forms/${formId}/terms-of-service`,
    method: 'POST',
    body: {
      hash,
      tosUrl,
    },
  });
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
    path: `forms/${formId}/terms-agreement`,
    method: 'PATCH',
    body: {
      hash,
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

export async function deleteForm(formId: string) {
  await fetchLambda({
    path: `admin/forms/${formId}`,
    method: 'DELETE',
  });
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
