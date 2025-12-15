/**
 * Admin API Module
 * Mock implementations for admin operations
 */

import type { PrizeClaimFormSubmission, PrizeClaimFormValues } from '@/types';

export interface FormFilters {
  tournamentName?: string;
  status?: string;
  termsAgreed?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

export interface Tournament {
  id: string;
  name: string;
  date: string;
  location: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  participantCount: number;
  createdAt: string;
}

export interface CreateTournamentInput {
  name: string;
  date: string;
  location: string;
}

export interface ServiceContent {
  id: string;
  type: 'terms' | 'privacy' | 'contract' | 'receipt';
  content: string;
  version: string;
  updatedAt: string;
  updatedBy: string;
}

// Mock data generator
const generateMockForms = (): PrizeClaimFormSubmission[] => {
  const tournaments = [
    { id: 'tournament_1', name: 'Spring Championship 2024', date: '2024-03-15' },
    { id: 'tournament_2', name: 'Summer Grand Prix', date: '2024-06-20' },
    { id: 'tournament_3', name: 'Autumn Classic', date: '2024-09-10' },
  ];
  const statuses: Array<'pending' | 'approved' | 'rejected'> = ['pending', 'approved', 'rejected'];
  const forms: PrizeClaimFormSubmission[] = [];

  for (let i = 1; i <= 25; i++) {
    const tournament = tournaments[i % tournaments.length];
    forms.push({
      id: `form_${i}_${Math.random().toString(36).slice(2, 9)}`,
      formContent: {
        lastNameKanji: '山田',
        firstNameKanji: `太郎${i}`,
        lastNameKana: 'ヤマダ',
        firstNameKana: `タロウ${i}`,
        playersId: `P${String(i).padStart(9, '0')}`,
        postalCode: '1000001',
        address: '東京都千代田区千代田1-1',
        phoneNumber: '090-1234-5678',
        email: `user${i}@example.com`,
        tournamentDate: tournament.date,
        tournamentId: tournament.id,
        tournamentName: tournament.name,
        rank: `${(i % 10) + 1}`,
        amount: ((i % 5) + 1) * 50000,
        bankCode: '0001',
        bankName: 'みずほ',
        branchCode: '105',
        branchName: '小舟町',
        accountType: 'savings' as const,
        accountNumber: '1234567',
        accountHolderName: `ヤマダタロウ${i}`,
        privacyAgreed: true,
        termsAgreed: Math.random() > 0.3,
      },
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: statuses[i % statuses.length],
    });
  }

  return forms.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

const generateMockTournaments = (): Tournament[] => {
  return [
    {
      id: 'tournament_1',
      name: 'Spring Championship 2024',
      date: '2024-03-15',
      location: 'Tokyo Dome',
      status: 'completed',
      participantCount: 128,
      createdAt: '2024-01-10T00:00:00Z',
    },
    {
      id: 'tournament_2',
      name: 'Summer Grand Prix',
      date: '2024-06-20',
      location: 'Osaka Arena',
      status: 'upcoming',
      participantCount: 256,
      createdAt: '2024-02-15T00:00:00Z',
    },
    {
      id: 'tournament_3',
      name: 'Autumn Classic',
      date: '2024-09-10',
      location: 'Yokohama Stadium',
      status: 'upcoming',
      participantCount: 64,
      createdAt: '2024-03-20T00:00:00Z',
    },
  ];
};

/**
 * Get list of forms with optional filters
 */
export async function getFormsList(filters?: FormFilters): Promise<PrizeClaimFormSubmission[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  let forms = generateMockForms();

  // Apply filters
  if (filters) {
    if (filters.tournamentName) {
      const tournamentName = filters.tournamentName;
      forms = forms.filter((f) =>
        f.formContent.tournamentName.toLowerCase().includes(tournamentName.toLowerCase()),
      );
    }
    if (filters.status) {
      forms = forms.filter((f) => f.status === filters.status);
    }
    if (filters.termsAgreed !== undefined) {
      forms = forms.filter((f) => f.formContent.termsAgreed === filters.termsAgreed);
    }
    if (filters.dateFrom) {
      const dateFrom = filters.dateFrom;
      forms = forms.filter((f) => new Date(f.createdAt) >= new Date(dateFrom));
    }
    if (filters.dateTo) {
      const dateTo = filters.dateTo;
      forms = forms.filter((f) => new Date(f.createdAt) <= new Date(dateTo));
    }
  }

  return forms;
}

/**
 * Get form details by ID
 */
export async function getFormDetails(_formId: string): Promise<PrizeClaimFormValues> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Mock data
  return {
    lastNameKanji: '山田',
    firstNameKanji: '太郎',
    lastNameKana: 'ヤマダ',
    firstNameKana: 'タロウ',
    playersId: 'P123456789',
    postalCode: '1000001',
    address: '東京都千代田区千代田1-1',
    phoneNumber: '090-1234-5678',
    email: 'test@example.com',
    tournamentDate: '2024-03-15',
    tournamentId: 'tournament_1',
    tournamentName: 'Spring Championship 2024',
    rank: '1',
    amount: 100000,
    bankCode: '0001',
    bankName: 'みずほ',
    branchCode: '105',
    branchName: '小舟町',
    accountType: 'savings',
    accountNumber: '1234567',
    accountHolderName: 'ヤマダタロウ',
    privacyAgreed: true,
    termsAgreed: true,
  };
}

/**
 * Get list of tournaments
 */
export async function getTournamentsList(): Promise<Tournament[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 400));

  return generateMockTournaments();
}

