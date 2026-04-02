export type ProductionStage = 'warping' | 'weaving' | 'greige_check' | 'dyeing' | 'finishing' | 'final_check' | 'packing'
export type StageStatus = 'pending' | 'in_progress' | 'done' | 'skipped'

export type OrderProgress = {
  id: string
  order_id: string
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
  orders?: { order_number: string; delivery_date: string | null; customers?: { name: string } | null } | null
}

export type ProgressAuditLog = {
  id: string
  progress_id: string
  order_id: string
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
