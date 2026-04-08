import { describe, expect, it, vi } from 'vitest';

vi.mock('@/core/registry/moduleRegistry', () => ({
  createModule: vi.fn((config) => config),
}));

import {
  calculateQuotationTotals,
  quotationsSchema,
  quotationItemSchema,
} from './quotations.module';

describe('quotations.module schemas', () => {
  describe('quotationItemSchema', () => {
    it('accepts valid data', () => {
      const result = quotationItemSchema.parse({
        fabricType: 'Cotton',
        colorName: 'Trắng',
        widthCm: 160,
        unit: 'kg',
        quantity: 100,
        unitPrice: 150000,
      });
      expect(result.fabricType).toBe('Cotton');
      expect(result.unit).toBe('kg');
      expect(result.widthCm).toBe(160);
    });

    it('rejects missing or negative quantity', () => {
      const result1 = quotationItemSchema.safeParse({
        fabricType: 'Cotton',
        quantity: -5,
        unitPrice: 150000,
      });
      expect(result1.success).toBe(false);

      const result2 = quotationItemSchema.safeParse({
        fabricType: 'Cotton',
        unitPrice: 150000,
      });
      expect(result2.success).toBe(false);
    });
  });

  describe('quotationsSchema', () => {
    it('accepts valid whole quotation data', () => {
      const dbId = '123e4567-e89b-12d3-a456-426614174000';
      const result = quotationsSchema.parse({
        quotationNumber: 'BG-001',
        customerId: dbId,
        quotationDate: '2026-04-03',
        validUntil: '2026-04-10',
        items: [
          {
            fabricType: 'Cotton',
            unit: 'm',
            quantity: 100,
            unitPrice: 150000,
          },
        ],
      });
      expect(result.quotationNumber).toBe('BG-001');
      expect(result.customerId).toBe(dbId);
      expect(result.items.length).toBe(1);
    });

    it('rejects invalid uuid for customerId', () => {
      const result = quotationsSchema.safeParse({
        quotationNumber: 'BG-001',
        customerId: 'invalid-id',
        quotationDate: '2026-04-03',
        items: [
          {
            fabricType: 'Cotton',
            quantity: 100,
            unitPrice: 100,
          },
        ],
      });
      expect(result.success).toBe(false);
    });

    it('validates validUntil must be after quotationDate', () => {
      const dbId = '123e4567-e89b-12d3-a456-426614174000';
      const result = quotationsSchema.safeParse({
        quotationNumber: 'BG-001',
        customerId: dbId,
        quotationDate: '2026-04-03',
        validUntil: '2026-04-01', // Before date
        items: [
          {
            fabricType: 'Cotton',
            quantity: 100,
            unitPrice: 100,
          },
        ],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('calculateQuotationTotals', () => {
    it('calculates totals correctly with percent discount', () => {
      const items = [
        {
          fabricType: '',
          unit: 'm' as const,
          quantity: 100,
          unitPrice: 2000,
        },
      ];

      const result = calculateQuotationTotals(items, 'percent', 10, 8);
      // subtotal = 200000
      // discount = 200000 * 10% = 20000
      // totalBeforeVat = 180000
      // vat = 180000 * 8% = 14400
      // total = 194400

      expect(result.subtotal).toBe(200000);
      expect(result.discountAmount).toBe(20000);
      expect(result.totalBeforeVat).toBe(180000);
      expect(result.vatAmount).toBe(14400);
      expect(result.totalAmount).toBe(194400);
    });

    it('calculates totals correctly with fixed amount discount', () => {
      const items = [
        {
          fabricType: '',
          unit: 'm' as const,
          quantity: 50,
          unitPrice: 1000,
        },
        {
          fabricType: '',
          unit: 'm' as const,
          quantity: 20,
          unitPrice: 500,
        },
      ];

      const result = calculateQuotationTotals(items, 'amount', 5000, 10);
      // subtotal = 50000 + 10000 = 60000
      // discount = 5000
      // totalBeforeVat = 55000
      // vat = 5500
      // totalAmount = 60500

      expect(result.subtotal).toBe(60000);
      expect(result.discountAmount).toBe(5000);
      expect(result.totalBeforeVat).toBe(55000);
      expect(result.vatAmount).toBe(5500);
      expect(result.totalAmount).toBe(60500);
    });
  });
});
