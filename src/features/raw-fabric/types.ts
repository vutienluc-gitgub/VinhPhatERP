import type {
  TableRow,
  TableInsert,
  TableUpdate,
} from '@/shared/types/database.models';

import type { QUALITY_GRADES, ROLL_STATUSES } from './raw-fabric.module';

export type QualityGrade = (typeof QUALITY_GRADES)[number];
export type RollStatus = (typeof ROLL_STATUSES)[number];

export type RawFabricRoll = TableRow<'raw_fabric_rolls'> & {
  gsm?: number | null;
  composition?: string | null;
  price_tier?: Record<string, unknown> | null;
};
export type RawFabricRollInsert = TableInsert<'raw_fabric_rolls'>;
export type RawFabricRollUpdate = TableUpdate<'raw_fabric_rolls'>;

export type RawFabricFilter = {
  status?: RollStatus;
  quality_grade?: QualityGrade;
  fabric_type?: string;
  roll_number?: string;
  sort_by?: 'created_at' | 'weight_kg' | 'roll_number';
  sort_dir?: 'asc' | 'desc';
};
