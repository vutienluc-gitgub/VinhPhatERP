import { describe, expect, it, vi } from 'vitest';

vi.mock('@/core/registry/moduleRegistry', () => ({
  createModule: vi.fn((config) => config),
}));

import {
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
  emptyOrderItem,
  orderItemSchema,
  ordersDefaultValues,
  ordersSchema,
} from '@/features/orders/orders.module';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

const validItem = {
  fabricType: 'Cotton',
  colorName: 'Trắng',
  colorCode: 'W01',
  quantity: 100,
  unitPrice: 50000,
};

const validOrder = {
  orderNumber: 'DH2603-0001',
  customerId: VALID_UUID,
  orderDate: '2026-03-20',
  deliveryDate: '2026-04-01',
  notes: '',
  items: [validItem],
};

describe('orderItemSchema', () => {
  it('accepts valid item', () => {
    const result = orderItemSchema.parse(validItem);
    expect(result.fabricType).toBe('Cotton');
    expect(result.quantity).toBe(100);
  });

  it('trims fabricType whitespace', () => {
    const result = orderItemSchema.parse({
      ...validItem,
      fabricType: '  Cotton  ',
    });
    expect(result.fabricType).toBe('Cotton');
  });

  it('rejects fabricType shorter than 2 chars', () => {
    const result = orderItemSchema.safeParse({
      ...validItem,
      fabricType: 'A',
    });
    expect(result.success).toBe(false);
  });

  it('rejects zero quantity', () => {
    const result = orderItemSchema.safeParse({
      ...validItem,
      quantity: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative quantity', () => {
    const result = orderItemSchema.safeParse({
      ...validItem,
      quantity: -5,
    });
    expect(result.success).toBe(false);
  });

  it('accepts zero unitPrice', () => {
    const result = orderItemSchema.parse({
      ...validItem,
      unitPrice: 0,
    });
    expect(result.unitPrice).toBe(0);
  });

  it('rejects negative unitPrice', () => {
    const result = orderItemSchema.safeParse({
      ...validItem,
      unitPrice: -1,
    });
    expect(result.success).toBe(false);
  });

  it('accepts empty optional fields', () => {
    const result = orderItemSchema.parse({
      fabricType: 'Silk',
      colorName: '',
      colorCode: '',
      quantity: 10,
      unitPrice: 0,
    });
    expect(result.colorName).toBe('');
    expect(result.colorCode).toBe('');
  });
});

describe('ordersSchema', () => {
  it('accepts valid order', () => {
    const result = ordersSchema.parse(validOrder);
    expect(result.orderNumber).toBe('DH2603-0001');
    expect(result.items).toHaveLength(1);
  });

  it('trims orderNumber whitespace', () => {
    const result = ordersSchema.parse({
      ...validOrder,
      orderNumber: '  DH2603-0001  ',
    });
    expect(result.orderNumber).toBe('DH2603-0001');
  });

  it('rejects orderNumber shorter than 3 chars', () => {
    const result = ordersSchema.safeParse({
      ...validOrder,
      orderNumber: 'AB',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid customerId (not UUID)', () => {
    const result = ordersSchema.safeParse({
      ...validOrder,
      customerId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty orderDate', () => {
    const result = ordersSchema.safeParse({
      ...validOrder,
      orderDate: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty items array', () => {
    const result = ordersSchema.safeParse({
      ...validOrder,
      items: [],
    });
    expect(result.success).toBe(false);
  });

  it('allows deliveryDate to be empty', () => {
    const result = ordersSchema.parse({
      ...validOrder,
      deliveryDate: '',
    });
    expect(result.deliveryDate).toBe('');
  });

  it('rejects deliveryDate before orderDate', () => {
    const result = ordersSchema.safeParse({
      ...validOrder,
      orderDate: '2026-04-10',
      deliveryDate: '2026-04-01',
    });
    expect(result.success).toBe(false);
  });

  it('accepts deliveryDate equal to orderDate', () => {
    const result = ordersSchema.parse({
      ...validOrder,
      orderDate: '2026-04-01',
      deliveryDate: '2026-04-01',
    });
    expect(result.deliveryDate).toBe('2026-04-01');
  });

  it('rejects notes longer than 500 chars', () => {
    const result = ordersSchema.safeParse({
      ...validOrder,
      notes: 'A'.repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

describe('constants and defaults', () => {
  it('has 6 order statuses', () => {
    expect(ORDER_STATUSES).toHaveLength(6);
    expect(ORDER_STATUSES).toContain('pending_review');
    expect(ORDER_STATUSES).toContain('draft');
    expect(ORDER_STATUSES).toContain('cancelled');
  });

  it('keeps stable status labels', () => {
    expect(ORDER_STATUS_LABELS).toEqual({
      pending_review: 'Chờ duyệt',
      draft: 'Nháp',
      confirmed: 'Đã xác nhận',
      in_progress: 'Đang xử lý',
      completed: 'Hoàn thành',
      cancelled: 'Đã huỷ',
    });
  });

  it('has correct emptyOrderItem defaults', () => {
    expect(emptyOrderItem.fabricType).toBe('');
    expect(emptyOrderItem.quantity).toBe(0);
    expect(emptyOrderItem.unitPrice).toBe(0);
  });

  it('has one empty item in ordersDefaultValues', () => {
    expect(ordersDefaultValues.items).toHaveLength(1);
    expect(ordersDefaultValues.orderNumber).toBe('');
    expect(ordersDefaultValues.customerId).toBe('');
  });
});
