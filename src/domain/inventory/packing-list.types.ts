/**
 * Domain Types for Fabric Roll Packing List (Bảng kê danh sách cây vải)
 * Standardized across Finished Fabric, Shipments, and Logistics.
 * Pure TypeScript — zero dependencies on UI or React.
 */

export type FabricGrade =
  | 'grade_a'
  | 'grade_b'
  | 'grade_c'
  | 'reject'
  | 'A'
  | 'B'
  | 'C'
  | string;

export interface FabricRollPackingItem {
  id: string;
  roll_code: string;
  roll_sequence: number;
  weight_kg: number;
  fabric_type?: string;
  color_name?: string;
  color_code?: string | null;
  lot_number?: string | null;
  width_inch?: number | null;
  length_meters?: number | null;
  grade?: FabricGrade;
  status?: string;
  notes?: string | null;
  checked?: boolean;
  checked_at?: string | null;
}

export interface PackingGroupSummary {
  group_key: string;
  color_name: string;
  fabric_type?: string;
  lot_number?: string | null;
  rolls: FabricRollPackingItem[];
  total_rolls: number;
  total_weight_kg: number;
  average_weight_kg: number;
  min_weight_kg: number;
  max_weight_kg: number;
  grade_a_count: number;
  grade_b_count: number;
  checked_rolls_count: number;
  checked_weight_kg: number;
}

export interface PackingListTotal {
  total_rolls: number;
  total_weight_kg: number;
  average_weight_kg: number;
  total_groups: number;
  grade_a_count: number;
  grade_b_count: number;
  other_grade_count: number;
  total_checked_rolls: number;
  total_checked_weight_kg: number;
  checkoff_percentage: number;
}

export interface RollCheckoffResult {
  success: boolean;
  roll?: FabricRollPackingItem;
  message: string;
  already_checked?: boolean;
  not_found?: boolean;
  updated_rolls: FabricRollPackingItem[];
}

export interface PackingListFilter {
  search_query?: string;
  color_name?: string;
  grade?: string;
  checked_status?: 'all' | 'checked' | 'unchecked';
}

export interface PackingListExportRow {
  stt: number;
  ma_cay_vai: string;
  loai_vai: string;
  mau: string;
  lo_nhuom: string;
  kho_vai_inch: string;
  chieu_dai_m: string;
  can_nang_kg: string;
  pham_cap: string;
  trang_thai_kiem_dem: string;
  ghi_chu: string;
}
