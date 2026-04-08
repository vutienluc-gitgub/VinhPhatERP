import { describe, expect, it } from 'vitest';

import {
  CUSTOMER_SOURCE_LABELS,
  CUSTOMER_STATUS_LABELS,
  customersDefaultValues,
  customersSchema,
} from '@/schema/customer.schema';

describe('customers.module', () => {
  it('trims required fields and accepts empty optional fields', () => {
    const result = customersSchema.parse({
      code: '  KH01  ',
      name: '  Cong ty A  ',
      phone: '',
      email: '',
      address: '',
      tax_code: '',
      contact_person: '',
      source: 'facebook',
      notes: '',
      status: 'active',
    });

    expect(result.code).toBe('KH01');
    expect(result.name).toBe('Cong ty A');
    expect(result.email).toBe('');
    expect(result.source).toBe('facebook');
  });

  it('keeps stable defaults and labels', () => {
    expect(customersDefaultValues.source).toBe('other');
    expect(customersDefaultValues.status).toBe('active');
    expect(CUSTOMER_SOURCE_LABELS.facebook).toBe('Facebook');
    expect(CUSTOMER_STATUS_LABELS).toEqual({
      active: 'Hoạt động',
      inactive: 'Ngừng hoạt động',
    });
  });
});
