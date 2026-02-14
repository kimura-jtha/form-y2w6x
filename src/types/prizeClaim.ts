/**
 * Prize Claim Form Types
 */

/**
 * Prize claim form submission with admin metadata
 * Extends PrizeClaimFormValues with admin-specific fields
 */
export interface PrizeClaimFormSubmission {
  id: string;
  formContent: PrizeClaimFormValues;
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
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface PrizeClaimFormValues {
  // Name (Kanji)
  lastNameKanji: string;
  firstNameKanji: string;

  // Name (Kana)
  lastNameKana: string;
  firstNameKana: string;

  // Players+ ID or Passport Number
  playersId: string;

  // Contact Information
  postalCode: string;
  address: string;
  phoneNumber: string;
  email: string;

  // Tournament Information
  tournamentDate: string;
  tournamentId: string;
  tournamentName: string;
  rank: string;
  amount: number;

  isPoint?: boolean | undefined;

  // Bank Information
  bankCode: string;
  bankName: string;
  branchCode: string;
  branchName: string;
  accountType: AccountType;
  accountNumber: string;
  accountHolderName: string;

  // Privacy Policy Agreement
  privacyAgreed: boolean;

  // Terms of Service Agreement (optional, added after form submission)
  termsAgreed?: boolean;

  createdAt?: string;
}

export type AccountType = 'savings' | 'checking';

// Zengin bank data structure (from zengin-code)
export interface ZenginBank {
  code: string;
  name: string;
  kana: string;
  hira: string;
  roma: string;
}

export interface ZenginBranch {
  code: string;
  name: string;
  kana: string;
  hira: string;
  roma: string;
}

export type ZenginBankMap = Record<string, ZenginBank>;
export type ZenginBranchMap = Record<string, ZenginBranch>;

// Simplified types for form usage
export interface Bank {
  code: string;
  name: string;
  kana: string;
}

export interface Branch {
  code: string;
  name: string;
  kana: string;
}

/**
 * Prize rank structure
 */
export interface PrizeRank {
  rank: string; // e.g., "1", "2", "3", "優勝", "準優勝"
  amount: number; // Prize amount in yen
}

/**
 * Tournament status
 */
export type TournamentStatus = 'active' | 'inactive';

/**
 * Complete tournament entity
 */
export interface Tournament {
  id: string;

  // Event information (multilingual)
  eventName: string; // English: "P1 Circuit OSAKA"
  eventNameJa: string; // Japanese: "P1 サーキット OSAKA"

  // Tournament information (multilingual)
  tournamentName: string; // English: "#1 Kickoff"
  tournamentNameJa: string; // Japanese: "#1  キックオフ"

  // Date and status
  date: string; // ISO 8601 date string (YYYY-MM-DD)
  status: TournamentStatus;

  // Prize structure
  prizes: PrizeRank[];

  // Claimed ranks and emails (for form validation)
  claimedRanks?: string[];
  claimedEmails?: string[];

  // Metadata
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
}

export interface ZipCloudResponse {
  status: number;
  message: string | null;
  results: ZipCloudResult[] | null;
}

export interface ZipCloudResult {
  zipcode: string;
  prefcode: string;
  address1: string;
  address2: string;
  address3: string;
  kana1: string;
  kana2: string;
  kana3: string;
}

// Initial form values
export const initialPrizeClaimFormValues: PrizeClaimFormValues = {
  lastNameKanji: '',
  firstNameKanji: '',
  lastNameKana: '',
  firstNameKana: '',
  playersId: '',
  postalCode: '',
  address: '',
  phoneNumber: '',
  email: '',
  tournamentDate: '',
  tournamentId: '',
  tournamentName: '',
  rank: '',
  amount: 0,
  isPoint: false,
  bankCode: '',
  bankName: '',
  branchCode: '',
  branchName: '',
  accountType: 'savings',
  accountNumber: '',
  accountHolderName: '',
  privacyAgreed: false,
};
