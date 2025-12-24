import type { ZipCloudResponse, ZipCloudResult } from '@/types';

import { asyncDeduplicator } from '../../utils/dedupe';

const ZIPCLOUD_API_URL = 'https://zipcloud.ibsnet.co.jp/api/search';

export interface AddressSearchResult {
  success: true;
  address: string;
  result?: ZipCloudResult;
}

export interface AddressSearchError {
  success: false;
  error: 'invalid_postal_code' | 'not_found' | 'network_error';
}

export type AddressSearchResponse = AddressSearchResult | AddressSearchError;

/**
 * Search address by postal code using ZipCloud API
 * @param postalCode - 7-digit postal code (e.g., "7830060")
 * @returns Address search result or error
 */
export async function searchAddressByPostalCode(
  postalCode: string,
): Promise<AddressSearchResponse> {
  const key = `zipcloud_${postalCode}`;
  const address = localStorage.getItem(key);
  if (address) {
    if (address === 'not_found') {
      return { success: false, error: 'not_found' };
    }
    return { success: true, address };
  }

  // Validate postal code format
  if (!/^\d{7}$/.test(postalCode)) {
    return { success: false, error: 'invalid_postal_code' };
  }

  try {
    const data = await asyncDeduplicator.call('zipcloud', async () => {
      const response = await fetch(`${ZIPCLOUD_API_URL}?zipcode=${postalCode}`);
      const data: ZipCloudResponse = await response.json();
      return data;
    });

    if (data.status === 200 && data.results && data.results.length > 0) {
      const result = data.results[0];
      if (!result) {
        localStorage.setItem(key, 'not_found');
        return { success: false, error: 'not_found' };
      }
      const address = `${result.address1}${result.address2}${result.address3}`;
      if (address) {
        localStorage.setItem(key, address);
      }
      return { success: true, address, result };
    }

    return { success: false, error: 'not_found' };
  } catch {
    return { success: false, error: 'network_error' };
  }
}
