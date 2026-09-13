/**
 * String Similarity & Fuzzy Matching Utilities
 * Zero-dependency pure mathematical implementations of Levenshtein Distance and Token Sort Ratio.
 */

/**
 * Strips Vietnamese diacritics and converts to ASCII representation.
 */
export function removeVietnameseTones(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, (char) => (char === 'đ' ? 'd' : 'D'))
    .trim();
}

/**
 * Normalizes text for comparison: lowercases, strips accents, removes punctuation,
 * and collapses multiple spaces.
 */
export function normalizeSearchString(str: string): string {
  if (!str) return '';
  const withoutTones = removeVietnameseTones(str).toLowerCase();
  return withoutTones
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Computes Levenshtein Distance using the space-optimized two-row algorithm.
 * O(min(m, n)) space complexity.
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let s1 = a;
  let s2 = b;
  if (s1.length > s2.length) {
    [s1, s2] = [s2, s1];
  }

  const m = s1.length;
  const n = s2.length;
  let previousRow = new Array<number>(m + 1);
  let currentRow = new Array<number>(m + 1);

  for (let i = 0; i <= m; i++) {
    previousRow[i] = i;
  }

  for (let j = 1; j <= n; j++) {
    currentRow[0] = j;
    const char2 = s2[j - 1];

    for (let i = 1; i <= m; i++) {
      const cost = s1[i - 1] === char2 ? 0 : 1;
      const deletion = (previousRow[i] ?? 0) + 1;
      const insertion = (currentRow[i - 1] ?? 0) + 1;
      const substitution = (previousRow[i - 1] ?? 0) + cost;
      currentRow[i] = Math.min(deletion, insertion, substitution);
    }

    [previousRow, currentRow] = [currentRow, previousRow];
  }

  return previousRow[m] ?? 0;
}

/**
 * Computes similarity ratio between 0.0 (completely dissimilar) and 1.0 (identical).
 */
export function stringSimilarityRatio(a: string, b: string): number {
  if (a === b) return 1.0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(a, b);
  return Math.max(0.0, 1.0 - dist / maxLen);
}

/**
 * Computes Token Sort Ratio:
 * Tokenizes, sorts words alphabetically, and computes Levenshtein similarity.
 * Highly robust against word reordering (e.g. "Dệt May Đông Nam" vs "Đông Nam Dệt May").
 */
export function tokenSortRatio(a: string, b: string): number {
  const normA = normalizeSearchString(a);
  const normB = normalizeSearchString(b);

  if (normA === normB) return 1.0;
  if (!normA || !normB) return 0.0;

  const sortedA = normA.split(' ').filter(Boolean).sort().join(' ');
  const sortedB = normB.split(' ').filter(Boolean).sort().join(' ');

  return stringSimilarityRatio(sortedA, sortedB);
}

/**
 * Strips common legal prefixes, suffixes, and noise words in Vietnamese company names
 * to isolate the core brand name.
 */
export function stripCompanyAffixes(str: string): string {
  const norm = normalizeSearchString(str);
  if (!norm) return '';

  const stopWords = [
    'cong ty co phan',
    'cong ty cp',
    'cong ty tnhh',
    'cong ty',
    'co phan',
    'tnhh',
    'cp',
    'tong cong ty',
    'doanh nghiep',
    'dntn',
    'co so',
    'tap doan',
    'sx tm',
    'sx',
    'tm',
    'xnk',
  ];

  let result = ` ${norm} `;
  for (const word of stopWords) {
    result = result.replace(new RegExp(`\\b${word}\\b`, 'g'), ' ');
  }

  return result.replace(/\s+/g, ' ').trim();
}

/**
 * Computes Token Set Ratio:
 * Extracts intersection of words between A and B, then compares intersection against
 * remaining differences. Handles cases where one string contains abbreviations or extra affixes.
 */
export function tokenSetRatio(a: string, b: string): number {
  const normA = normalizeSearchString(a);
  const normB = normalizeSearchString(b);

  if (normA === normB) return 1.0;
  if (!normA || !normB) return 0.0;

  const tokensA = new Set(normA.split(' ').filter(Boolean));
  const tokensB = new Set(normB.split(' ').filter(Boolean));

  const intersection = Array.from(tokensA)
    .filter((t) => tokensB.has(t))
    .sort()
    .join(' ');
  const diffA = Array.from(tokensA)
    .filter((t) => !tokensB.has(t))
    .sort()
    .join(' ');
  const diffB = Array.from(tokensB)
    .filter((t) => !tokensA.has(t))
    .sort()
    .join(' ');

  if (!intersection) {
    return tokenSortRatio(a, b);
  }

  const s1 = intersection;
  const s2 = [intersection, diffA].filter(Boolean).join(' ');
  const s3 = [intersection, diffB].filter(Boolean).join(' ');

  const ratio1 = stringSimilarityRatio(s1, s2);
  const ratio2 = stringSimilarityRatio(s1, s3);
  const ratio3 = stringSimilarityRatio(s2, s3);

  return Math.max(ratio1, ratio2, ratio3);
}
