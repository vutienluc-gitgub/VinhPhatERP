import { z } from 'zod';

/* ── Types ── */

export type CompanySettingRow = {
  id: string;
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
};

/**
 * Danh sách các key chuẩn trong bảng company_settings.
 * Dùng để map key-value thành object phẳng khi load/save.
 */
export const COMPANY_SETTING_KEYS = [
  'company_name',
  'address',
  'tax_code',
  'phone',
  'email',
  'website',
  'bank_account',
  'bank_name',
  'logo_url',
  'default_user_role',
  'layout_mode',
] as const;

export type CompanySettingKey = (typeof COMPANY_SETTING_KEYS)[number];

/** Object phẳng sau khi map từ key-value rows */
export type CompanySettingsMap = Record<CompanySettingKey, string>;

/* ── Zod Schema (form validation) ── */

export const companySettingsSchema = z.object({
  company_name: z.string().trim().min(2, 'Tên công ty tối thiểu 2 ký tự'),
  address: z.string().trim().min(2, 'Nhập địa chỉ'),
  tax_code: z.string().trim().max(20).optional().or(z.literal('')),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  email: z
    .string()
    .trim()
    .email('Email không hợp lệ')
    .optional()
    .or(z.literal('')),
  website: z.string().trim().max(200).optional().or(z.literal('')),
  bank_account: z.string().trim().max(50).optional().or(z.literal('')),
  bank_name: z.string().trim().max(200).optional().or(z.literal('')),
  logo_url: z.string().trim().max(500).optional().or(z.literal('')),
  default_user_role: z
    .enum(['admin', 'manager', 'staff', 'viewer', 'sale', 'customer'])
    .default('staff'),
  layout_mode: z.enum(['boxed', 'fluid']).default('boxed'),
});

export type CompanySettingsFormValues = z.infer<typeof companySettingsSchema>;

export const companySettingsDefaultValues: CompanySettingsFormValues = {
  company_name: '',
  address: '',
  tax_code: '',
  phone: '',
  email: '',
  website: '',
  bank_account: '',
  bank_name: '',
  logo_url: '',
  default_user_role: 'staff',
  layout_mode: 'boxed',
};

/* ── Helpers ── */

/** Chuyển mảng key-value rows thành object phẳng */
export function rowsToSettingsMap(
  rows: CompanySettingRow[],
): CompanySettingsMap {
  const map = { ...companySettingsDefaultValues } as CompanySettingsMap;
  for (const row of rows) {
    if (COMPANY_SETTING_KEYS.includes(row.key as CompanySettingKey)) {
      map[row.key as CompanySettingKey] = row.value;
    }
  }
  return map;
}

/** Chuyển object phẳng thành mảng { key, value } để upsert */
export function settingsMapToUpsertRows(
  map: CompanySettingsFormValues,
): { key: string; value: string }[] {
  return COMPANY_SETTING_KEYS.map((key) => ({
    key,
    value: map[key] ?? '',
  }));
}
