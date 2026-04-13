import { z } from 'zod';

// ── Status & Type constants ──────────────────────────────────────────────────

export const CONTRACT_STATUSES = [
  'draft',
  'sent',
  'signed',
  'expired',
  'cancelled',
] as const;

export const CONTRACT_TYPES = ['sale', 'purchase'] as const;

export const PARTY_A_TYPES = ['customer', 'supplier'] as const;

// ── TypeScript types ─────────────────────────────────────────────────────────

export type ContractStatus = (typeof CONTRACT_STATUSES)[number];
export type ContractType = (typeof CONTRACT_TYPES)[number];
export type PartyAType = (typeof PARTY_A_TYPES)[number];

// ── Status labels ────────────────────────────────────────────────────────────

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  draft: 'Nháp',
  sent: 'Đã gửi',
  signed: 'Đã ký',
  expired: 'Hết hạn',
  cancelled: 'Đã huỷ',
};

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  sale: 'Hợp Đồng Bán Hàng',
  purchase: 'Hợp Đồng Mua Hàng',
};

// ── Zod Schemas ──────────────────────────────────────────────────────────────

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

export const contractSchema = z.object({
  id: z.string().uuid(),
  contract_number: z.string(),
  type: z.enum(CONTRACT_TYPES),
  status: z.enum(CONTRACT_STATUSES).default('draft'),

  content: z.string(),
  template_id: z.string().uuid().nullable().optional(),

  party_a_type: z.enum(PARTY_A_TYPES),
  party_a_id: z.string().uuid(),
  party_a_name: z.string().trim().min(1, 'Tên bên A không được để trống'),
  party_a_address: z.string().nullable().optional(),
  party_a_tax_code: z.string().nullable().optional(),
  party_a_representative: z.string().nullable().optional(),
  party_a_title: z.string().nullable().optional(),

  party_b_name: z.string().trim().min(1, 'Tên bên B không được để trống'),
  party_b_address: z.string().nullable().optional(),
  party_b_tax_code: z.string().nullable().optional(),
  party_b_bank_account: z.string().nullable().optional(),
  party_b_representative: z.string().nullable().optional(),

  payment_term: z.string().nullable().optional(),
  effective_date: z.string().nullable().optional(),
  expiry_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),

  source_order_id: z.string().uuid().nullable().optional(),

  pdf_url: z.string().nullable().optional(),
  pdf_generated_at: z.string().nullable().optional(),

  sent_at: z.string().nullable().optional(),
  sent_by: z.string().uuid().nullable().optional(),
  signed_at: z.string().nullable().optional(),
  signed_by: z.string().uuid().nullable().optional(),
  signed_file_url: z.string().nullable().optional(),
  cancelled_at: z.string().nullable().optional(),
  cancelled_by: z.string().uuid().nullable().optional(),
  cancel_reason: z.string().nullable().optional(),

  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string().uuid().nullable().optional(),
});

export const contractOrderLinkSchema = z.object({
  id: z.string().uuid(),
  contract_id: z.string().uuid(),
  order_id: z.string().uuid(),
  linked_at: z.string(),
  linked_by: z.string().uuid().nullable().optional(),
});

export const contractAuditLogSchema = z.object({
  id: z.string().uuid(),
  contract_id: z.string().uuid(),
  action: z.string(),
  old_values: z.record(z.unknown()).nullable().optional(),
  new_values: z.record(z.unknown()).nullable().optional(),
  performed_by: z.string().uuid().nullable().optional(),
  performed_at: z.string(),
});

// ── Input schemas ────────────────────────────────────────────────────────────

export const createContractInputSchema = z.object({
  source_type: z.enum(['order', 'customer', 'supplier']),
  source_id: z.string().uuid('ID nguồn không hợp lệ'),
  type: z.enum(CONTRACT_TYPES),
  effective_date: z.string().optional().or(z.literal('')),
  expiry_date: z.string().optional().or(z.literal('')),
  payment_term: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

export const updateContractInputSchema = z.object({
  party_a_name: z.string().trim().min(1).optional(),
  party_a_address: z.string().optional(),
  party_a_tax_code: z.string().optional(),
  party_a_representative: z.string().optional(),
  party_a_title: z.string().optional(),
  party_b_name: z.string().trim().min(1).optional(),
  party_b_address: z.string().optional(),
  party_b_tax_code: z.string().optional(),
  party_b_bank_account: z.string().optional(),
  party_b_representative: z.string().optional(),
  payment_term: z.string().optional(),
  effective_date: z.string().optional(),
  expiry_date: z.string().optional(),
  notes: z.string().optional(),
  content: z.string().optional(),
});

// ── Inferred types ───────────────────────────────────────────────────────────

export type Contract = z.infer<typeof contractSchema>;
export type ContractTemplate = z.infer<typeof contractTemplateSchema>;
export type ContractOrderLink = z.infer<typeof contractOrderLinkSchema>;
export type ContractAuditLog = z.infer<typeof contractAuditLogSchema>;
export type CreateContractInput = z.infer<typeof createContractInputSchema>;
export type UpdateContractInput = z.infer<typeof updateContractInputSchema>;

// ── Template update schema ───────────────────────────────────────────────────

export const updateTemplateInputSchema = z.object({
  name: z.string().trim().min(1, 'Ten mau khong duoc de trong').optional(),
  content: z.string().min(1, 'Noi dung mau khong duoc de trong').optional(),
  is_active: z.boolean().optional(),
});

export type UpdateTemplateInput = z.infer<typeof updateTemplateInputSchema>;

// ── Template placeholders ────────────────────────────────────────────────────

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
    label: 'Ten ben A (Doi tac)',
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

// ── Filter type ──────────────────────────────────────────────────────────────

export type ContractsFilter = {
  search?: string;
  status?: ContractStatus;
  type?: ContractType;
  partyAId?: string;
  dateFrom?: string;
  dateTo?: string;
};
