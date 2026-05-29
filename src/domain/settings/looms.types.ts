/**
 * Loom domain types.
 * Pure TypeScript — no React or Supabase dependency.
 */
import type { LoomStatus, LoomType } from '@/schema/loom.schema';

export type Loom = {
  id: string;
  code: string;
  name: string;
  loom_type: LoomType;
  supplier_id: string;
  // Thong so van hanh
  max_width_cm: number | null;
  max_speed_rpm: number | null;
  daily_capacity_m: number | null;
  daily_capacity_kg: number | null;
  year_manufactured: number | null;
  // Thong so ky thuat
  diameter_inch: number | null;
  gauge: number | null;
  feeders: number | null;
  needles: number | null;
  gsm_range: string | null;
  yarn_support: string | null;
  motor_power_kw: number | null;
  voltage: string | null;
  weight_kg: number | null;
  status: LoomStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type LoomWithSupplier = Loom & {
  supplier?: {
    id: string;
    code: string;
    name: string;
  } | null;
  production_state?: {
    efficiency_pct: number | null;
    current_work_order?: {
      work_order_number: string;
      order?: {
        order_number: string;
      } | null;
    } | null;
  } | null;
};

export type LoomFilter = {
  search?: string;
  status?: LoomStatus;
  supplier_id?: string;
  loom_type?: LoomType;
};
