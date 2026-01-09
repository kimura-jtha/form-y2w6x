import { useCallback, useEffect, useRef, useState } from 'react';

import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';

import { useDebounce } from '@/hooks';
import i18n from '@/i18n';
import {
  fetchActiveTournaments,
  fetchBanks,
  fetchBranches,
  searchAddressByPostalCode,
  submitPrizeClaimForm,
} from '@/lib';
import type { Bank, Branch, PrizeClaimFormValues, PrizeRank, Tournament } from '@/types';
import { initialPrizeClaimFormValues } from '@/types';
import { validatePasswordV2 } from '@/utils/auth';

// Validation patterns
const POSTAL_CODE_PATTERN = /^\d{7}$/;
// const PHONE_PATTERN = /^0(?:\d{1,4}-?){2}\d{4}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const KATAKANA_PATTERN = /^[\u3000-\u303F\u30A0-\u30FF]+$/;
const ACCOUNT_NUMBER_PATTERN = /^\d{6,7}$/;

export function usePrizeClaimForm(password: string) {
  const { t } = useTranslation();

  // Loading states
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);

  // Data states
  const [banks, setBanks] = useState<Bank[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [isLoadingTournaments, setIsLoadingTournaments] = useState(false);

  // Track initialization
  const initializedRef = useRef(false);
  // Track last auto-searched postal code to prevent duplicate API calls
  const lastSearchedPostalCodeRef = useRef('');
  const isJapanese = useRef(i18n.language === 'ja');
  const form = useForm<PrizeClaimFormValues>({
    mode: 'controlled',
    initialValues: initialPrizeClaimFormValues,
    validate: {
      lastNameKanji: (value) => (!value.trim() ? t('prizeClaim.validation.required') : null),
      firstNameKanji: (value) => (!value.trim() ? t('prizeClaim.validation.required') : null),
      lastNameKana: (value) => {
        if (!isJapanese.current) {
          return null;
        }
        if (!value.trim()) return t('prizeClaim.validation.required');
        if (!KATAKANA_PATTERN.test(value)) return t('prizeClaim.validation.katakanaOnly');
        return null;
      },
      firstNameKana: (value) => {
        if (!isJapanese.current) {
          return null;
        }
        if (!value.trim()) return t('prizeClaim.validation.required');
        if (!KATAKANA_PATTERN.test(value)) return t('prizeClaim.validation.katakanaOnly');
        return null;
      },
      playersId: (value) => (!value.trim() ? t('prizeClaim.validation.required') : null),
      postalCode: (value) => {
        if (!isJapanese.current) {
          return null;
        }
        if (!value.trim()) return t('prizeClaim.validation.required');
        if (!POSTAL_CODE_PATTERN.test(value)) return t('prizeClaim.validation.invalidPostalCode');
        return null;
      },
      address: (value) => (!value.trim() ? t('prizeClaim.validation.required') : null),
      phoneNumber: (value) => {
        if (!value.trim()) return t('prizeClaim.validation.required');
        // if (!PHONE_PATTERN.test(value)) return t('prizeClaim.validation.invalidPhoneNumber');
        return null;
      },
      email: (value, _values) => {
        if (!value.trim()) return t('prizeClaim.validation.required');
        if (!EMAIL_PATTERN.test(value)) return t('prizeClaim.validation.invalidEmail');

        // https://enjoy-7ly4631.slack.com/archives/D07MQ4VQYTC/p1766799449576569?thread_ts=1766799360.073049&cid=D07MQ4VQYTC
        // 同じプレイヤーが複数入賞することはあるのでemailのバリデはいりません
        // Check if email is already claimed in the selected tournament
        // if (values.tournamentId) {
        //   const tournament = tournaments.find((t) => t.id === values.tournamentId);
        //   if (tournament?.claimedEmails?.includes(value.trim())) {
        //     return t('prizeClaim.validation.emailAlreadyClaimed');
        //   }
        // }

        return null;
      },
      tournamentDate: (value) => (!value ? t('prizeClaim.validation.required') : null),
      tournamentId: (value) => (!value ? t('prizeClaim.validation.required') : null),
      rank: (value) => (!value ? t('prizeClaim.validation.required') : null),
      bankCode: (value) => {
        if (!isJapanese.current) {
          return null;
        }
        return !value ? t('prizeClaim.validation.required') : null;
      },
      branchCode: (value) => {
        if (!isJapanese.current) {
          return null;
        }
        return !value ? t('prizeClaim.validation.required') : null;
      },
      accountType: (value) => {
        if (!isJapanese.current) {
          return null;
        }
        return !value ? t('prizeClaim.validation.required') : null;
      },
      accountNumber: (value) => {
        if (!isJapanese.current) {
          return null;
        }
        if (!value.trim()) return t('prizeClaim.validation.required');
        if (!ACCOUNT_NUMBER_PATTERN.test(value))
          return t('prizeClaim.validation.invalidAccountNumber');
        return null;
      },
      accountHolderName: (value) => {
        if (!isJapanese.current) {
          return null;
        }
        return !value.trim() ? t('prizeClaim.validation.required') : null;
      },
      privacyAgreed: (value) =>
        !value ? t('prizeClaim.validation.mustAgreeToPrivacyPolicy') : null,
    },
  });

  // Password for form submission

  // Mark as initialized
  useEffect(() => {
    initializedRef.current = true;
  }, []);

  // Load banks on mount
  useEffect(() => {
    const loadBanks = async () => {
      setIsLoadingBanks(true);
      try {
        const data = await fetchBanks();
        setBanks(data);
      } finally {
        setIsLoadingBanks(false);
      }
    };
    loadBanks();
  }, []);

  // Load tournaments on mount
  useEffect(() => {
    const loadTournaments = async () => {
      setIsLoadingTournaments(true);
      try {
        const data = await fetchActiveTournaments();
        setTournaments(data);
        // Extract unique dates and sort them
        const dates = [...new Set(data.map((t) => t.date))].sort();
        setAvailableDates(dates);
      } finally {
        setIsLoadingTournaments(false);
      }
    };
    loadTournaments();
  }, []);

  // Search address by postal code using ZipCloud API
  const searchAddress = useCallback(async () => {
    const postalCode = form.getValues().postalCode;

    setIsSearchingAddress(true);
    try {
      const result = await searchAddressByPostalCode(postalCode);

      if (result.success) {
        form.setFieldValue('address', result.address ?? '');
      } else {
        const errorMessage =
          result.error === 'network_error'
            ? t('common.error')
            : t('prizeClaim.validation.invalidPostalCode');
        form.setFieldError('postalCode', errorMessage);
      }
    } finally {
      setIsSearchingAddress(false);
    }
  }, [form, t]);

  // Track postal code for auto-search
  const postalCodeValue = form.getValues().postalCode;
  const debouncedPostalCode = useDebounce(postalCodeValue, 500);

  // Auto-search address when postal code is valid (7 digits)
  useEffect(() => {
    if (
      initializedRef.current &&
      debouncedPostalCode &&
      POSTAL_CODE_PATTERN.test(debouncedPostalCode) &&
      debouncedPostalCode !== lastSearchedPostalCodeRef.current
    ) {
      lastSearchedPostalCodeRef.current = debouncedPostalCode;
      searchAddress();
    }
  }, [debouncedPostalCode, searchAddress]);

  // Filter banks by query
  const filterBanksByQuery = useCallback(
    (query: string): Bank[] => {
      if (!query) return banks;
      const normalizedQuery = query.toLowerCase();
      return banks
        .filter(
          (bank) =>
            bank.name.toLowerCase().includes(normalizedQuery) ||
            bank.kana.toLowerCase().includes(normalizedQuery) ||
            bank.code.includes(query),
        )
        .slice(0, 50);
    },
    [banks],
  );

  // Filter branches by query
  const filterBranchesByQuery = useCallback(
    (query: string): Branch[] => {
      if (!query) return branches;
      const normalizedQuery = query.toLowerCase();
      return branches
        .filter(
          (branch) =>
            branch.name.toLowerCase().includes(normalizedQuery) ||
            branch.kana.toLowerCase().includes(normalizedQuery) ||
            branch.code.includes(query),
        )
        .slice(0, 50);
    },
    [branches],
  );

  // Get tournaments filtered by selected date
  const getFilteredTournaments = useCallback(
    (selectedDate: string): Tournament[] => {
      if (!selectedDate) return [];
      return tournaments.filter((t) => t.date === selectedDate);
    },
    [tournaments],
  );

  // Get available ranks for selected tournament
  const getAvailableRanks = useCallback(
    (tournamentId: string): PrizeRank[] => {
      const tournament = tournaments.find((t) => t.id === tournamentId);
      if (!tournament) return [];
      // Return all available prizes (claimed status is now tracked in the backend)
      return tournament.prizes;
    },
    [tournaments],
  );

  // Get prize amount for selected tournament and rank
  const getPrizeAmount = useCallback(
    (tournamentId: string, rank: string): number => {
      const tournament = tournaments.find((t) => t.id === tournamentId);
      if (!tournament) return 0;
      const prize = tournament.prizes.find((p) => p.rank === rank);
      return prize?.amount ?? 0;
    },
    [tournaments],
  );

  // Handle bank selection
  const handleBankSelect = useCallback(
    async (bankCode: string | null) => {
      if (!bankCode) {
        form.setFieldValue('bankCode', '');
        form.setFieldValue('bankName', '');
        form.setFieldValue('branchCode', '');
        form.setFieldValue('branchName', '');
        setBranches([]);
        return;
      }

      const bank = banks.find((b) => b.code === bankCode);
      if (bank) {
        form.setFieldValue('bankCode', bank.code);
        form.setFieldValue('bankName', bank.name);
        // Reset branch when bank changes
        form.setFieldValue('branchCode', '');
        form.setFieldValue('branchName', '');
        // Load branches for selected bank
        setIsLoadingBranches(true);
        try {
          const branchData = await fetchBranches(bank.code);
          setBranches(branchData);
        } finally {
          setIsLoadingBranches(false);
        }
      }
    },
    [banks, form],
  );

  // Handle branch selection
  const handleBranchSelect = useCallback(
    (branchCode: string | null) => {
      if (!branchCode) {
        form.setFieldValue('branchCode', '');
        form.setFieldValue('branchName', '');
        return;
      }

      const branch = branches.find((b) => b.code === branchCode);
      if (branch) {
        form.setFieldValue('branchCode', branch.code);
        form.setFieldValue('branchName', branch.name);
      }
    },
    [branches, form],
  );

  // Handle tournament selection
  const handleTournamentSelect = useCallback(
    (tournamentId: string | null) => {
      if (!tournamentId) {
        form.setFieldValue('tournamentId', '');
        form.setFieldValue('tournamentName', '');
        form.setFieldValue('rank', '');
        form.setFieldValue('amount', 0);
        return;
      }

      const tournament = tournaments.find((t) => t.id === tournamentId);
      form.setFieldValue('tournamentId', tournamentId);
      // Store both event and tournament names
      const tournamentName = tournament
        ? `${tournament.eventNameJa} - ${tournament.tournamentNameJa}`
        : '';
      form.setFieldValue('tournamentName', tournamentName);
      // Reset rank and amount when tournament changes
      form.setFieldValue('rank', '');
      form.setFieldValue('amount', 0);
    },
    [form, tournaments],
  );

  // Handle tournament date change
  const handleTournamentDateChange = useCallback(
    (date: string | null) => {
      form.setFieldValue('tournamentDate', date ?? '');
      // Reset tournament, name, rank and amount when date changes
      form.setFieldValue('tournamentId', '');
      form.setFieldValue('tournamentName', '');
      form.setFieldValue('rank', '');
      form.setFieldValue('amount', 0);

      // Auto-select tournament if there's only one for this date
      if (date) {
        const filteredTournaments = getFilteredTournaments(date);
        if (filteredTournaments.length === 1) {
          handleTournamentSelect(filteredTournaments[0].id);
        }
      }
    },
    [form, getFilteredTournaments, handleTournamentSelect],
  );

  // Handle rank selection and auto-calculate amount
  const handleRankSelect = useCallback(
    (rank: string | null) => {
      if (!rank) {
        form.setFieldValue('rank', '');
        form.setFieldValue('amount', 0);
        return;
      }

      const tournamentId = form.getValues().tournamentId;
      const amount = getPrizeAmount(tournamentId, rank);
      form.setFieldValue('rank', rank);
      form.setFieldValue('amount', amount);
    },
    [form, getPrizeAmount],
  );

  // Pad account number to 7 digits
  const padAccountNumber = useCallback(
    (value: string) => {
      const cleaned = value.replaceAll(/\D/g, '');
      if (cleaned.length > 0 && cleaned.length < 7) {
        form.setFieldValue('accountNumber', cleaned.padStart(7, '0'));
      }
    },
    [form],
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (values: PrizeClaimFormValues) => {
      setIsSubmitting(true);
      try {
        // Validate password on frontend
        if (!password || !validatePasswordV2(password)) {
          notifications.show({
            autoClose: false,
            position: 'top-right',
            title: t('prizeClaim.notifications.invalidPassword.title'),
            message: t('prizeClaim.notifications.invalidPassword.message'),
            color: 'red',
          });
          return;
        }

        const result = await submitPrizeClaimForm(values, password);

        if (result.success) {
          notifications.show({
            title: t('prizeClaim.notifications.submitSuccess.title'),
            message: t('prizeClaim.notifications.submitSuccess.message'),
            color: 'green',
          });
          form.reset();
          setBranches([]);
          lastSearchedPostalCodeRef.current = '';
        } else {
          notifications.show({
            autoClose: false,
            position: 'top-right',
            title: t('prizeClaim.notifications.submitFailed.title'),
            message: t('prizeClaim.notifications.submitFailed.message'),
            color: 'red',
          });
        }
      } catch (error) {
        console.error('Submit error:', error);
        notifications.show({
          title: t('prizeClaim.notifications.submitError.title'),
          message: t('prizeClaim.notifications.submitError.message'),
          color: 'red',
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [form, t, password],
  );

  // Handle form clear
  const handleClear = useCallback(() => {
    form.reset();
    setBranches([]);
    lastSearchedPostalCodeRef.current = '';
  }, [form]);

  return {
    form,
    // States
    isSearchingAddress,
    isSubmitting,
    isLoadingBanks,
    isLoadingBranches,
    isLoadingTournaments,
    banks,
    branches,
    tournaments,
    availableDates,
    // Actions
    searchAddress,
    filterBanks: filterBanksByQuery,
    filterBranches: filterBranchesByQuery,
    getFilteredTournaments,
    getAvailableRanks,
    getPrizeAmount,
    handleBankSelect,
    handleBranchSelect,
    handleTournamentDateChange,
    handleTournamentSelect,
    handleRankSelect,
    padAccountNumber,
    handleSubmit,
    handleClear,
  };
}
