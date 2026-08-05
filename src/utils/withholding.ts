import type { PrizeClaimFormValues } from '@/types';

/**
 * Withholding-tax calculation (Phase 2: 源泉徴収) — DISPLAY ONLY.
 *
 * This mirrors the backend `calculateWithholding` (lambda/src/utils/withholding.util.ts),
 * which is the authoritative source of truth. The frontend uses this purely to preview
 * the withholding amount and final payout in the form / admin UI; the backend recomputes
 * and persists the definitive values at submission time.
 *
 * Rules (仕様確定 2026-08-05):
 * - Applies to sponsor contracts paid in cash only. Points (`isPoint === true`)
 *   and pro contracts are never withheld.
 * - Judged per tournament (1大会単位).
 * - Resident (`hasJapaneseResidence === true`): withheld only when the amount
 *   EXCEEDS 500,000 (exactly 500,000 is not withheld). Base = `amount - 500,000` @ 10.21%.
 * - Non-resident (`hasJapaneseResidence === false`): full amount @ 20.42%.
 * - `withholdingAmount` is floored to the yen; `netAmount` is floored to the nearest 1,000 yen.
 */

const RESIDENT_RATE = 0.1021;
const NON_RESIDENT_RATE = 0.2042;
const RESIDENT_THRESHOLD = 500000;

export interface WithholdingResult {
  /** 源泉徴収額 (円未満切り捨て後) */
  withholdingAmount: number;
  /** 最終支払額 = amount - withholdingAmount (千円未満切り捨て後) */
  netAmount: number;
  /** Whether withholding applies for this input (sponsor + cash + taxable amount). */
  applies: boolean;
}

export const calculateWithholding = (
  formContent: Pick<
    PrizeClaimFormValues,
    'amount' | 'contractType' | 'hasJapaneseResidence' | 'isPoint'
  >
): WithholdingResult => {
  const amount = formContent.amount ?? 0;

  const isCashSponsor =
    formContent.contractType === 'sponsor' && formContent.isPoint !== true;

  if (!isCashSponsor) {
    return { withholdingAmount: 0, netAmount: amount, applies: false };
  }

  let rawWithholding: number;
  if (formContent.hasJapaneseResidence) {
    if (amount <= RESIDENT_THRESHOLD) {
      return { withholdingAmount: 0, netAmount: amount, applies: false };
    }
    rawWithholding = (amount - RESIDENT_THRESHOLD) * RESIDENT_RATE;
  } else {
    rawWithholding = amount * NON_RESIDENT_RATE;
  }

  const withholdingAmount = Math.floor(rawWithholding); // 円未満切り捨て
  const netAmount = Math.floor((amount - withholdingAmount) / 1000) * 1000; // 千円未満切り捨て

  return { withholdingAmount, netAmount, applies: true };
};
