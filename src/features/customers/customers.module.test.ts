import { describe, expect, it } from 'vitest'

import {
  CUSTOMER_STATUS_LABELS,
  customersDefaultValues,
  customersSchema,
} from '@/features/customers/customers.module'

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
      notes: '',
      status: 'active',
    })

    expect(result.code).toBe('KH01')
    expect(result.name).toBe('Cong ty A')
    expect(result.email).toBe('')
  })

  it('keeps stable defaults and status labels', () => {
    expect(customersDefaultValues.status).toBe('active')
    expect(CUSTOMER_STATUS_LABELS).toEqual({
      active: 'Hoạt động',
      inactive: 'Ngừng hoạt động',
    })
  })
})