/**
 * Create new tournament
 */
export async function createTournament(
  input: CreateTournamentInput,
): Promise<{ success: boolean; tournament: Tournament }> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 600));

  const newTournament: Tournament = {
    id: `tournament_${Date.now()}`,
    name: input.name,
    date: input.date,
    location: input.location,
    status: 'upcoming',
    participantCount: 0,
    createdAt: new Date().toISOString(),
  };

  console.log('[Mock API] Tournament created:', newTournament);

  return {
    success: true,
    tournament: newTournament,
  };
}

/**
 * Get terms of service content
 */
export async function getTermsOfService(): Promise<ServiceContent> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  return {
    id: 'terms_1',
    type: 'terms',
    content: `
      <h1>Terms of Service</h1>
      <p>Last updated: ${new Date().toLocaleDateString()}</p>

      <h2>1. Acceptance of Terms</h2>
      <p>By accessing and using this service, you accept and agree to be bound by the terms and provision of this agreement.</p>

      <h2>2. Use of Service</h2>
      <p>You agree to use this service only for lawful purposes and in accordance with these Terms of Service.</p>

      <h2>3. User Accounts</h2>
      <p>You are responsible for maintaining the confidentiality of your account and password.</p>

      <h2>4. Privacy Policy</h2>
      <p>Your use of the service is also governed by our Privacy Policy.</p>

      <h2>5. Modifications</h2>
      <p>We reserve the right to modify these terms at any time.</p>
    `,
    version: '1.0.0',
    updatedAt: new Date().toISOString(),
    updatedBy: 'admin@example.com',
  };
}

/**
 * Update terms of service
 */
export async function updateTermsOfService(
  content: string,
): Promise<{ success: boolean; version: string }> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  console.log('[Mock API] Terms of Service updated:', content.slice(0, 100) + '...');

  return {
    success: true,
    version: '1.0.1',
  };
}

/**
 * Get privacy policy content
 */
export async function getPrivacyPolicy(): Promise<ServiceContent> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  return {
    id: 'privacy_1',
    type: 'privacy',
    content: `
      <h1>Privacy Policy</h1>
      <p>Last updated: ${new Date().toLocaleDateString()}</p>

      <h2>1. Information We Collect</h2>
      <p>We collect information that you provide directly to us, including name, email address, and payment information.</p>

      <h2>2. How We Use Your Information</h2>
      <p>We use the information we collect to provide, maintain, and improve our services.</p>

      <h2>3. Information Sharing</h2>
      <p>We do not share your personal information with third parties except as described in this policy.</p>

      <h2>4. Data Security</h2>
      <p>We implement appropriate technical and organizational measures to protect your personal data.</p>

      <h2>5. Your Rights</h2>
      <p>You have the right to access, correct, or delete your personal information.</p>

      <h2>6. Contact Us</h2>
      <p>If you have questions about this Privacy Policy, please contact us at privacy@example.com.</p>
    `,
    version: '1.0.0',
    updatedAt: new Date().toISOString(),
    updatedBy: 'admin@example.com',
  };
}

