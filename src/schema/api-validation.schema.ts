/**
 * API-layer validation schemas.
 *
 * These validate the DB-level payloads (snake_case) before they reach
 * Supabase RPC or direct table writes. They complement the form-level
 * schemas (camelCase) which guard the UI.
 *
 * Usage:
 *   import { apiOrderHeader } from '@/schema/api-validation.schema';
 *   import { validateApiInput } from '@/lib/validate-api-input';
 *   const validated = validateApiInput(apiOrderHeader, header);
 */
import { z } from 'zod';

// ── Shared primitives ──────────────────────────────────────────────────────
const uuid = z.string().uuid();
const nonEmpty = z.string().trim().min(1);
const positiveNum = z.number().positive();
const nonNegNum = z.number().min(0);
const optionalStr = z.string().trim().optional().or(z.literal(''));
const nullableStr = z.string().trim().nullable().optional();
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Ngày không hợp lệ');

// ── Orders ────────────────────────────────────────────────────────────────
export const apiOrderHeader = z.object({
  order_number: nonEmpty.optional(),
  customer_id: uuid,
  order_date: dateStr,
  delivery_date: z.string().nullable().optional(),
  notes: nullableStr,
});

export const apiOrderItem = z.object({
  fabric_type: nonEmpty,
  color_name: nullableStr,
  color_code: nullableStr,
  unit: z.enum(['m', 'kg']),
  quantity: positiveNum,
  unit_price: nonNegNum,
});

// ── Suppliers ─────────────────────────────────────────────────────────────
export const apiSupplierInsert = z.object({
  name: nonEmpty,
  code: nonEmpty,
  category: nonEmpty,
  status: z.string().default('active'),
  email: nullableStr,
  phone: nullableStr,
  tax_code: nullableStr,
  address: nullableStr,
});

// ── Customers ─────────────────────────────────────────────────────────────
export const apiCustomerInsert = z.object({
  name: nonEmpty,
  code: nonEmpty,
  email: nullableStr,
  phone: nullableStr,
  tax_code: nullableStr,
  address: nullableStr,
});

// ── Payments ──────────────────────────────────────────────────────────────
export const apiPaymentRecord = z.object({
  order_id: uuid,
  customer_id: uuid,
  payment_number: nonEmpty,
  payment_date: dateStr,
  amount: positiveNum,
  method: z.string().optional(),
  notes: nullableStr,
});

export const apiExpenseRecord = z.object({
  expense_number: nonEmpty,
  expense_date: dateStr,
  amount: positiveNum,
  category: nonEmpty,
  description: optionalStr,
});

export const apiAccountInsert = z.object({
  name: nonEmpty,
  type: nonEmpty,
  bank_name: nullableStr,
  account_number: nullableStr,
  initial_balance: nonNegNum,
  status: z.string().default('active'),
});

// ── Quotations ────────────────────────────────────────────────────────────
export const apiQuotationHeader = z.object({
  quotation_number: nonEmpty,
  customer_id: uuid,
  quotation_date: dateStr,
  valid_until: z.string().nullable().optional(),
  subtotal: nonNegNum,
  total_amount: nonNegNum,
  status: z.literal('draft'),
});

export const apiQuotationItem = z.object({
  fabric_type: nonEmpty,
  unit: nonEmpty,
  quantity: positiveNum,
  unit_price: nonNegNum,
  sort_order: nonNegNum,
});

// ── Work Orders ───────────────────────────────────────────────────────────
export const apiWorkOrderInsert = z.object({
  bom_template_id: uuid,
  target_quantity: positiveNum,
  target_unit: z.string().default('m'),
  supplier_id: uuid,
  weaving_unit_price: nonNegNum,
});

// ── Yarn Receipts ─────────────────────────────────────────────────────────
export const apiYarnReceiptInput = z.object({
  supplierId: uuid,
  receiptDate: dateStr,
  items: z
    .array(
      z.object({
        yarnType: nonEmpty,
        quantity: positiveNum,
        unitPrice: nonNegNum,
        unit: nonEmpty,
      }),
    )
    .min(1, 'Cần ít nhất 1 dòng sợi'),
});

// ── Weaving Invoices ──────────────────────────────────────────────────────
export const apiWeavingInvoiceHeader = z.object({
  supplier_id: uuid,
  invoice_date: dateStr,
  delivery_date: z.string().nullable().optional(),
});

// ── Tasks (Operations) ───────────────────────────────────────────────────
export const apiTaskInsert = z.object({
  title: nonEmpty,
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  task_type: z.enum(['growth', 'maintenance', 'admin']).default('growth'),
  status: z
    .enum(['todo', 'in_progress', 'blocked', 'review', 'done', 'cancelled'])
    .default('todo'),
});

// ── Looms ─────────────────────────────────────────────────────────────────
export const apiLoomInsert = z.object({
  code: nonEmpty,
  name: nonEmpty,
  loom_type: z
    .enum(['rapier', 'air_jet', 'water_jet', 'shuttle', 'other'])
    .default('rapier'),
  supplier_id: uuid,
  status: z.enum(['active', 'maintenance', 'inactive']).default('active'),
});

// ── Fabric Catalog ────────────────────────────────────────────────────────
export const apiFabricCatalogInsert = z.object({
  code: nonEmpty,
  name: nonEmpty,
  status: z.string().default('active'),
});

// ── Yarn Catalog ──────────────────────────────────────────────────────────
export const apiYarnCatalogInsert = z.object({
  code: nonEmpty,
  name: nonEmpty,
  unit: nonEmpty,
  status: z.string().default('active'),
});

// ── Shipping Rates ────────────────────────────────────────────────────────
export const apiShippingRateInsert = z.object({
  destination: nonEmpty,
  rate_per_kg: positiveNum,
});

// ── Raw Fabric ────────────────────────────────────────────────────────────
export const apiRawFabricInsert = z.object({
  roll_number: nonEmpty,
  weight_kg: positiveNum,
  length_m: nonNegNum,
});

// ── Finished Fabric ───────────────────────────────────────────────────────
export const apiFinishedFabricInsert = z.object({
  roll_number: nonEmpty,
  weight_kg: positiveNum,
  length_m: nonNegNum,
});

// ── Shipments ─────────────────────────────────────────────────────────────
export const apiShipmentHeader = z.object({
  order_id: uuid,
  customer_id: uuid,
  shipment_date: dateStr,
});

// ── Company Settings ──────────────────────────────────────────────────────
export const apiCompanySettings = z.object({
  company_name: nonEmpty,
});
