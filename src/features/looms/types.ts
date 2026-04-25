import type { LoomStatus, LoomType } from '@/schema/loom.schema';

export type Loom = {
  id: string;
  code: string;
  name: string;
  loom_type: LoomType;
  supplier_id: string;
  max_width_cm: number | null;
  max_speed_rpm: number | null;
  daily_capacity_m: number | null;
  year_manufactured: number | null;
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
};

export type LoomFilter = {
  search?: string;
  status?: LoomStatus;
  supplier_id?: string;
  loom_type?: LoomType;
};
