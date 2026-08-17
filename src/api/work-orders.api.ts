import dayjs from 'dayjs';

import type { BomYarnItem } from '@/domain/production/bom.types';
import type {
  WorkOrder,
  WorkOrderWithRelations,
  WorkOrderFilter,
  WorkOrderYarnRequirementWithRelations,
  AvailableYarnLot,
  IssueYarnLotItem,
  WorkOrderYarnIssueWithRelations,
} from '@/domain/production/work-orders.types';
import type { CreateWorkOrderInput } from '@/features/work-orders/work-orders.module';
import {
  assertSingleMutation,
  assertVoidMutation,
} from '@/lib/db-mutation-guard';
import { validateApiInput } from '@/lib/validate-api-input';
import { apiWorkOrderInsert } from '@/schema/api-validation.schema';
import { supabase } from '@/services/supabase/client';
import { untypedDb } from '@/services/supabase/untyped';

const TABLE = 'work_orders';

/* ── List with filters + pagination ── */

export async function fetchWorkOrders(
  filter?: WorkOrderFilter,
  page = 1,
  pageSize = 20,
): Promise<{ data: WorkOrderWithRelations[]; count: number }> {
  const selectStr = `
      *,
      bom_template:bom_templates(
        id, code, name,
        target_fabric:fabric_catalogs(id, code, name)
      ),
      order:orders(
        id, order_number,
        customer:customers(id, name)
      ),
      supplier:suppliers(id, code, name),
      loom:looms(id, code, name)
    `;

  // yarn_issued is not in the DB enum type — use untypedDb when filtering by it
  const useUntyped = filter?.status === 'yarn_issued';
  let query = useUntyped
    ? untypedDb.from(TABLE).select(selectStr, { count: 'exact' })
    : supabase.from(TABLE).select(selectStr, { count: 'exact' });

  if (filter?.status && filter.status !== 'all') {
    query = query.eq('status', filter.status);
  }
  if (filter?.search?.trim()) {
    const term = filter.search.trim();
    const { data: sups } = await supabase
      .from('suppliers')
      .select('id')
      .ilike('name', `%${term}%`);
    const sIds = sups?.map((s) => s.id) || [];
    if (sIds.length > 0) {
      query = query.or(
        `work_order_number.ilike.%${term}%,supplier_id.in.(${sIds.join(',')})`,
      );
    } else {
      query = query.or(`work_order_number.ilike.%${term}%`);
    }
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;
  return {
    data: (data || []) as WorkOrderWithRelations[],
    count: count || 0,
  };
}

/* ── Detail ── */

export async function fetchWorkOrderById(
  id: string,
): Promise<WorkOrderWithRelations> {
  const { data, error } = await supabase
    .from(TABLE)
    .select(
      `
      *,
      bom_template:bom_templates(
        id, code, name, target_width_cm, target_gsm,
        target_fabric:fabric_catalogs(id, code, name)
      ),
      order:orders(
        id, order_number,
        customer:customers(id, name)
      ),
      supplier:suppliers(id, code, name),
      loom:looms(id, code, name)
    `,
    )
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as unknown as WorkOrderWithRelations;
}

/* ── Yarn requirements ── */

export async function fetchWorkOrderRequirements(
  workOrderId: string,
): Promise<WorkOrderYarnRequirementWithRelations[]> {
  const { data, error } = await supabase
    .from('work_order_y_requirements')
    .select(
      `
      *,
      yarn_catalog:yarn_catalogs(id, code, name, color_name)
    `,
    )
    .eq('work_order_id', workOrderId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []) as WorkOrderYarnRequirementWithRelations[];
}

/* ── Create work order ── */

export async function createWorkOrder(
  input: CreateWorkOrderInput,
): Promise<WorkOrder> {
  validateApiInput(apiWorkOrderInsert.passthrough(), input);
  // 1. Fetch the selected BOM template
  const { data: bom, error: bomError } = await supabase
    .from('bom_templates')
    .select('*')
    .eq('id', input.bom_template_id)
    .single();
  if (bomError) throw bomError;
  if (bom.status !== 'approved')
    throw new Error('Chỉ được phép dùng BOM đã được duyệt (Approved).');

  const bomVersion = bom.active_version;
  const lossPct = input.standard_loss_pct ?? bom.standard_loss_pct ?? 0;

  // 2. Fetch Yarn Items in that BOM Version (for fallback calc)
  const { data: bomYarns, error: yarnError } = await supabase
    .from('bom_yarn_items')
    .select('*')
    .eq('bom_template_id', input.bom_template_id)
    .eq('version', bomVersion);
  if (yarnError) throw yarnError;

  // 3. Create the Work Order
  let targetKg = input.target_weight_kg || 0;
  if (targetKg === 0 && input.target_quantity > 0 && bomYarns) {
    const totalConsumptionPerM = bomYarns.reduce(
      (sum, item) => sum + (item.consumption_kg_per_m || 0),
      0,
    );
    targetKg = input.target_quantity * totalConsumptionPerM;
  }

  const workOrderInsert = {
    work_order_number: input.work_order_number,
    order_id: input.order_id || null,
    bom_template_id: input.bom_template_id,
    bom_version: bomVersion,
    target_quantity: input.target_quantity,
    target_unit: input.target_unit || 'm',
    target_weight_kg: targetKg,
    standard_loss_pct: lossPct,
    status: 'draft',
    start_date: input.start_date || null,
    end_date: input.end_date || null,
    supplier_id: input.supplier_id,
    weaving_unit_price: input.weaving_unit_price || 0,
    notes: input.notes || null,
    loom_id: input.loom_id || null,
  };

  // 4. Generate Yarn Requirements (using Table Data if provided)
  let reqInserts: {
    yarn_catalog_id: string;
    bom_ratio_pct: number;
    required_kg: number;
    allocated_kg: number;
  }[] = [];
  const yarnReqsFromInput = input.yarn_requirements || [];

  if (yarnReqsFromInput.length > 0) {
    // USE TABLE DATA FROM UI
    reqInserts = yarnReqsFromInput.map((req) => ({
      yarn_catalog_id: req.yarn_catalog_id,
      bom_ratio_pct: req.bom_ratio_pct,
      required_kg: req.required_kg,
      allocated_kg: 0,
    }));
  } else if (targetKg > 0 && bomYarns) {
    // FALLBACK TO AUTO-CALCULATION
    const totalRequiredYarnKg = targetKg / (1 - lossPct / 100);
    reqInserts = (bomYarns as BomYarnItem[]).map((yarn) => ({
      yarn_catalog_id: yarn.yarn_catalog_id,
      bom_ratio_pct: yarn.ratio_pct,
      required_kg: totalRequiredYarnKg * (yarn.ratio_pct / 100),
      allocated_kg: 0,
    }));
  }

  // 5. Auto-create progress rows for standalone work orders (no order linked)
  let progressRows: {
    order_id: string | null;
    stage: string;
    status: string;
  }[] = [];
  if (!input.order_id) {
    const stages = [
      'warping',
      'weaving',
      'greige_check',
      'dyeing',
      'finishing',
      'final_check',
      'packing',
    ] as const;
    progressRows = stages.map((stage) => ({
      order_id: null,
      stage,
      status: 'pending',
    }));
  }

  const { data, error } = await supabase.rpc('rpc_create_work_order', {
    p_wo_data: workOrderInsert as unknown as never,
    p_reqs_data: reqInserts as unknown as never[],
    p_progress_data: progressRows as unknown as never[],
  });

  if (error) throw error;
  return data as unknown as WorkOrder;
}

/* ── Update work order ── */

export async function updateWorkOrder(
  id: string,
  input: Partial<CreateWorkOrderInput>,
  expectedUpdatedAt?: string,
): Promise<WorkOrder> {
  const { data: current, error: fetchErr } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .single();

  if (fetchErr) throw fetchErr;

  const { data: roleData } = await supabase.rpc('current_user_role');
  const isAdmin = roleData === 'admin';

  if (current.status !== 'draft' && !isAdmin)
    throw new Error(
      'Chỉ được phép sửa lệnh dệt ở trạng thái Bản nháp (Draft) hoặc bạn phải là Quản trị viên.',
    );

  // 1. Prepare update object — using typed interface to avoid generic Record
  interface WorkOrderUpdateData {
    work_order_number: string | undefined;
    order_id: string | null;
    bom_template_id: string;
    target_quantity: number;
    target_unit: string;
    start_date: string | null;
    end_date: string | null;
    supplier_id: string;
    weaving_unit_price: number;
    notes: string | null | undefined;
    standard_loss_pct: number;
    bom_version?: number;
    target_weight_kg?: number | null;
    loom_id?: string | null;
  }

  const update: WorkOrderUpdateData = {
    work_order_number: input.work_order_number,
    order_id:
      input.order_id === 'none' ? null : input.order_id || current.order_id,
    bom_template_id: input.bom_template_id || current.bom_template_id,
    target_quantity: input.target_quantity ?? current.target_quantity,
    target_unit: input.target_unit || current.target_unit || 'm',
    start_date: input.start_date || current.start_date,
    end_date: input.end_date || current.end_date,
    supplier_id: input.supplier_id || current.supplier_id || '',
    weaving_unit_price:
      input.weaving_unit_price ?? (current.weaving_unit_price || 0),
    notes: input.notes !== undefined ? input.notes : current.notes,
    standard_loss_pct:
      input.standard_loss_pct ?? (current.standard_loss_pct || 0),
    loom_id: input.loom_id === 'none' ? null : input.loom_id || current.loom_id,
  };

  // 2. Determine if recalculation is needed
  const bomChanged =
    input.bom_template_id && input.bom_template_id !== current.bom_template_id;
  const qtyChanged =
    input.target_quantity !== undefined &&
    input.target_quantity !== current.target_quantity;
  const yarnsProvided =
    input.yarn_requirements && input.yarn_requirements.length > 0;

  if (bomChanged || qtyChanged || yarnsProvided) {
    const bomId = update.bom_template_id;

    // Fetch BOM for versioning if changed or for totalConsumption fallback
    const { data: bom } = await supabase
      .from('bom_templates')
      .select('*')
      .eq('id', bomId)
      .single();
    const { data: bomYarns } = await supabase
      .from('bom_yarn_items')
      .select('*')
      .eq('bom_template_id', bomId)
      .eq('version', bom?.active_version || current.bom_version);

    // Lấy requirements hiện hữu để bảo toàn allocated_kg (nếu đang sản xuất đã xuất kho)
    let existingReqs: WorkOrderYarnRequirementWithRelations[] = [];
    if (yarnsProvided) {
      const existingReqsData = await fetchWorkOrderRequirements(id);
      existingReqs = existingReqsData || [];
    }

    if (bomChanged && bom) {
      update.bom_version = bom.active_version;
      if (input.standard_loss_pct === undefined) {
        update.standard_loss_pct = bom.standard_loss_pct ?? 0;
      }
    }

    // Calculate target weight
    let targetKg: number =
      (input.target_weight_kg ?? current.target_weight_kg) || 0;
    if (targetKg === 0 || qtyChanged || bomChanged) {
      const totalConsumptionPerM = (bomYarns || []).reduce(
        (sum, item) => sum + (item.consumption_kg_per_m || 0),
        0,
      );
      targetKg = update.target_quantity * totalConsumptionPerM;
    }
    update.target_weight_kg = targetKg;
    // Build yarn_requirements to embed inside p_wo_data
    const yarnRequirements =
      input.yarn_requirements && input.yarn_requirements.length > 0
        ? input.yarn_requirements.map((req) => {
            const existing = existingReqs.find(
              (e) => e.yarn_catalog_id === req.yarn_catalog_id,
            );
            return {
              ...req,
              allocated_kg: existing ? existing.allocated_kg : 0,
            };
          })
        : bomYarns && targetKg > 0
          ? bomYarns.map((y) => ({
              yarn_catalog_id: y.yarn_catalog_id,
              bom_ratio_pct: y.ratio_pct,
              required_kg:
                (targetKg / (1 - (update.standard_loss_pct || 0) / 100)) *
                (y.ratio_pct / 100),
              allocated_kg: 0,
            }))
          : null;

    // Save WO update — DB function reads yarn_requirements from p_wo_data
    const { error: woUpdateErr } = await supabase.rpc('rpc_update_work_order', {
      p_wo_id: id,
      p_wo_data: {
        ...update,
        yarn_requirements: yarnRequirements,
      } as never,
      p_expected_updated_at: expectedUpdatedAt,
    });
    if (woUpdateErr) {
      if (woUpdateErr.message?.includes('OCC_MISMATCH')) {
        throw new Error(
          'Dữ liệu đã bị thay đổi bởi người khác. Vui lòng tải lại trang.',
        );
      }
      throw woUpdateErr;
    }
  } else {
    // Basic update
    const { error: woUpdateErr } = await supabase.rpc('rpc_update_work_order', {
      p_wo_id: id,
      p_wo_data: update as never,
      p_expected_updated_at: expectedUpdatedAt,
    });
    if (woUpdateErr) {
      if (woUpdateErr.message?.includes('OCC_MISMATCH')) {
        throw new Error(
          'Dữ liệu đã bị thay đổi bởi người khác. Vui lòng tải lại trang.',
        );
      }
      throw woUpdateErr;
    }
  }

  return fetchWorkOrderById(id);
}

/* ── Issue yarn (draft → yarn_issued) ── */

export async function issueYarn(id: string): Promise<WorkOrder> {
  // yarn_issued is an app-level status not in the generated DB enum — use untypedDb
  const { data, error } = await untypedDb
    .from(TABLE)
    .update({ status: 'yarn_issued' })
    .eq('id', id)
    .eq('status', 'draft')
    .select()
    .single();

  assertSingleMutation(data, error, {
    entityName: 'Lệnh dệt',
    expectedStatus: 'draft',
    transitionName: 'cấp phát sợi',
  });
  return fetchWorkOrderById(id);
}

export async function startWorkOrder(id: string): Promise<void> {
  const { error } = await supabase.rpc('rpc_start_work_order', {
    p_wo_id: id,
    p_today: dayjs().format('YYYY-MM-DD'),
  });
  assertVoidMutation(error, {
    entityName: 'Lệnh dệt',
    expectedStatus: 'yarn_issued',
    transitionName: 'bắt đầu sản xuất',
  });
}

/* ── Work order completion ── */
export async function completeWorkOrder(
  id: string,
  actualYieldM: number,
): Promise<void> {
  const { error } = await supabase.rpc('rpc_complete_work_order', {
    p_wo_id: id,
    p_yield_m: actualYieldM,
    p_today: dayjs().format('YYYY-MM-DD'),
  });
  assertVoidMutation(error, {
    entityName: 'Lệnh dệt',
    expectedStatus: 'in_progress',
    transitionName: 'hoàn thành lệnh dệt',
  });
}

export async function cancelWorkOrder(id: string): Promise<WorkOrder> {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ status: 'cancelled' })
    .eq('id', id)
    .in('status', ['draft', 'yarn_issued', 'in_progress'] as never[])
    .select()
    .single();
  assertSingleMutation(data, error, {
    entityName: 'Lệnh dệt',
    expectedStatus: 'draft / yarn_issued / in_progress',
    transitionName: 'hủy lệnh dệt',
  });
  return data as WorkOrder;
}

