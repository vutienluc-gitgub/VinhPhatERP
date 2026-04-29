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
  // Company info
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
  // Finance
  'default_currency',
  'default_vat_rate',
  'default_payment_terms',
  'default_credit_limit',
  // Numbering
  'order_prefix',
  'quotation_prefix',
  'invoice_prefix',
  'payment_prefix',
  'expense_prefix',
  'numbering_reset_yearly',
  // Notification
  'notify_new_order',
  'notify_payment_overdue',
  'notify_low_stock',
  'low_stock_threshold',
  'notification_email',
  // Production & Warehouse
  'default_unit',
  'default_waste_rate',
  'default_production_days',
  // Shipment
  'default_shipping_unit',
  'default_shipping_region',
  'default_delivery_days',
  // User Management
  'allow_self_signup',
  'require_account_approval',
  'session_timeout_minutes',
  'max_concurrent_devices',
  // Report
  'timezone',
  'fiscal_year_start',
  'date_format',
  // Integration
  'webhook_url',
  'smtp_host',
  'smtp_port',
  'smtp_from_email',
  // UI
  'theme_mode',
  'language',
  'print_logo_url',
  'brand_color',
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
    .enum(['admin', 'manager', 'staff', 'driver', 'viewer', 'sale', 'customer'])
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

/* ── Finance Settings ── */

export const financeSettingsSchema = z.object({
  default_currency: z.enum(['VND', 'USD']).default('VND'),
  default_vat_rate: z.string().trim().default('10'),
  default_payment_terms: z.string().trim().default('30'),
  default_credit_limit: z.string().trim().default('50000000'),
});

export type FinanceSettingsFormValues = z.infer<typeof financeSettingsSchema>;

export const financeSettingsDefaults: FinanceSettingsFormValues = {
  default_currency: 'VND',
  default_vat_rate: '10',
  default_payment_terms: '30',
  default_credit_limit: '50000000',
};

/* ── Numbering Settings ── */

export const numberingSettingsSchema = z.object({
  order_prefix: z.string().trim().max(10).default('ĐH-'),
  quotation_prefix: z.string().trim().max(10).default('BG-'),
  invoice_prefix: z.string().trim().max(10).default('HĐ-'),
  payment_prefix: z.string().trim().max(10).default('PT-'),
  expense_prefix: z.string().trim().max(10).default('PC-'),
  numbering_reset_yearly: z.enum(['true', 'false']).default('true'),
});

export type NumberingSettingsFormValues = z.infer<
  typeof numberingSettingsSchema
>;

export const numberingSettingsDefaults: NumberingSettingsFormValues = {
  order_prefix: 'ĐH-',
  quotation_prefix: 'BG-',
  invoice_prefix: 'HĐ-',
  payment_prefix: 'PT-',
  expense_prefix: 'PC-',
  numbering_reset_yearly: 'true',
};

/* ── Notification Settings ── */

export const notificationSettingsSchema = z.object({
  notify_new_order: z.enum(['true', 'false']).default('true'),
  notify_payment_overdue: z.enum(['true', 'false']).default('true'),
  notify_low_stock: z.enum(['true', 'false']).default('false'),
  low_stock_threshold: z.string().trim().default('100'),
  notification_email: z
    .string()
    .trim()
    .email('Email không hợp lệ')
    .optional()
    .or(z.literal('')),
});

export type NotificationSettingsFormValues = z.infer<
  typeof notificationSettingsSchema
>;

export const notificationSettingsDefaults: NotificationSettingsFormValues = {
  notify_new_order: 'true',
  notify_payment_overdue: 'true',
  notify_low_stock: 'false',
  low_stock_threshold: '100',
  notification_email: '',
};

/* ── Production & Warehouse Settings ── */

export const productionSettingsSchema = z.object({
  default_unit: z.enum(['met', 'yard', 'kg']).default('met'),
  default_waste_rate: z.string().trim().default('3'),
  default_production_days: z.string().trim().default('14'),
});

export type ProductionSettingsFormValues = z.infer<
  typeof productionSettingsSchema
>;

export const productionSettingsDefaults: ProductionSettingsFormValues = {
  default_unit: 'met',
  default_waste_rate: '3',
  default_production_days: '14',
};

/* ── Shipment Settings ── */

export const shipmentSettingsSchema = z.object({
  default_shipping_unit: z.enum(['kg', 'cuon', 'kien']).default('kg'),
  default_shipping_region: z.string().trim().max(100).default('Miền Nam'),
  default_delivery_days: z.string().trim().default('7'),
});

