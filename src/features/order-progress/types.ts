import type { ProductionStage, StageStatus } from '@/schema/order-progress.schema'
export type { ProductionStage, StageStatus }

export type OrderProgress = {
  id: string
  order_id: string | null
  work_order_id: string | null
  stage: ProductionStage
  status: StageStatus
  planned_date: string | null
  actual_date: string | null
  notes: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

export type OrderProgressWithOrder = OrderProgress & {
  orders?: { order_number: string; delivery_date: string | null; status?: string; customers?: { name: string } | null } | null
  work_orders?: { work_order_number: string; status: string; supplier?: { name: string } | null; bom_template?: { name: string } | null } | null
}

export type ProgressAuditLog = {
  id: string
  progress_id: string
  order_id: string | null
  stage: ProductionStage
  old_status: StageStatus | null
  new_status: StageStatus
  changed_by: string | null
  notes: string | null
  created_at: string
}

export type ProgressAuditLogWithOrder = ProgressAuditLog & {
  orders?: { order_number: string; customers?: { name: string } | null } | null
}
