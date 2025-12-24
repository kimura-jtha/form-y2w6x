import { env } from '@/config/env';
import type { PrizeClaimFormSubmission, PrizeRank, Tournament, TournamentStatus } from '@/types';

import { asyncDeduplicator } from '../../utils/dedupe';

import { fetchLambda } from './_helper';

type ApiTournament = {
  id: string;
  eventName: string;
  eventNameJa: string;
  tournamentName: string;
  tournamentNameJa: string;
  date: string;
  status: TournamentStatus;
  prizes: PrizeRank[];
  createdAt: string;
  updatedAt: string;
};

/**
 * Fetch all active tournaments from the database
 * @returns Promise<Tournament[]> - List of all active tournaments
 */
export async function fetchActiveTournaments(): Promise<Tournament[]> {
  const rawData = localStorage.getItem('__tournaments__');
  if (rawData) {
    const { tournaments, expiresAt } = JSON.parse(rawData) as {
      tournaments: Tournament[];
      expiresAt: number;
    };
    if (expiresAt > Date.now()) {
      return tournaments;
    }
    localStorage.removeItem('__tournaments__');
  }
  const tournaments = await asyncDeduplicator.call('fetchActiveTournaments', async () => {
    const response = await fetchLambda<{
      tournaments: ApiTournament[];
    }>({
      path: 'tournaments',
      method: 'GET',
    });

    const tournaments = response.tournaments.map(convertApiTournamentToTournament);
    return tournaments;
  });

  // Cache for 1 hours in production, 10 seconds in development
  const DURATION_IN_MS = env.IS_PROD ? 1000 * 60 * 60 : 1000 * 10;
  localStorage.setItem(
    '__tournaments__',
    JSON.stringify({
      tournaments,
      // Cache for 1 hours
      expiresAt: Date.now() + DURATION_IN_MS,
    }),
  );
  return tournaments;
}

/**
 * Fetch all tournaments from the database
 * @returns Promise<Tournament[]> - List of all tournaments
 */
export async function fetchAllTournaments(): Promise<Tournament[]> {
  return asyncDeduplicator.call('fetchAllTournaments', async () => {
    const response = await fetchLambda<{
      tournaments: ApiTournament[];
    }>({
      path: 'admin/tournaments',
      method: 'GET',
    });
    return response.tournaments.map(convertApiTournamentToTournament);
  });
}

/**
 * Create a new tournament
 * @param tournament - Tournament data to create (without id, createdAt, updatedAt)
 * @returns Promise<Tournament> - Created tournament
 */
