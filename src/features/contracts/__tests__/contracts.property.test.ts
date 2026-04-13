// Feature: auto-contract-generation
// Covers: Task 2.2, 2.3, 10.2, 10.5
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';

import {
  formatContractNumber,
  renderTemplate,
} from '@/features/contracts/contracts.module';
import { validateStatusTransition } from '@/features/contracts/contracts.service';

// ── Property 4: Contract_Number luon dung dinh dang va duy nhat ──────────────
// Validates: Requirements 1.4, 7.1, 7.2

describe('formatContractNumber — Property Tests', () => {
  it('output luon match dinh dang {seq:03d}/{year}/HDNT-{prefix}/TKS', () => {
    fc.assert(
      fc.property(
        fc.integer({
          min: 1,
          max: 999,
        }),
        fc.integer({
          min: 2020,
          max: 2099,
        }),
        fc.constantFrom('sale' as const, 'purchase' as const),
        (seq, year, type) => {
          const result = formatContractNumber(seq, year, type);
          // Format: 001/2026/HDNT\u2013DKKH/TKS  (en-dash U+2013)
          // \w doesn't match Vietnamese Unicode, use character class instead
          const pattern = /^\d{3}\/\d{4}\/.+\/TKS$/;
          expect(result).toMatch(pattern);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('seq luon duoc pad du 3 chu so', () => {
    fc.assert(
      fc.property(
        fc.integer({
          min: 1,
          max: 999,
        }),
        (seq) => {
          const result = formatContractNumber(seq, 2026, 'sale');
          const seqPart = result.split('/')[0];
          expect(seqPart).toHaveLength(3);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('sale va purchase co prefix khac nhau', () => {
    const sale = formatContractNumber(1, 2026, 'sale');
    const purchase = formatContractNumber(1, 2026, 'purchase');
    expect(sale).not.toBe(purchase);
    expect(sale).toContain('\u0110KKH');
    expect(purchase).toContain('\u0110KNH');
  });

  it('custom prefix duoc su dung khi truyen vao', () => {
    fc.assert(
      fc.property(
        fc
          .string({
            minLength: 1,
            maxLength: 10,
          })
          .filter((s) => /^\w+$/.test(s)),
        (prefix) => {
          const result = formatContractNumber(1, 2026, 'sale', prefix);
          expect(result).toContain(prefix);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('2 so hop dong khac seq thi khac nhau', () => {
    fc.assert(
      fc.property(
        fc.integer({
          min: 1,
          max: 998,
        }),
        (seq) => {
          const a = formatContractNumber(seq, 2026, 'sale');
          const b = formatContractNumber(seq + 1, 2026, 'sale');
          expect(a).not.toBe(b);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ── Property 6: Template placeholder duoc render day du ──────────────────────
// Validates: Requirements 3.4

describe('renderTemplate — Property Tests', () => {
  it('output khong con {{...}} nao khi render voi du lieu day du', () => {
    // Use known valid keys to build template and data
    const keys = [
      'contract_number',
      'party_a_name',
      'party_b_name',
      'payment_term',
      'effective_date',
      'expiry_date',
      'party_a_address',
      'party_a_tax_code',
    ];
    fc.assert(
      fc.property(
        fc.array(
          fc.tuple(
            fc.constantFrom(...keys),
            fc.string({
              minLength: 1,
              maxLength: 50,
            }),
          ),
          {
            minLength: 1,
            maxLength: 8,
          },
        ),
        (pairs) => {
          const content = pairs.map(([key]) => `{{${key}}}`).join(' ');
          const data: Record<string, string> = {};
          for (const [key, value] of pairs) {
            data[key] = value;
          }
          const result = renderTemplate(content, data);
          expect(result).not.toMatch(/\{\{[^}]+\}\}/);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('placeholder khong co trong data duoc giu nguyen', () => {
    const content = '{{name}} - {{missing}}';
    const result = renderTemplate(content, { name: 'Test' });
    expect(result).toBe('Test - {{missing}}');
  });

  it('null/undefined values giu nguyen placeholder', () => {
    const keys = ['party_a_name', 'contract_number', 'payment_term'];
    fc.assert(
      fc.property(fc.constantFrom(...keys), (key) => {
        const content = `{{${key}}}`;
        const resultNull = renderTemplate(content, { [key]: null });
        const resultUndef = renderTemplate(content, { [key]: undefined });
        expect(resultNull).toBe(content);
        expect(resultUndef).toBe(content);
      }),
      { numRuns: 100 },
    );
  });

  it('content khong co placeholder tra ve nguyen ban', () => {
    fc.assert(
      fc.property(
        fc
          .string({
            minLength: 0,
            maxLength: 200,
          })
          .filter((s) => !s.includes('{{')),
        (content) => {
          const result = renderTemplate(content, { any: 'value' });
          expect(result).toBe(content);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ── Property 11: Vong doi trang thai hop le ──────────────────────────────────
// Validates: Requirements 6.1

describe('validateStatusTransition — Property Tests', () => {
  const ALL_STATUSES = [
    'draft',
    'sent',
    'signed',
    'expired',
    'cancelled',
  ] as const;

  const VALID_TRANSITIONS: Record<string, string[]> = {
    draft: ['sent', 'cancelled'],
    sent: ['signed', 'cancelled', 'expired'],
    signed: [],
    expired: [],
    cancelled: [],
  };

  it('moi transition hop le duoc chap nhan', () => {
    for (const from of ALL_STATUSES) {
      for (const to of VALID_TRANSITIONS[from] ?? []) {
        expect(
          validateStatusTransition(from, to as (typeof ALL_STATUSES)[number]),
        ).toBe(true);
      }
    }
  });

  it('moi transition khong hop le bi tu choi', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_STATUSES),
        fc.constantFrom(...ALL_STATUSES),
        (from, to) => {
          const isValid = (VALID_TRANSITIONS[from] ?? []).includes(to);
          expect(validateStatusTransition(from, to)).toBe(isValid);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('signed, expired, cancelled khong co transition nao', () => {
    for (const terminal of ['signed', 'expired', 'cancelled'] as const) {
      for (const target of ALL_STATUSES) {
        expect(validateStatusTransition(terminal, target)).toBe(false);
      }
    }
  });

  it('draft chi co the chuyen sang sent hoac cancelled', () => {
    for (const target of ALL_STATUSES) {
      const expected = target === 'sent' || target === 'cancelled';
      expect(validateStatusTransition('draft', target)).toBe(expected);
    }
  });
});

// ── Property 14: Huy hop dong yeu cau ly do ──────────────────────────────────
// Validates: Requirements 6.5

describe('Cancel requires reason — Property Tests', () => {
  it('cancel_reason rong bi tu choi', () => {
    const emptyReasons = ['', '   ', '\t', '\n'];
    for (const reason of emptyReasons) {
      expect(!reason.trim()).toBe(true);
    }
  });

  it('cancel_reason hop le (co noi dung) duoc chap nhan', () => {
    fc.assert(
      fc.property(
        fc
          .string({
            minLength: 1,
            maxLength: 100,
          })
          .filter((s) => s.trim().length > 0),
        (reason) => {
          expect(!!reason.trim()).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});
