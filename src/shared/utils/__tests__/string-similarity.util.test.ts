import { describe, it, expect } from 'vitest';

import {
  removeVietnameseTones,
  normalizeSearchString,
  levenshteinDistance,
  stringSimilarityRatio,
  tokenSortRatio,
  tokenSetRatio,
  stripCompanyAffixes,
} from '@/shared/utils/string-similarity.util';

describe('string-similarity.util', () => {
  describe('removeVietnameseTones', () => {
    it('strips Vietnamese diacritics accurately', () => {
      expect(removeVietnameseTones('Công Ty Cổ Phần Dệt May Đông Nam')).toBe(
        'Cong Ty Co Phan Det May Dong Nam',
      );
      expect(removeVietnameseTones('Điểm Cân Sợi Đóng Gói')).toBe(
        'Diem Can Soi Dong Goi',
      );
    });
  });

  describe('normalizeSearchString', () => {
    it('strips punctuation and extra whitespace', () => {
      expect(normalizeSearchString('  CÔNG TY TNHH (SX-TM) MINH ĐẠT!  ')).toBe(
        'cong ty tnhh sx tm minh dat',
      );
    });
  });

  describe('stripCompanyAffixes', () => {
    it('removes common legal prefixes to isolate core brand name', () => {
      expect(stripCompanyAffixes('CÔNG TY CỔ PHẦN DỆT MAY ĐÔNG NAM')).toBe(
        'det may dong nam',
      );
      expect(stripCompanyAffixes('CÔNG TY TNHH SX TM MINH ĐẠT')).toBe(
        'minh dat',
      );
      expect(stripCompanyAffixes('CƠ SỞ DỆT HIỆP THỦY')).toBe('det hiep thuy');
    });
  });

  describe('levenshteinDistance', () => {
    it('calculates correct edit distance', () => {
      expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
      expect(levenshteinDistance('vinhphat', 'vinhphat')).toBe(0);
      expect(levenshteinDistance('', 'test')).toBe(4);
    });
  });

  describe('stringSimilarityRatio', () => {
    it('computes basic Levenshtein ratio correctly', () => {
      expect(stringSimilarityRatio('abc', 'abc')).toBe(1.0);
      expect(stringSimilarityRatio('abc', '')).toBe(0.0);
      expect(stringSimilarityRatio('kitten', 'sitting')).toBeCloseTo(4 / 7, 2);
    });
  });

  describe('tokenSortRatio & tokenSetRatio', () => {
    it('returns 1.0 for identical phrases regardless of word ordering', () => {
      const s1 = 'Dệt May Đông Nam';
      const s2 = 'Đông Nam Dệt May';
      expect(tokenSortRatio(s1, s2)).toBe(1.0);
    });

    it('scores high using tokenSetRatio for abbreviation variants', () => {
      const raw = 'Công Ty CP Dệt May Đông Nam';
      const canonical = 'Công Ty Cổ Phần Dệt May Đông Nam';
      const ratio = tokenSetRatio(raw, canonical);
      expect(ratio).toBeGreaterThanOrEqual(0.85);
    });

    it('scores 1.0 after stripping company affixes for identical brands', () => {
      const brand1 = stripCompanyAffixes('Công Ty CP Dệt May Đông Nam');
      const brand2 = stripCompanyAffixes('Công Ty Cổ Phần Dệt May Đông Nam');
      expect(tokenSortRatio(brand1, brand2)).toBe(1.0);
    });
  });
});
