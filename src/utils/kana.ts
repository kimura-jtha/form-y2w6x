/**
 * Kana utilities for Japanese character handling
 */
/* eslint-disable unicorn/prefer-code-point */
// Unicode ranges:
// Hiragana: U+3040 - U+309F
// Full-width Katakana: U+30A0 - U+30FF
// Half-width Katakana: U+FF65 - U+FF9F
// CJK Unified Ideographs (Kanji): U+4E00 - U+9FFF, U+3400 - U+4DBF, U+F900 - U+FAFF

/**
 * Check if a string contains kanji (CJK characters)
 */
export function containsKanji(str: string): boolean {
  // CJK Unified Ideographs + Extension A + Compatibility Ideographs
  const kanjiPattern = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/;
  return kanjiPattern.test(str);
}

/**
 * Check if a string contains only kana (hiragana, katakana - full or half width) and allowed characters
 * Allowed: hiragana, katakana (full/half width), spaces, and common punctuation
 */
export function isKanaOnly(str: string): boolean {
  // Allow: hiragana, full-width katakana, half-width katakana, full-width space, ASCII space
  const kanaPattern = /^[\s\u3040-\u30FF\uFF65-\uFF9F]*$/;
  return kanaPattern.test(str);
}

/**
 * Convert hiragana to full-width katakana
 */
export function hiraganaToKatakana(str: string): string {
  return str.replaceAll(/[\u3041-\u3096]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) + 0x60),
  );
}

// Mapping for full-width katakana to half-width katakana
const fullToHalfKatakanaMap: Record<string, string> = {
  ア: 'ｱ',
  イ: 'ｲ',
  ウ: 'ｳ',
  エ: 'ｴ',
  オ: 'ｵ',
  カ: 'ｶ',
  キ: 'ｷ',
  ク: 'ｸ',
  ケ: 'ｹ',
  コ: 'ｺ',
  サ: 'ｻ',
  シ: 'ｼ',
  ス: 'ｽ',
  セ: 'ｾ',
  ソ: 'ｿ',
  タ: 'ﾀ',
  チ: 'ﾁ',
  ツ: 'ﾂ',
  テ: 'ﾃ',
  ト: 'ﾄ',
  ナ: 'ﾅ',
  ニ: 'ﾆ',
  ヌ: 'ﾇ',
  ネ: 'ﾈ',
  ノ: 'ﾉ',
  ハ: 'ﾊ',
  ヒ: 'ﾋ',
  フ: 'ﾌ',
  ヘ: 'ﾍ',
  ホ: 'ﾎ',
  マ: 'ﾏ',
  ミ: 'ﾐ',
  ム: 'ﾑ',
  メ: 'ﾒ',
  モ: 'ﾓ',
  ヤ: 'ﾔ',
  ユ: 'ﾕ',
  ヨ: 'ﾖ',
  ラ: 'ﾗ',
  リ: 'ﾘ',
  ル: 'ﾙ',
  レ: 'ﾚ',
  ロ: 'ﾛ',
  ワ: 'ﾜ',
  ヲ: 'ｦ',
  ン: 'ﾝ',
  // Voiced (dakuten)
  ガ: 'ｶﾞ',
  ギ: 'ｷﾞ',
  グ: 'ｸﾞ',
  ゲ: 'ｹﾞ',
  ゴ: 'ｺﾞ',
  ザ: 'ｻﾞ',
  ジ: 'ｼﾞ',
  ズ: 'ｽﾞ',
  ゼ: 'ｾﾞ',
  ゾ: 'ｿﾞ',
  ダ: 'ﾀﾞ',
  ヂ: 'ﾁﾞ',
  ヅ: 'ﾂﾞ',
  デ: 'ﾃﾞ',
  ド: 'ﾄﾞ',
  バ: 'ﾊﾞ',
  ビ: 'ﾋﾞ',
  ブ: 'ﾌﾞ',
  ベ: 'ﾍﾞ',
  ボ: 'ﾎﾞ',
  ヴ: 'ｳﾞ',
  // Semi-voiced (handakuten)
  パ: 'ﾊﾟ',
  ピ: 'ﾋﾟ',
  プ: 'ﾌﾟ',
  ペ: 'ﾍﾟ',
  ポ: 'ﾎﾟ',
  // Small kana
  ァ: 'ｧ',
  ィ: 'ｨ',
  ゥ: 'ｩ',
  ェ: 'ｪ',
  ォ: 'ｫ',
  ャ: 'ｬ',
  ュ: 'ｭ',
  ョ: 'ｮ',
  ッ: 'ｯ',
  // Punctuation and special characters
  '。': '｡',
  '「': '｢',
  '」': '｣',
  '、': '､',
  '・': '･',
  ー: 'ｰ',
  '゛': 'ﾞ',
  '゜': 'ﾟ',
  // Full-width space to half-width space
  '　': ' ',
};

/**
 * Convert full-width katakana to half-width katakana
 */
export function fullWidthToHalfWidthKatakana(str: string): string {
  let result = '';
  for (const char of str) {
    result += fullToHalfKatakanaMap[char] ?? char;
  }
  return result;
}

/**
 * Convert any kana (hiragana or full-width katakana) to half-width katakana
 * This is the main function to use for form input conversion
 */
export function toHalfWidthKatakana(str: string): string {
  // First convert hiragana to katakana, then convert to half-width
  const katakana = hiraganaToKatakana(str);
  return fullWidthToHalfWidthKatakana(katakana);
}

/**
 * Check if a character is hiragana
 */
export function isHiragana(char: string): boolean {
  const code = char.charCodeAt(0);
  return code >= 0x3040 && code <= 0x309f;
}

/**
 * Check if a character is full-width katakana
 */
export function isFullWidthKatakana(char: string): boolean {
  const code = char.charCodeAt(0);
  return code >= 0x30a0 && code <= 0x30ff;
}

/**
 * Check if a character is half-width katakana
 */
export function isHalfWidthKatakana(char: string): boolean {
  const code = char.charCodeAt(0);
  return code >= 0xff65 && code <= 0xff9f;
}

/**
 * Check if a string contains hiragana
 */
export function containsHiragana(str: string): boolean {
  return /[\u3040-\u309F]/.test(str);
}

/**
 * Check if a string contains full-width katakana
 */
export function containsFullWidthKatakana(str: string): boolean {
  return /[\u30A0-\u30FF]/.test(str);
}
