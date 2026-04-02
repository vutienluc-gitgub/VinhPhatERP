import type { QUALITY_GRADES, ROLL_STATUSES } from './finished-fabric.module'

export type QualityGrade = (typeof QUALITY_GRADES)[number]
export type RollStatus = (typeof ROLL_STATUSES)[number]

export type FinishedFabricRoll = {
  id: string
  roll_number: string
  raw_roll_id: string | null
  fabric_type: string
  color_name: string | null
  color_code: string | null
  width_cm: number | null
  length_m: number | null
  weight_kg: number | null
  quality_grade: QualityGrade | null
  status: RollStatus
  warehouse_location: string | null
  production_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type FinishedFabricFilter = {
  status?: RollStatus
  quality_grade?: QualityGrade
  fabric_type?: string
}

export type RawRollOption = {
  id: string
  roll_number: string
  fabric_type: string
  color_name: string | null
}
