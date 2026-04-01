import { describe, expect, it } from 'vitest'

import {
  SUPPLIER_CATEGORIES,
  SUPPLIER_CATEGORY_LABELS,
  SUPPLIER_STATUS_LABELS,
  supplierDefaults,
  supplierSchema,
} from '@/features/suppliers/suppliers.module'

describe('suppliers.module', () => {
  it('accepts valid supplier data', () => {
    const result = supplierSchema.parse({
      code: 'NCC-001',
      name: 'Công ty Sợi ABC',
      category: 'yarn',
      phone: '0901234567',
      email: 'abc@supplier.com',
      address: '123 Đường A, Q.1',
      tax_code: '0312345678',
      contact_person: 'Nguyễn Văn A',
      notes: 'Giao hàng nhanh',
      status: 'active',
    })

    expect(result.code).toBe('NCC-001')
    expect(result.name).toBe('Công ty Sợi ABC')
    expect(result.category).toBe('yarn')
  })

  it('accepts empty optional fields', () => {
    const result = supplierSchema.parse({
      code: 'NCC-002',
      name: 'NCC Test',
      category: 'dye',
      phone: '',
      email: '',
      address: '',
      tax_code: '',
      contact_person: '',
      notes: '',
      status: 'active',
    })

    expect(result.phone).toBe('')
    expect(result.email).toBe('')
  })

  it('rejects missing required fields', () => {
    const result = supplierSchema.safeParse({
      code: '',
      name: '',
      category: 'other',
      status: 'active',
    })

    expect(result.success).toBe(false)
  })

  it('validates tax_code format (10 or 13 digits)', () => {
    expect(supplierSchema.safeParse({
      ...supplierDefaults,
      code: 'T1',
      name: 'Test',
      tax_code: '0312345678',
    }).success).toBe(true)

    expect(supplierSchema.safeParse({
      ...supplierDefaults,
      code: 'T2',
      name: 'Test',
      tax_code: '0312345678901',
    }).success).toBe(true)

    expect(supplierSchema.safeParse({
      ...supplierDefaults,
      code: 'T3',
      name: 'Test',
      tax_code: '12345',
    }).success).toBe(false)
  })

  it('validates category must be in allowed list', () => {
    const result = supplierSchema.safeParse({
      ...supplierDefaults,
      code: 'T4',
      name: 'Test',
      category: 'invalid_cat',
    })
    expect(result.success).toBe(false)
  })

  it('keeps stable defaults and labels', () => {
    expect(supplierDefaults.status).toBe('active')
    expect(supplierDefaults.category).toBe('other')
    expect(SUPPLIER_STATUS_LABELS).toEqual({
      active: 'Hoạt động',
      inactive: 'Ngưng hợp tác',
    })
    expect(SUPPLIER_CATEGORIES).toContain('yarn')
    expect(SUPPLIER_CATEGORIES).toContain('dye')
    expect(SUPPLIER_CATEGORIES).toContain('weaving')
    expect(SUPPLIER_CATEGORY_LABELS.yarn).toBe('Sợi')
  })
})