export async function verifyWorkOrder(
  id: string,
  actualYieldM: number,
  qcNotes: string,
): Promise<void> {
  const { data, error } = await supabase
    .from(TABLE)
    .update({
      status: 'completed' as never,
      actual_yield_m: actualYieldM,
      notes: qcNotes,
    })
    .eq('id', id)
    .eq('status', 'pending_verification' as never)
    .select()
    .single();
  assertSingleMutation(data, error, {
    entityName: 'Lệnh dệt',
    expectedStatus: 'pending_verification',
    transitionName: 'xác nhận nghiệm thu',
  });
}

export async function rejectWorkOrder(
  id: string,
  reason: string,
): Promise<void> {
  const { data, error } = await supabase
    .from(TABLE)
    .update({
      status: 'in_progress' as never,
      notes: reason,
    })
    .eq('id', id)
    .eq('status', 'pending_verification' as never)
    .select()
    .single();
  assertSingleMutation(data, error, {
    entityName: 'Lệnh dệt',
    expectedStatus: 'pending_verification',
    transitionName: 'từ chối nghiệm thu',
  });
}

export async function fetchUnitOptions(): Promise<string[]> {
  const { data, error } = await supabase
    .from('v_available_units')
    .select('unit')
    .order('unit', { ascending: true });

  if (error) {
    console.error('Error fetching units:', error);
    return ['m', 'kg', 'yard'];
  }
  return (data || []).map((u) => u.unit).filter((u): u is string => u !== null);
}

