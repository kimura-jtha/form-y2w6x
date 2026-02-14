/**
 * CSV Export and Import Utilities
 */

import Encoding from 'encoding-japanese';

import type { PrizeClaimFormSubmission, PrizeRank, Tournament, TournamentStatus } from '@/types';
import { toHalfWidthKatakana } from '@/utils/kana';

/**
 * CSV Import Result
 */
export interface CSVImportResult {
  success: boolean;
  data: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt'>[];
  errors: CSVImportError[];
}

export interface CSVImportError {
  row: number;
  field?: string;
  message: string;
}

/**
 * Convert a value to CSV-safe string
 * Handles special characters, quotes, and commas
 */
function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // If the value contains comma, quote, or newline, wrap in quotes and escape existing quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }

  return stringValue;
}

/**
 * Convert array of objects to CSV string
 */
function arrayToCSV(rows: string[][], headers?: string[]): string {
  const csvRows = [
    headers ? headers.map(escapeCSV).join(',') : undefined,
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ].filter((row) => row !== undefined);

  return csvRows.join('\n');
}

/**
 * Export prize claim forms to PayPay CSV format in Shift_JIS encoding
 * PayPay banking format requires:
 * - Shift_JIS encoding (Japanese banking standard)
 * - Specific column format for bank transfer data
 * - Summary row at the end
 *
 * @param forms - Array of form submissions to export
 * @param filename - Filename for the download (without extension)
 */
