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
};
export type FinishedFabricRollInsert = TableInsert<'finished_fabric_rolls'>;
export type FinishedFabricRollUpdate = TableUpdate<'finished_fabric_rolls'>;

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