/**
 * Update privacy policy
 */
export async function updatePrivacyPolicy(
  content: string,
): Promise<{ success: boolean; version: string }> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  console.log('[Mock API] Privacy Policy updated:', content.slice(0, 100) + '...');

  return {
    success: true,
    version: '1.0.1',
  };
}

/**
 * Get contract content
 */
export async function getContract(): Promise<ServiceContent> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  return {
    id: 'contract_1',
    type: 'contract',
    content: `
      <h1>Prize Claim Contract</h1>
      <p>Last updated: ${new Date().toLocaleDateString()}</p>

      <h2>1. Prize Award Agreement</h2>
      <p>This contract governs the terms and conditions under which prizes are awarded to tournament winners.</p>

      <h2>2. Eligibility</h2>
      <p>The prize claimant must be a registered participant who has achieved a qualifying rank in the tournament.</p>

      <h2>3. Prize Distribution</h2>
      <p>Prizes will be distributed within 30 business days of verified claim submission.</p>

      <h2>4. Tax Obligations</h2>
      <p>Prize recipients are responsible for any applicable taxes on prize amounts.</p>

      <h2>5. Banking Information</h2>
      <p>Accurate banking information must be provided for electronic fund transfer.</p>

      <h2>6. Verification</h2>
      <p>All claims are subject to verification and may require additional documentation.</p>

      <h2>7. Dispute Resolution</h2>
      <p>Any disputes arising from this contract will be resolved through arbitration.</p>
    `,
    version: '1.0.0',
    updatedAt: new Date().toISOString(),
    updatedBy: 'admin@example.com',
  };
}

/**
 * Update contract
 */
export async function updateContract(
  content: string,
): Promise<{ success: boolean; version: string }> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  console.log('[Mock API] Contract updated:', content.slice(0, 100) + '...');

  return {
    success: true,
    version: '1.0.1',
  };
}

/**
 * Get receipt template content
 */
export async function getReceipt(): Promise<ServiceContent> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  return {
    id: 'receipt_1',
    type: 'receipt',
    content: `
      <h1>Prize Payment Receipt</h1>
      <p>Receipt Date: ${new Date().toLocaleDateString()}</p>

      <h2>Receipt Information</h2>
      <p><strong>Receipt Number:</strong> {{receiptNumber}}</p>
      <p><strong>Tournament:</strong> {{tournamentName}}</p>
      <p><strong>Tournament Date:</strong> {{tournamentDate}}</p>

      <h2>Recipient Information</h2>
      <p><strong>Name:</strong> {{playerName}}</p>
      <p><strong>Player ID:</strong> {{playersId}}</p>
      <p><strong>Email:</strong> {{email}}</p>

      <h2>Prize Details</h2>
      <p><strong>Rank Achieved:</strong> {{rank}}</p>
      <p><strong>Prize Amount:</strong> ¥{{amount}}</p>
      <p><strong>Payment Date:</strong> {{paymentDate}}</p>

      <h2>Bank Transfer Details</h2>
      <p><strong>Bank Name:</strong> {{bankName}}</p>
      <p><strong>Branch Name:</strong> {{branchName}}</p>
      <p><strong>Account Type:</strong> {{accountType}}</p>
      <p><strong>Account Number:</strong> {{accountNumber}}</p>
      <p><strong>Account Holder:</strong> {{accountHolderName}}</p>

      <hr>
      <p style="text-align: center; font-size: 0.9em; color: #666;">
        This is an official receipt for prize payment. Please keep this for your records.
      </p>
    `,
    version: '1.0.0',
    updatedAt: new Date().toISOString(),
    updatedBy: 'admin@example.com',
  };
}

/**
 * Update receipt template
 */
export async function updateReceipt(
  content: string,
): Promise<{ success: boolean; version: string }> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  console.log('[Mock API] Receipt template updated:', content.slice(0, 100) + '...');

  return {
    success: true,
    version: '1.0.1',
  };
}
