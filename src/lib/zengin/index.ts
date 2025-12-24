import type { Bank, Branch, ZenginBankMap, ZenginBranchMap } from '@/types';

import { asyncDeduplicator } from '../../utils/dedupe';

const BANKS_BASE_URL = '/banks';

// Cache for loaded data
let banksCache: Bank[] | null = null;
const branchesCache: Map<string, Branch[]> = new Map();

/**
 * Fetch all banks from the pre-built JSON file
 */
export async function fetchBanks(): Promise<Bank[]> {
  if (banksCache) {
    return banksCache;
  }

  return asyncDeduplicator.call('zengin:fetchBanks', async () => {
    const response = await fetch(`${BANKS_BASE_URL}/all-banks.json`);
    const data: ZenginBankMap = await response.json();
    banksCache = Object.values(data).map((bank) => ({
      code: bank.code,
      name: bank.name,
      kana: bank.kana,
    }));
    return banksCache;
  });
}

/**
 * Fetch branches for a specific bank
 */
export async function fetchBranches(bankCode: string): Promise<Branch[]> {
  const cached = branchesCache.get(bankCode);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(`${BANKS_BASE_URL}/branches/${bankCode}.json`);
    if (!response.ok) {
      return [];
    }

    const data: ZenginBranchMap = await response.json();

    const branches = Object.values(data).map((branch) => ({
      code: branch.code,
      name: branch.name,
      kana: branch.kana,
    }));

    branchesCache.set(bankCode, branches);
    return branches;
  } catch {
    return [];
  }
}

/**
 * Search banks by query (name, kana, or code)
 */
export function filterBanks(banks: Bank[], query: string): Bank[] {
  if (!query) return banks;

  const normalizedQuery = query.toLowerCase();
  return banks.filter(
    (bank) =>
      bank.name.toLowerCase().includes(normalizedQuery) ||
      bank.kana.toLowerCase().includes(normalizedQuery) ||
      bank.code.includes(query),
  );
}

/**
 * Search branches by query (name, kana, or code)
 */
export function filterBranches(branches: Branch[], query: string): Branch[] {
  if (!query) return branches;

  const normalizedQuery = query.toLowerCase();
  return branches.filter(
    (branch) =>
      branch.name.toLowerCase().includes(normalizedQuery) ||
      branch.kana.toLowerCase().includes(normalizedQuery) ||
      branch.code.includes(query),
  );
}

/**
 * Clear the cache (useful for testing or refresh)
 */
export function clearZenginCache(): void {
  banksCache = null;
  branchesCache.clear();
}
