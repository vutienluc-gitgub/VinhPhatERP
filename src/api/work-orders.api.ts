import type { BomYarnItem } from '@/features/bom/types'
import type {
  WorkOrder,
  WorkOrderWithRelations,
  WorkOrderFilter,
  WorkOrderYarnRequirementWithRelations,
} from '@/features/work-orders/types'
import type { CreateWorkOrderInput, CompleteWorkOrderInput } from '@/features/work-orders/work-orders.module'

import { supabase } from '@/services/supabase/client'

const TABLE = 'work_orders'

/* ── List with filters + pagination ── */

export async function fetchWorkOrders(
  filter?: WorkOrderFilter,
  page = 1,
  pageSize = 20,
): Promise<{ data: WorkOrderWithRelations[]; count: number }> {
  let query = supabase
    .from(TABLE)
    .select(`
      *,
      bom_template:bom_templates(
        id, code, name,
        target_fabric:fabric_catalogs(id, code, name)
      ),
      order:orders(
        id, order_number,
        customer:customers(id, name)
      ),
      supplier:suppliers(id, code, name)
    `, { count: 'exact' })

  if (filter?.status && filter.status !== 'all') {
    query = query.eq('status', filter.status)
  }
  if (filter?.search) {
    query = query.ilike('work_order_number', `%${filter.search}%`)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw error
  return { data: (data || []) as WorkOrderWithRelations[], count: count || 0 }
}

/* ── Detail ── */

export async function fetchWorkOrderById(id: string): Promise<WorkOrderWithRelations> {
  const { data, error } = await supabase
    .from(TABLE)
    .select(`
      *,
      bom_template:bom_templates(
        id, code, name, target_width_cm, target_gsm,
        target_fabric:fabric_catalogs(id, code, name)
      ),
      order:orders(
        id, order_number,
        customer:customers(id, name)
      ),
      supplier:suppliers(id, code, name)
    `)
    .eq('id', id)
    .single()
  if (error) throw error
  return data as unknown as WorkOrderWithRelations
}

/* ── Yarn requirements ── */

export async function fetchWorkOrderRequirements(
  workOrderId: string,
): Promise<WorkOrderYarnRequirementWithRelations[]> {
  const { data, error } = await supabase
    .from('work_order_y_requirements')
    .select(`
      *,
      yarn_catalog:yarn_catalogs(id, code, name, color_name)
    `)
    .eq('work_order_id', workOrderId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data || []) as WorkOrderYarnRequirementWithRelations[]
}

/* ── Create work order ── */

export async function createWorkOrder(input: CreateWorkOrderInput): Promise<WorkOrder> {
  // 1. Fetch the selected BOM template
  const { data: bom, error: bomError } = await supabase
    .from('bom_templates')
    .select('*')
    .eq('id', input.bom_template_id)
    .single()
  if (bomError) throw bomError
  if (bom.status !== 'approved') throw new Error('Chỉ được phép dùng BOM đã được duyệt (Approved).')

  const bomVersion = bom.active_version
  const lossPct = bom.standard_loss_pct || 0

  // 2. Fetch Yarn Items in that BOM Version
  const { data: bomYarns, error: yarnError } = await supabase
    .from('bom_yarn_items')
    .select('*')
    .eq('bom_template_id', input.bom_template_id)
    .eq('version', bomVersion)
  if (yarnError) throw yarnError
  if (!bomYarns || bomYarns.length === 0) throw new Error('BOM không có định mức sợi nào.')

  // 3. Create the Work Order
  let targetKg = input.target_weight_kg || 0
  if (targetKg === 0 && input.target_quantity_m > 0) {
    const totalConsumptionPerM = bomYarns.reduce((sum, item) => sum + (item.consumption_kg_per_m || 0), 0)
    targetKg = input.target_quantity_m * totalConsumptionPerM
  }

  const { data: workOrder, error: createError } = await supabase
    .from(TABLE)
    .insert({
      work_order_number: input.work_order_number,
      order_id: input.order_id || null,
      bom_template_id: input.bom_template_id,
      bom_version: bomVersion,
      target_quantity_m: input.target_quantity_m,
      target_unit: input.target_unit || 'm',
      target_weight_kg: targetKg,
      standard_loss_pct: lossPct,
      status: 'draft',
      start_date: input.start_date || null,
      end_date: input.end_date || null,
      supplier_id: input.supplier_id,
      weaving_unit_price: input.weaving_unit_price || 0,
      notes: input.notes || null,
    })
    .select()
    .single()
  if (createError) throw createError

  // 4. Calculate and generate Yarn Requirements
  if (targetKg > 0) {
    const totalRequiredYarnKg = targetKg / (1 - lossPct / 100)

    const reqInserts = (bomYarns as BomYarnItem[]).map((yarn) => ({
      work_order_id: workOrder.id,
      yarn_catalog_id: yarn.yarn_catalog_id,
      bom_ratio_pct: yarn.ratio_pct,
      required_kg: totalRequiredYarnKg * (yarn.ratio_pct / 100),
      allocated_kg: 0,
    }))

    const { error: reqError } = await supabase
      .from('work_order_y_requirements')
      .insert(reqInserts)

    if (reqError) {
      console.error('Failed to allocate yarn requirements', reqError)
    }
  }

  // 5. Auto-create progress rows for standalone work orders (no order linked)
  if (!input.order_id) {
    const stages = [
      'warping', 'weaving', 'greige_check', 'dyeing',
      'finishing', 'final_check', 'packing',
    ] as const
    const progressRows = stages.map(stage => ({
      work_order_id: workOrder.id,
      order_id: null as string | null,
      stage,
      status: 'pending' as const,
    }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: progressErr } = await (supabase as any)
      .from('order_progress')
      .insert(progressRows)
    if (progressErr) {
      console.error('Failed to create progress rows for work order', progressErr)
    }
  }

  return workOrder as WorkOrder
}

/* ── Update work order ── */

export async function updateWorkOrder(id: string, input: Partial<CreateWorkOrderInput>): Promise<WorkOrder> {
  const { data: current, error: fetchErr } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .single()
  
  if (fetchErr) throw fetchErr
  if (current.status !== 'draft') throw new Error('Chỉ được phép sửa lệnh dệt ở trạng thái Bản nháp (Draft).')

  // 1. Prepare update object
  const update: Record<string, any> = {
    work_order_number: input.work_order_number,
    order_id: input.order_id === 'none' ? null : (input.order_id || current.order_id),
    bom_template_id: input.bom_template_id || current.bom_template_id,
    target_quantity_m: input.target_quantity_m ?? current.target_quantity_m,
    target_unit: input.target_unit || current.target_unit,
    start_date: input.start_date || current.start_date,
    end_date: input.end_date || current.end_date,
    supplier_id: input.supplier_id || current.supplier_id,
    weaving_unit_price: input.weaving_unit_price ?? current.weaving_unit_price,
    notes: input.notes !== undefined ? input.notes : current.notes,
  }

  // 2. If BOM or Quantity changed, we need to recalculate
  const bomChanged = input.bom_template_id && input.bom_template_id !== current.bom_template_id
  const qtyChanged = input.target_quantity_m !== undefined && input.target_quantity_m !== current.target_quantity_m

  if (bomChanged || qtyChanged) {
    const bomId = update.bom_template_id
    
    // Fetch BOM details
    const { data: bom, error: bomErr } = await supabase
      .from('bom_templates')
      .select('*')
      .eq('id', bomId)
      .single()
    if (bomErr) throw bomErr

    const bomVersion = bom.active_version
    const lossPct = bom.standard_loss_pct || 0
    update.bom_version = bomVersion
    update.standard_loss_pct = lossPct

    // Fetch Yarn Items
    const { data: bomYarns, error: yarnErr } = await supabase
      .from('bom_yarn_items')
      .select('*')
      .eq('bom_template_id', bomId)
      .eq('version', bomVersion)
    if (yarnErr) throw yarnErr

    // Calculate target weight
    let targetKg: number = (input.target_weight_kg ?? current.target_weight_kg) || 0
    if (targetKg === 0 || qtyChanged || bomChanged) {
      const totalConsumptionPerM = (bomYarns || []).reduce((sum, item) => sum + (item.consumption_kg_per_m || 0), 0)
      targetKg = update.target_quantity_m * totalConsumptionPerM
    }
    update.target_weight_kg = targetKg

    // Save WO update
    const { error: woUpdateErr } = await supabase.from(TABLE).update(update).eq('id', id)
    if (woUpdateErr) throw woUpdateErr

    // Update requirements: Delete and re-create
    await supabase.from('work_order_y_requirements').delete().eq('work_order_id', id)

    if (targetKg > 0) {
      const totalRequiredYarnKg = targetKg / (1 - lossPct / 100)
      const reqInserts = (bomYarns as BomYarnItem[]).map((yarn) => ({
        work_order_id: id,
        yarn_catalog_id: yarn.yarn_catalog_id,
        bom_ratio_pct: yarn.ratio_pct,
        required_kg: totalRequiredYarnKg * (yarn.ratio_pct / 100),
        allocated_kg: 0,
      }))
      await supabase.from('work_order_y_requirements').insert(reqInserts)
    }
  } else {
    // Basic update
    const { error: woUpdateErr } = await supabase.from(TABLE).update(update).eq('id', id)
    if (woUpdateErr) throw woUpdateErr
  }

  return fetchWorkOrderById(id)
}

/* ── Status transitions ── */

export async function startWorkOrder(id: string): Promise<WorkOrder> {
  const { data: wo, error: woError } = await supabase
    .from(TABLE)
    .update({ status: 'in_progress', start_date: new Date().toISOString() })
    .eq('id', id)
    .select('id, order_id')
    .single()
  
  if (woError) throw woError

  const today = new Date().toISOString().slice(0, 10)

  // Sync to order_progress — works for both order-linked and standalone work orders
  if (wo.order_id) {
    await supabase
      .from('order_progress')
      .update({ status: 'in_progress', actual_date: today })
      .eq('order_id', wo.order_id)
      .eq('stage', 'weaving')
      .eq('status', 'pending')
  } else {
    // Standalone work order — update by work_order_id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('order_progress')
      .update({ status: 'in_progress', actual_date: today })
      .eq('work_order_id', id)
      .eq('stage', 'weaving')
      .eq('status', 'pending')
  }

  return fetchWorkOrderById(id)
}

export async function completeWorkOrder(id: string, input: CompleteWorkOrderInput): Promise<WorkOrder> {
  const { data: wo, error: woError } = await supabase
    .from(TABLE)
    .update({
      status: 'completed',
      actual_yield_m: input.actual_yield_m,
      end_date: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id, order_id')
    .single()

  if (woError) throw woError

  const today = new Date().toISOString().slice(0, 10)

  // Sync to order_progress — works for both order-linked and standalone work orders
  if (wo.order_id) {
    await supabase
      .from('order_progress')
      .update({ status: 'done', actual_date: today })
      .eq('order_id', wo.order_id)
      .eq('stage', 'weaving')
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('order_progress')
      .update({ status: 'done', actual_date: today })
      .eq('work_order_id', id)
      .eq('stage', 'weaving')
  }

  return fetchWorkOrderById(id)
}

export async function cancelWorkOrder(id: string): Promise<WorkOrder> {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ status: 'cancelled' })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as WorkOrder
}

export async function fetchUnitOptions(): Promise<string[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supa = supabase as any
  const { data, error } = await supa
    .from('v_available_units')
    .select('unit')
    .order('unit', { ascending: true })
  
  if (error) {
    console.error('Error fetching units:', error)
    return ['m', 'kg', 'yard'] // Fallback
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((u: any) => u.unit)
}
