/**
 * Finished-fabric domain types.
 * Pure TypeScript — no React or Supabase dependency.
 */
import type {
  TableRow,
  TableInsert,
  TableUpdate,
} from '@/shared/types/database.models';
import type {
  QUALITY_GRADES,
  ROLL_STATUSES,
} from '@/schema/finished-fabric.schema';

export type QualityGrade = (typeof QUALITY_GRADES)[number];
export type RollStatus = (typeof ROLL_STATUSES)[number];

export type FinishedFabricRoll = TableRow<'finished_fabric_rolls'> & {
  gsm?: number | null;
  composition?: string | null;
  price_tier?: Record<string, unknown> | null;
  /** Populated via join from raw_fabric_rolls — source roll number for traceability */
  raw_roll_number?: string | null;
  /** Virtual fields from UI/backend (or new migrations) */
  supplier_id?: string | null;
  purchase_price?: number | null;
  suppliers?: { name: string; code: string } | null;
};
export type FinishedFabricRollInsert = Omit<
  TableInsert<'finished_fabric_rolls'>,
  'raw_roll_id'
> & {
  raw_roll_id?: string | null;
  supplier_id?: string | null;
  purchase_price?: number | null;
};
export type FinishedFabricRollUpdate = Omit<
  TableUpdate<'finished_fabric_rolls'>,
  'raw_roll_id'
> & {
  raw_roll_id?: string | null;
  supplier_id?: string | null;
  purchase_price?: number | null;
};

export type FinishedFabricFilter = {
  status?: RollStatus;
  quality_grade?: QualityGrade;
  fabric_type?: string;
  lot_number?: string;
};

export type RawRollOption = {
  id: string;
  roll_number: string;
  fabric_type: string;
  color_name: string | null;
  lot_number: string | null;
};