export async function createTournament(
  tournament: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Tournament> {
  localStorage.removeItem('__tournaments__');
  const response = await fetchLambda<{
    tournament: ApiTournament;
  }>({
    path: 'admin/tournaments',
    method: 'POST',
    body: {
      eventName: tournament.eventName,
      eventNameJa: tournament.eventNameJa,
      tournamentName: tournament.tournamentName,
      tournamentNameJa: tournament.tournamentNameJa,
      date: tournament.date,
      status: tournament.status,
      prizes: tournament.prizes,
    } satisfies Omit<ApiTournament, 'id' | 'createdAt' | 'updatedAt'>,
  });
  return convertApiTournamentToTournament(response.tournament);
}

/**
 * Update a tournament
 * @param tournament - Tournament to update
 * @returns Promise<Tournament> - Updated tournament
 */
export async function updateTournament(tournament: Tournament): Promise<Tournament> {
  localStorage.removeItem('__tournaments__');
  const response = await fetchLambda<{
    tournament: ApiTournament;
  }>({
    path: `admin/tournaments/${tournament.id}`,
    method: 'PUT',
    body: {
      eventName: tournament.eventName,
      eventNameJa: tournament.eventNameJa,
      tournamentName: tournament.tournamentName,
      tournamentNameJa: tournament.tournamentNameJa,
      date: tournament.date,
      status: tournament.status,
      prizes: tournament.prizes,
    } satisfies Omit<ApiTournament, 'id' | 'createdAt' | 'updatedAt'>,
  });
  return convertApiTournamentToTournament(response.tournament);
}

/**
 * Toggle the status of a tournament
 * @param tournament - Tournament to toggle
 * @returns Promise<Tournament> - Toggled tournament
 */
export async function toggleTournamentStatus(tournament: Tournament): Promise<Tournament> {
  localStorage.removeItem('__tournaments__');
  await updateTournament(tournament);
  const response = await fetchLambda<{
    tournament: ApiTournament;
  }>({
    path: `admin/tournaments/${tournament.id}`,
    method: 'PUT',
    body: {
      status: tournament.status === 'active' ? 'inactive' : 'active',
    },
  });
  return convertApiTournamentToTournament(response.tournament);
}

/**
 * Fetch a single tournament by ID (public - active tournaments only)
 * @param id - Tournament ID
 * @returns Promise<Tournament | null> - Tournament or null if not found
 */
export async function fetchTournamentById(id: string): Promise<Tournament | null> {
  const tournaments = await fetchActiveTournaments();

  return tournaments.find((t) => t.id === id) ?? null;
}

/**
 * Fetch a single tournament by ID (admin - includes inactive tournaments)
 * @param id - Tournament ID
 * @returns Promise<Tournament | null> - Tournament or null if not found
 */
export async function fetchTournamentByIdAdmin(id: string): Promise<Tournament | null> {
  return asyncDeduplicator.call(`fetchTournamentByIdAdmin:${id}`, async () => {
    try {
      const response = await fetchLambda<{
        tournament: ApiTournament;
      }>({
        path: `admin/tournaments/${id}`,
        method: 'GET',
      });
      return convertApiTournamentToTournament(response.tournament);
    } catch (error) {
      console.error('Failed to fetch tournament by ID:', error);
      return null;
    }
  });
}

/**
 * Get available tournament dates
 * @returns Promise<string[]> - Sorted list of unique tournament dates
 */
export async function fetchTournamentDates(): Promise<string[]> {
  const tournaments = await fetchActiveTournaments();
  return [...new Set(tournaments.map((t) => t.date))].sort();
}

/**
 * Get tournaments by date
 * @param date - Tournament date in YYYY-MM-DD format
 * @returns Promise<Tournament[]> - Tournaments on the specified date
 */
export async function fetchTournamentsByDate(date: string): Promise<Tournament[]> {
  const tournaments = await fetchActiveTournaments();
  return tournaments.filter((t) => t.date === date);
}

function convertApiTournamentToTournament(apiTournament: ApiTournament): Tournament {
  return {
    id: apiTournament.id,
    eventName: apiTournament.eventName,
    eventNameJa: apiTournament.eventNameJa,
    tournamentName: apiTournament.tournamentName,
    tournamentNameJa: apiTournament.tournamentNameJa,
    date: apiTournament.date,
    status: apiTournament.status,
    prizes: apiTournament.prizes,
    createdAt: apiTournament.createdAt,
    updatedAt: apiTournament.updatedAt,
  };
}

/**
 * Fetch forms by tournament ID
 * @param tournamentId - Tournament ID
 * @param cursor - Cursor for pagination
 * @param limit - Limit for pagination
 * @returns Promise<{ forms: PrizeClaimFormSubmission[]; pagination: { total, hasMore, nextCursor } }> - Forms with pagination
 */
export async function fetchFormsByTournament(
  tournamentId: string,
  cursor?: string,
  limit?: number,
): Promise<{
  forms: PrizeClaimFormSubmission[];
  pagination: {
    total: number;
    hasMore: boolean;
    nextCursor: string;
  };
}> {
  return asyncDeduplicator.call(
    `fetchFormsByTournament:${tournamentId}:${cursor || ''}:${limit || 20}`,
    async () => {
      let path = `admin/tournaments/${tournamentId}/forms?limit=${limit || 20}`;
      if (cursor) {
        path += `&cursor=${cursor}`;
      }

      const response = await fetchLambda<{
        forms: Array<{
          id: string;
          formContent: {
            lastNameKanji: string;
            firstNameKanji: string;
            lastNameKana: string;
            firstNameKana: string;
            playersId: string;
            postalCode: string;
            address: string;
            phoneNumber: string;
            email: string;
            tournamentDate: string;
            tournamentId: string;
            tournamentName: string;
            rank: string;
            amount: number;
            bankCode: string;
            bankName: string;
            branchCode: string;
            branchName: string;
            accountType: 'savings' | 'checking';
            accountNumber: string;
            accountHolderName: string;
            privacyAgreed: boolean;
            termsAgreed?: boolean;
          };
          createdAt: string;
          status: 'pending' | 'approved' | 'rejected';
        }>;
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
        forms: response.forms,
        pagination: response.pagination,
      };
    },
  );
}
