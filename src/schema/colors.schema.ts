import { z } from 'zod';

import type { Database } from '@/services/supabase/database.types';

export type ColorRow = Database['public']['Tables']['colors']['Row'];
export type ColorInsert = Database['public']['Tables']['colors']['Insert'];
export type ColorUpdate = Database['public']['Tables']['colors']['Update'];

export const colorSchema = z.object({
  code: z
    .string()
    .min(1, 'Mã màu không được để trống')
    .max(50, 'Mã màu quá dài')
    .toUpperCase(),
  name: z
    .string()
    .min(1, 'Tên màu không được để trống')
    .max(100, 'Tên màu quá dài'),
  note: z.string().optional().nullable(),
  trend_year: z.number().int().optional().nullable(),
  color_group: z.string().optional().nullable(),
});

export type ColorFormValues = z.infer<typeof colorSchema>;

export const colorDefaultValues: ColorFormValues = {
  code: '',
  name: '',
  note: '',
  trend_year: new Date().getFullYear(),
  color_group: null,
};

/** Map mã màu tiêu chuẩn → giá trị hex tương ứng */
export const COLOR_HEX_MAP: Record<string, string> = {
  'WH-01': '#F8F8F5',
  'WH-02': '#FFFFF0',
  'BK-01': '#1A1A1A',
  'GR-01': '#C8C8C8',
  'GR-02': '#7A7A7A',
  'NV-01': '#0A1F5B',
  'BL-01': '#0066CC',
  'BL-02': '#89CFF0',
  'RD-01': '#E52222',
  'RD-02': '#800000',
  'PK-01': '#FFB6C1',
  'PK-02': '#FF8FAB',
  'YL-01': '#FAEE4A',
  'YL-02': '#FFC200',
  'GN-01': '#5DBB5D',
  'GN-02': '#4A5D2A',
  'BR-01': '#8B5E3C',
  'BR-02': '#5C3317',
  'BG-01': '#F5F0DC',
  'PR-01': '#C9A8E0',
  RAW: '#E8DCC8',
  'CB-01': '#0047AB',
};

/**
 * Trả về mã hex cho một mã màu.
 * - Nếu có trong bảng map → dùng giá trị chuẩn.
 * - Nếu chưa có → tự sinh màu từ hash của code (HSL deterministic).
 */
export function getColorHex(code: string): string {
  const known = COLOR_HEX_MAP[code.toUpperCase()];
  if (known) return known;

  // Deterministic hash → hue
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = code.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 55%)`;
}