export type ShipmentSettingsFormValues = z.infer<typeof shipmentSettingsSchema>;

export const shipmentSettingsDefaults: ShipmentSettingsFormValues = {
  default_shipping_unit: 'kg',
  default_shipping_region: 'Miền Nam',
  default_delivery_days: '7',
};

/* ── User Management Settings ── */

export const userMgmtSettingsSchema = z.object({
  allow_self_signup: z.enum(['true', 'false']).default('false'),
  require_account_approval: z.enum(['true', 'false']).default('true'),
  session_timeout_minutes: z.string().trim().default('480'),
  max_concurrent_devices: z.string().trim().default('3'),
});

export type UserMgmtSettingsFormValues = z.infer<typeof userMgmtSettingsSchema>;

export const userMgmtSettingsDefaults: UserMgmtSettingsFormValues = {
  allow_self_signup: 'false',
  require_account_approval: 'true',
  session_timeout_minutes: '480',
  max_concurrent_devices: '3',
};

/* ── Report Settings ── */

export const reportSettingsSchema = z.object({
  timezone: z.string().trim().default('Asia/Ho_Chi_Minh'),
  fiscal_year_start: z.string().trim().default('01/01'),
  date_format: z
    .enum(['DD/MM/YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY'])
    .default('DD/MM/YYYY'),
});

export type ReportSettingsFormValues = z.infer<typeof reportSettingsSchema>;

export const reportSettingsDefaults: ReportSettingsFormValues = {
  timezone: 'Asia/Ho_Chi_Minh',
  fiscal_year_start: '01/01',
  date_format: 'DD/MM/YYYY',
};

/* ── Integration Settings ── */

export const integrationSettingsSchema = z.object({
  webhook_url: z.string().trim().max(500).optional().or(z.literal('')),
  smtp_host: z.string().trim().max(200).optional().or(z.literal('')),
  smtp_port: z.string().trim().default('587'),
  smtp_from_email: z
    .string()
    .trim()
    .email('Email không hợp lệ')
    .optional()
    .or(z.literal('')),
});

export type IntegrationSettingsFormValues = z.infer<
  typeof integrationSettingsSchema
>;

export const integrationSettingsDefaults: IntegrationSettingsFormValues = {
  webhook_url: '',
  smtp_host: '',
  smtp_port: '587',
  smtp_from_email: '',
};

/* ── UI Settings ── */

export const uiSettingsSchema = z.object({
  theme_mode: z.enum(['light', 'dark', 'auto']).default('auto'),
  language: z.enum(['vi', 'en']).default('vi'),
  print_logo_url: z.string().trim().max(500).optional().or(z.literal('')),
  brand_color: z.string().trim().max(20).default('#0B6BCB'),
});

export type UiSettingsFormValues = z.infer<typeof uiSettingsSchema>;

export const uiSettingsDefaults: UiSettingsFormValues = {
  theme_mode: 'auto',
  language: 'vi',
  print_logo_url: '',
  brand_color: '#0B6BCB',
};

/* ── Helpers ── */

/** Merged defaults for all sections — used to initialise the settings map */
const ALL_DEFAULTS: CompanySettingsMap = {
  ...companySettingsDefaultValues,
  ...financeSettingsDefaults,
  ...numberingSettingsDefaults,
  ...notificationSettingsDefaults,
  ...productionSettingsDefaults,
  ...shipmentSettingsDefaults,
  ...userMgmtSettingsDefaults,
  ...reportSettingsDefaults,
  ...integrationSettingsDefaults,
  ...uiSettingsDefaults,
} as CompanySettingsMap;

/** Chuyển mảng key-value rows thành object phẳng */
export function rowsToSettingsMap(
  rows: CompanySettingRow[],
): CompanySettingsMap {
  const map = { ...ALL_DEFAULTS };
  for (const row of rows) {
    if (COMPANY_SETTING_KEYS.includes(row.key as CompanySettingKey)) {
      map[row.key as CompanySettingKey] = row.value;
    }
  }
  return map;
}

/** Chuyển object phẳng thành mảng { key, value } để upsert (company info only) */
export function settingsMapToUpsertRows(
  map: CompanySettingsFormValues,
): { key: string; value: string }[] {
  const keys = Object.keys(map) as (keyof CompanySettingsFormValues)[];
  return keys.map((key) => ({
    key,
    value: map[key] ?? '',
  }));
}