export function exportFormsToPayPayCSV(forms: PrizeClaimFormSubmission[], filename: string) {
  if (forms.length === 0) {
    throw new Error('No forms to export');
  }

  // Convert forms to CSV rows
  let totalAmount = 0;
  const rows = forms.map((form) => {
    const { formContent } = form;
    totalAmount += formContent.amount;
    return [
      // レコード区分 (Record type)
      '1',
      // 銀行コード (Bank code)
      formContent.bankCode,
      // 支店コード (Branch code)
      formContent.branchCode,
      // 預金種目 (Account type: 1=savings, 2=checking)
      formContent.accountType === 'savings' ? '1' : '2',
      // 口座番号 (Account number)
      formContent.accountNumber,
      // 受取人名 (Recipient name in half-width katakana)
      toHalfWidthKatakana(formContent.accountHolderName),
      // 振込金額 (Transfer amount)
      formContent.amount.toString(),
      // 振込依頼人名 (Client name - optional)
      'ｼｬ)ﾆﾎﾝﾌﾟﾛﾌｪｯｼｮﾅﾙﾎﾟｰｶｰｷｮｳｶｲ',
    ];
  });

  // Add summary row (trailer record)
  // レコード区分=2, 合計件数, 合計金額
  const totalForms = forms.length;
  rows.push(['2', '', '', '', '', totalForms.toString(), totalAmount.toString(), '']);

  // Generate CSV content
  const csvContent = arrayToCSV(rows);

  // Convert string to Shift_JIS encoding
  // encoding-japanese expects Unicode code points as input
  const unicodeArray = [];
  for (let i = 0; i < csvContent.length; i++) {
    unicodeArray.push(csvContent.codePointAt(i) || 0);
  }

  // Convert Unicode to Shift_JIS
  const sjisArray = Encoding.convert(unicodeArray, {
    to: 'SJIS',
    from: 'UNICODE',
  });

  // Create Uint8Array from Shift_JIS array
  const sjisUint8Array = new Uint8Array(sjisArray);

  // Create blob with Shift_JIS encoding
  const blob = new Blob([sjisUint8Array], { type: 'text/csv;charset=shift_jis;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';

  document.body.append(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

/**
 * Export prize claim forms to CSV
 * @param forms - Array of form submissions to export
 * @param filename - Filename for the download (without extension)
 */
export function exportFormsToCSV(forms: PrizeClaimFormSubmission[], filename: string): void {
  if (forms.length === 0) {
    throw new Error('No forms to export');
  }

  // Define CSV headers (all form fields + metadata)
  const headers = [
    // 'Form ID',
    // 'Status',
    '作成日',
    // Personal Information
    '名字 (漢字)',
    '名前 (漢字)',
    '名字 (カナ)',
    '名前 (カナ)',
    'プレイヤーズ＋ID',
    // Contact Information
    '郵便番号',
    '住所',
    '電話番号',
    'メールアドレス',
    // Tournament Information
    '開催日',
    // 'Tournament ID',
    'トーナメント',
    '順位',
    '種別',
    '金額',
    // Bank Information
    // 'Bank Code',
    '銀行名',
    // 'Branch Code',
    '支店名',
    '口座種別',
    '口座番号',
    '口座名義人',
    // Agreements
    '契約書同意',
  ];

  // Convert forms to CSV rows
  const rows = forms.map((form) => {
    const { formContent } = form;
    const createdAt = new Date(form.createdAt).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
    return [
      // form.id,
      // form.status,
      createdAt,
      // Personal Information
      formContent.isPoint ? '' : formContent.lastNameKanji,
      formContent.isPoint ? '' : formContent.firstNameKanji,
      toHalfWidthKatakana(formContent.lastNameKana),
      toHalfWidthKatakana(formContent.firstNameKana),
      formContent.playersId,
      // Contact Information
      formContent.isPoint ? '' : formContent.postalCode,
      formContent.isPoint ? '' : formContent.address,
      formContent.phoneNumber,
      formContent.isPoint ? '' : formContent.email,
      // Tournament Information
      formContent.tournamentDate,
      // formContent.tournamentId,
      formContent.tournamentName,
      formContent.rank,
      formContent.isPoint ? 'ポイント (+P)' : '現金 (¥)',
      formContent.amount.toLocaleString(),
      // Bank Information
      // formContent.bankCode,
      formContent.isPoint ? '' : formContent.bankName ? formContent.bankName : '',
      // formContent.branchCode,
      formContent.isPoint ? '' : formContent.branchName ? formContent.branchName : '',
      formContent.isPoint
        ? ''
        : formContent.accountType
          ? formContent.accountType === 'savings'
            ? '普通'
            : '当座'
          : '',
      formContent.isPoint ? '' : formContent.accountNumber ? formContent.accountNumber : '',
      formContent.isPoint
        ? ''
        : formContent.accountHolderName
          ? toHalfWidthKatakana(formContent.accountHolderName)
          : '',
      // Agreements
      formContent.isPoint ? '' : formContent.termsAgreed ? '☑︎' : '☐',
    ];
  });

  // Generate CSV content
  const csvContent = arrayToCSV(rows, headers);

  // Create blob and download
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';

  document.body.append(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

/**
 * Parse CSV text to tournament data
 * New format: Each prize is a separate row
 */
export function parseTournamentCSV(csvText: string): CSVImportResult {
  const errors: CSVImportError[] = [];
  const data: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt'>[] = [];

  try {
    // Split into lines and remove empty lines
    const lines = csvText.split('\n').filter((line) => line.trim());

    if (lines.length === 0) {
      errors.push({ row: 0, message: 'CSV file is empty' });
      return { success: false, data: [], errors };
    }

    // Parse header
    const header = parseCSVLine(lines[0]);
    const requiredFields = ['eventNameJa', 'tournamentNameJa', 'date', 'status', 'prize', 'amount'];

    // Validate header
    const missingFields = requiredFields.filter((field) => !header.includes(field));
    if (missingFields.length > 0) {
      errors.push({
        row: 0,
        message: `Missing required columns: ${missingFields.join(', ')}`,
      });
      return { success: false, data: [], errors };
    }

    // Parse all rows and group by tournament
    const tournamentMap = new Map<
      string,
      {
        tournament: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt' | 'prizes'>;
        prizes: PrizeRank[];
        firstRow: number;
      }
    >();

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const values = parseCSVLine(line);
        if (values.length !== header.length) {
          errors.push({
            row: i + 1,
            message: `Column count mismatch. Expected ${header.length}, got ${values.length}`,
          });
          continue;
        }

        // Create row object
        const row: Record<string, string> = {};
        for (const [j, element] of header.entries()) {
          row[element] = values[j];
        }

        // Validate row
        const validationErrors = validateTournamentRow(row, i + 1);
        if (validationErrors.length > 0) {
          errors.push(...validationErrors);
          continue;
        }

        // Create tournament key
        const tournamentKey = `${row['eventNameJa']}|${row['tournamentNameJa']}|${row['date']}`;

        // Get or create tournament entry
        if (!tournamentMap.has(tournamentKey)) {
          tournamentMap.set(tournamentKey, {
            tournament: {
              eventName: row['eventNameEn'] || row['eventNameJa'],
              eventNameJa: row['eventNameJa'],
              tournamentName: row['tournamentNameEn'] || row['tournamentNameJa'],
              tournamentNameJa: row['tournamentNameJa'],
              date: row['date'],
              status: row['status'] as TournamentStatus,
            },
            prizes: [],
            firstRow: i + 1,
          });
        }

        // Add prize to tournament
        const entry = tournamentMap.get(tournamentKey);
        if (!entry) {
          // This should never happen, but handle it gracefully
          errors.push({
            row: i + 1,
            message: 'Failed to retrieve tournament entry',
          });
          continue;
        }

        const amount = Number.parseInt(row['amount'], 10);
        if (Number.isNaN(amount) || amount < 0) {
          errors.push({
            row: i + 1,
            field: 'amount',
            message: `Invalid prize amount: ${row['amount']}`,
          });
          continue;
        }

        entry.prizes.push({
          rank: row['prize'],
          amount,
        });
      } catch (error) {
        errors.push({
          row: i + 1,
          message: `Failed to parse row: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }

    // Convert tournament map to array
    for (const [, entry] of tournamentMap) {
      if (entry.prizes.length === 0) {
        errors.push({
          row: entry.firstRow,
          message: 'Tournament must have at least one prize',
        });
        continue;
      }

      data.push({
        ...entry.tournament,
        prizes: entry.prizes,
      });
    }

    return {
      success: errors.length === 0,
      data,
      errors,
    };
  } catch (error) {
    errors.push({
      row: 0,
      message: `Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    return { success: false, data: [], errors };
  }
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quotes
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current.trim());

  return result;
}

/**
 * Validate a single tournament row (new format)
 */
function validateTournamentRow(row: Record<string, string>, rowNumber: number): CSVImportError[] {
  const rowErrors: CSVImportError[] = [];

  // Validate required fields
  if (!row['eventNameJa']) {
    rowErrors.push({
      row: rowNumber,
      field: 'eventNameJa',
      message: 'Event name (Japanese) is required',
    });
  }
  if (!row['tournamentNameJa']) {
    rowErrors.push({
      row: rowNumber,
      field: 'tournamentNameJa',
      message: 'Tournament name (Japanese) is required',
    });
  }

  // Validate date
  if (!row['date']) {
    rowErrors.push({ row: rowNumber, field: 'date', message: 'Date is required' });
  } else {
    row['date'] = row['date'].replaceAll('/', '-');
    if (!/^\d{4}-\d{1,2}-\d{1,2}$/.test(row['date'])) {
      rowErrors.push({
        row: rowNumber,
        field: 'date',
        message: 'Date must be in YYYY-MM-DD or YYYY/MM/DD format',
      });
    }
  }

  // Validate status
  if (!row['status']) {
    rowErrors.push({ row: rowNumber, field: 'status', message: 'Status is required' });
  } else if (row['status'] !== 'active' && row['status'] !== 'inactive') {
    rowErrors.push({
      row: rowNumber,
      field: 'status',
      message: 'Status must be "active" or "inactive"',
    });
  }

  // Validate prize (rank)
  if (!row['prize']) {
    rowErrors.push({ row: rowNumber, field: 'prize', message: 'Prize rank is required' });
  }

  // Validate amount
  if (!row['amount']) {
    rowErrors.push({ row: rowNumber, field: 'amount', message: 'Prize amount is required' });
  } else {
    const amount = Number.parseInt(row['amount'], 10);
    if (Number.isNaN(amount) || amount < 0) {
      rowErrors.push({
        row: rowNumber,
        field: 'amount',
        message: 'Prize amount must be a non-negative number',
      });
    }
  }

  return rowErrors;
}

/**
 * Download tournament CSV template
 */
export function downloadTournamentCSVTemplate(): void {
  // Download the public template file
  const link = document.createElement('a');
  link.setAttribute('href', '/tournament-import-template.csv');
  link.setAttribute('download', 'tournament-import-template.csv');
  link.style.visibility = 'hidden';
  document.body.append(link);
  link.click();
  link.remove();
}
