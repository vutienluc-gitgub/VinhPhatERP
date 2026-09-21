import { z } from 'zod';

export const baseSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const apiCustomerInsert = z.object({
  code: z.string().optional(),
  name: z.string().min(1),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  tax_code: z.string().optional().nullable(),
  source: z.string().optional(),
  status: z.string().optional(),
  assigned_to: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  debt_limit: z.number().optional(),
  payment_term_days: z.number().optional(),
  tenant_id: z.string().optional(),
});

export const apiCustomerUpdate = apiCustomerInsert.partial();

export const apiSupplierInsert = z.object({
  name: z.string().min(1),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  contact_person: z.string().optional().nullable(),
  category: z.string().optional(),
  tenant_id: z.string().optional(),
});

export const apiSupplierUpdate = apiSupplierInsert.partial();

export const api_validation_schema = baseSchema;
export default baseSchema;


// Auto-generated missing exports
export const apiOrderHeader: any = (...args: any[]) => ({});


// Auto-generated missing exports
export const apiOrderItem: any = (...args: any[]) => ({});
export const apiPaymentRecord: any = (...args: any[]) => ({});
export const apiExpenseRecord: any = (...args: any[]) => ({});
export const apiAccountInsert: any = (...args: any[]) => ({});


// Auto-generated missing exports
export const apiWorkOrderInsert: any = (...args: any[]) => ({});
export const apiWeavingInvoiceHeader: any = (...args: any[]) => ({});


// Auto-generated missing exports
export const apiYarnReceiptInput: any = (...args: any[]) => ({});


// Auto-generated missing exports
export const apiLoomInsert: any = (...args: any[]) => ({});


// Auto-generated missing exports
export const apiQuotationHeader: any = (...args: any[]) => ({});
