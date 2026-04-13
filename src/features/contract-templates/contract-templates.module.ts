import { z } from 'zod';

import { untypedDb } from '@/services/supabase/untyped';
import { ContractType, CONTRACT_TYPES } from '@/schema';

// ── Zod Schema ───────────────────────────────────────────────────────────────

export const contractTemplateSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(CONTRACT_TYPES),
  name: z.string().trim().min(1, 'Tên mẫu không được để trống'),
  content: z.string().min(1, 'Nội dung mẫu không được để trống'),
  is_active: z.boolean().default(true),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string().uuid().nullable().optional(),
});

export const updateTemplateInputSchema = z.object({
  name: z.string().trim().min(1, 'Tên mẫu không được để trống').optional(),
  content: z.string().min(1, 'Nội dung mẫu không được để trống').optional(),
  is_active: z.boolean().optional(),
});

// ── Types ────────────────────────────────────────────────────────────────────

export type ContractTemplate = z.infer<typeof contractTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateInputSchema>;

// ── Placeholders reference ───────────────────────────────────────────────────

export const TEMPLATE_PLACEHOLDERS: { key: string; label: string }[] = [
  {
    key: 'contract_number',
    label: 'So hop dong',
  },
  {
    key: 'contract_date',
    label: 'Ngay ky',
  },
  {
    key: 'party_a_name',
    label: 'Ten ben A',
  },
  {
    key: 'party_a_address',
    label: 'Dia chi ben A',
  },
  {
    key: 'party_a_tax_code',
    label: 'MST ben A',
  },
  {
    key: 'party_a_representative',
    label: 'Nguoi dai dien ben A',
  },
  {
    key: 'party_a_title',
    label: 'Chuc vu dai dien ben A',
  },
  {
    key: 'party_b_name',
    label: 'Ten cong ty Vinh Phat',
  },
  {
    key: 'party_b_address',
    label: 'Dia chi Vinh Phat',
  },
  {
    key: 'party_b_tax_code',
    label: 'MST Vinh Phat',
  },
  {
    key: 'party_b_bank_account',
    label: 'Tai khoan ngan hang',
  },
  {
    key: 'party_b_representative',
    label: 'Nguoi dai dien Vinh Phat',
  },
  {
    key: 'payment_term',
    label: 'Dieu khoan thanh toan',
  },
  {
    key: 'effective_date',
    label: 'Ngay hieu luc',
  },
  {
    key: 'expiry_date',
    label: 'Ngay het han',
  },
];

// ── Service helpers ──────────────────────────────────────────────────────────

const db = {
  templates: () => untypedDb.from('contract_templates'),
};

// ── Service functions ────────────────────────────────────────────────────────

/**
 * Lay danh sach tat ca contract templates.
 * Requirement 3.1: Ho tro it nhat 2 loai template: sale va purchase.
 */
export async function getTemplates(): Promise<ContractTemplate[]> {
  const { data, error } = await db
    .templates()
    .select('*')
    .order('type')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ContractTemplate[];
}

/**
 * Lay mot template theo id.
 * Requirement 3.2: Cho phep Admin xem va chinh sua noi dung template.
 */
export async function getTemplateById(id: string): Promise<ContractTemplate> {
  const { data, error } = await db
    .templates()
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as ContractTemplate;
}

/**
 * Cap nhat noi dung template.
 * Requirement 3.2: Cho phep Admin chinh sua noi dung dieu khoan co dinh.
 * Requirement 3.3: Chi ap dung cho hop dong moi, khong anh huong hop dong cu.
 */
export async function updateTemplate(
  id: string,
  data: UpdateTemplateInput,
): Promise<ContractTemplate> {
  const { data: updated, error } = await db
    .templates()
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return updated as ContractTemplate;
}

/**
 * Lay template active theo loai hop dong.
 */
export async function getActiveTemplateByType(
  type: ContractType,
): Promise<ContractTemplate | null> {
  const { data, error } = await db
    .templates()
    .select('*')
    .eq('type', type)
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as ContractTemplate | null;
}
