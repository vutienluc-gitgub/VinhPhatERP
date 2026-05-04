import { z } from 'zod';

export const SUPPLIER_STATUSES = ['active', 'inactive'] as const;

export const SUPPLIER_STATUS_LABELS: Record<
  (typeof SUPPLIER_STATUSES)[number],
  string
> = {
  active: 'Hoạt động',
  inactive: 'Ngưng hợp tác',
};

export const supplierSchema = z.object({
  code: z
    .string()
    .min(1, 'Mã NCC là bắt buộc')
    .max(50, 'Mã NCC tối đa 50 ký tự'),
  name: z
    .string()
    .min(1, 'Tên NCC là bắt buộc')
    .max(200, 'Tên NCC tối đa 200 ký tự'),
  category: z.string().min(1, 'Chọn danh mục NCC'),
  phone: z
    .string()
    .regex(/^(\+?[0-9\s\-().]{8,20})?$/, 'Số điện thoại không hợp lệ')
    .optional()
    .or(z.literal('')),
  email: z.string().email('Email không hợp lệ').or(z.literal('')).optional(),
  address: z.string().max(500).optional(),
  tax_code: z
    .string()
    .regex(/^(\d{10}|\d{13})?$/, 'Mã số thuế phải có 10 hoặc 13 chữ số')
    .max(20)
    .optional()
    .or(z.literal('')),
  contact_person: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
  status: z.enum(SUPPLIER_STATUSES),
});

export type SupplierFormValues = z.infer<typeof supplierSchema>;

export const supplierDefaults: SupplierFormValues = {
  code: '',
  name: '',
  category: '',
  phone: '',
  email: '',
  address: '',
  tax_code: '',
  contact_person: '',
  notes: '',
  status: 'active',
};

/* ── Quick-create schema (minimal fields only) ── */

export const quickSupplierSchema = z.object({
  code: z.string().min(1, 'Ma NCC la bat buoc'),
  name: z.string().min(1, 'Ten NCC la bat buoc'),
  category: z.string().min(1, 'Danh mục là bắt buộc'),
  phone: z.string().optional(),
});

export type QuickSupplierValues = z.infer<typeof quickSupplierSchema>;