/* ── Available yarn lots per catalog ID (for issue modal) ── */

export async function fetchAvailableYarnLots(
  catalogIds: string[],
): Promise<AvailableYarnLot[]> {
  if (!catalogIds.length) return [];

  const { data, error } = await untypedDb
    .from('v_yarn_receipt_item_availability')
    .select('*')
    .in('yarn_catalog_id', catalogIds)
    .order('receipt_date', { ascending: true });

  if (error) throw error;
  return (data ?? []) as AvailableYarnLot[];
}

/* ── Issue yarn lots to work order (atomic) ── */

export async function issueYarnLots(
  workOrderId: string,
  lots: IssueYarnLotItem[],
): Promise<void> {
  if (!lots.length) throw new Error('Danh sach lot xuat kho khong duoc trong.');

  const { error } = await untypedDb.rpc('rpc_issue_yarn_lots', {
    p_work_order_id: workOrderId,
    p_lots: lots,
  });

  if (error) throw error;
}

/* ── Fetch issued yarn lots for a work order ── */

export async function fetchYarnIssuesForWorkOrder(
  workOrderId: string,
): Promise<WorkOrderYarnIssueWithRelations[]> {
  const { data, error } = await untypedDb
    .from('work_order_yarn_issues')
    .select(
      `
      *,
      yarn_receipt_items!inner(
        yarn_type,
        lot_number,
        receipt_id,
        yarn_receipts!inner(
          receipt_number,
          receipt_date,
          suppliers!inner(name)
        )
      )
    `,
    )
    .eq('work_order_id', workOrderId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  interface YarnIssueJoinRow {
    id: string;
    work_order_id: string;
    yarn_receipt_item_id: string;
    issued_kg: number;
    notes: string | null;
    tenant_id: string | null;
    created_by: string | null;
    created_at: string;
    yarn_receipt_items: {
      yarn_type: string;
      lot_number: string | null;
      receipt_id: string;
      yarn_receipts: {
        receipt_number: string;
        receipt_date: string;
        suppliers: { name: string };
      };
    };
  }

  return ((data ?? []) as unknown as YarnIssueJoinRow[]).map((row) => ({
    id: row.id,
    work_order_id: row.work_order_id,
    yarn_receipt_item_id: row.yarn_receipt_item_id,
    issued_kg: row.issued_kg,
    notes: row.notes,
    tenant_id: row.tenant_id,
    created_by: row.created_by,
    created_at: row.created_at,
    receipt_number: row.yarn_receipt_items.yarn_receipts.receipt_number,
    receipt_date: row.yarn_receipt_items.yarn_receipts.receipt_date,
    lot_number: row.yarn_receipt_items.lot_number,
    yarn_type: row.yarn_receipt_items.yarn_type,
    supplier_name: row.yarn_receipt_items.yarn_receipts.suppliers.name,
  }));
}
