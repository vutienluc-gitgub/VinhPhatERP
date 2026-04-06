import type { TableRow, TableInsert, TableUpdate, RollStatus } from './common'
import { products as fabricTypes } from './products'

// --- Vải mộc (Raw Fabric) ---
export type RawFabricRoll = TableRow<'raw_fabric_rolls'>
export type RawFabricRollInsert = TableInsert<'raw_fabric_rolls'>
export type RawFabricRollUpdate = TableUpdate<'raw_fabric_rolls'>

export type RawFabricFilter = {
  status?: RollStatus
  quality_grade?: string
  fabric_type?: string
}

// --- Vải thành phẩm (Finished Fabric) ---
export type FinishedFabricRoll = TableRow<'finished_fabric_rolls'>
export type FinishedFabricRollInsert = TableInsert<'finished_fabric_rolls'>
export type FinishedFabricRollUpdate = TableUpdate<'finished_fabric_rolls'>

export { fabricTypes }
