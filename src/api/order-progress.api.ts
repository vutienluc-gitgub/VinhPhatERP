import type {
  ProgressAuditLog,
  ProgressAuditLogWithOrder,
  StageStatus,
} from '@/features/order-progress/types';
import type {
  OrderProgress,
  OrderProgressInsert,
  OrderProgressUpdate,
  OrderProgressWithOrder,
} from '@/models';
import { supabase } from '@/services/supabase/client';
import { untypedDb } from '@/services/supabase/untyped';

const TABLE = 'order_progress';
const auditTable = () => untypedDb.from('progress_audit_log');

export async function fetchOrderProgressByOrder(
  orderId: string,
): Promise<OrderProgress[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('order_id', orderId)
    .order('created_at');
  if (error) throw error;
  return (data ?? []) as OrderProgress[];
}

export async function fetchProgressBoard(): Promise<OrderProgressWithOrder[]> {
  const { data, error } = await untypedDb
    .from(TABLE)
    .select(
      `
      *,
      orders(order_number, delivery_date, customers(name)),
      work_orders(work_order_number, status, supplier:suppliers(name), bom_template:bom_templates(name))
    `,
    )
    .order('created_at');
  if (error) throw error;
  return (data ?? []) as unknown as OrderProgressWithOrder[];
}

export async function updateStageStatus(
  progressId: string,
  status: StageStatus,
  notes?: string,
): Promise<void> {
  const { data: current, error: fetchErr } = await supabase
    .from(TABLE)
    .select('order_id, stage, status')
    .eq('id', progressId)
    .single();
  if (fetchErr) throw fetchErr;

  const oldStatus = current.status as StageStatus;

  const update: Record<string, unknown> = { status };
  if (status === 'in_progress' || status === 'done') {
    update.actual_date = new Date().toISOString().slice(0, 10);
  }
  if (notes !== undefined) {
    update.notes = notes.trim() || null;
  }

  const { error } = await supabase
    .from(TABLE)
    .update(update)
    .eq('id', progressId);
  if (error) throw error;

  const { data: userData } = await supabase.auth.getUser();
  await auditTable().insert({
    progress_id: progressId,
    order_id: current.order_id,
    stage: current.stage,
    old_status: oldStatus,
    new_status: status,
    changed_by: userData.user?.id ?? null,
    notes: notes?.trim() || null,
  });
}

export async function updatePlannedDate(
  progressId: string,
  plannedDate: string | null,
): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update({ planned_date: plannedDate })
    .eq('id', progressId);
  if (error) throw error;
}

export async function fetchProgressAuditLog(
  orderId: string,
): Promise<ProgressAuditLog[]> {
  const { data, error } = await auditTable()
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ProgressAuditLog[];
}

export async function fetchRecentAuditLog(
  limit = 50,
): Promise<ProgressAuditLogWithOrder[]> {
  const { data, error } = await auditTable()
    .select('*, orders(order_number, customers(name))')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as ProgressAuditLogWithOrder[];
}

export async function fetchProgressDashboard() {
  const { data, error } = await untypedDb
    .from(TABLE)
    .select(
      `
      *,
      orders(id, order_number, delivery_date, status, customers(name)),
      work_orders(id, work_order_number, status, end_date, supplier:suppliers(name), bom_template:bom_templates(name))
    `,
    )
    .order('created_at');
  if (error) throw error;

  const rows = (data ?? []) as unknown as OrderProgressWithOrder[];
  const today = new Date().toISOString().slice(0, 10);

  // Group key: order_id or work_order_id (for standalone)
  const groupMap = new Map<
    string,
    {
      orderId: string;
      orderNumber: string;
      customerName: string;
      deliveryDate: string | null;
      orderStatus: string;
      stages: OrderProgressWithOrder[];
    }
  >();

  for (const row of rows) {
    const groupKey = row.order_id ?? row.work_order_id ?? row.id;
    let group = groupMap.get(groupKey);
    if (!group) {
      // Determine display info: from order or from work_order
      const isStandalone = !row.order_id && row.work_order_id;
      group = {
        orderId: groupKey,
        orderNumber: isStandalone
          ? (row.work_orders?.work_order_number ?? '—')
          : (row.orders?.order_number ?? '—'),
        customerName: isStandalone
          ? (row.work_orders?.supplier?.name ?? 'LSX độc lập')
          : (row.orders?.customers?.name ?? '—'),
        deliveryDate: isStandalone
          ? (row.work_orders?.end_date ?? null)
          : (row.orders?.delivery_date ?? null),
        orderStatus: isStandalone
          ? (row.work_orders?.status ?? '')
          : (((row.orders as Record<string, unknown>)?.status as string) ?? ''),
        stages: [],
      };
      groupMap.set(groupKey, group);
    }
    group.stages.push(row);
  }

  const allOrders = Array.from(groupMap.values());

  const overdue = allOrders.filter((o) => {
    if (!o.deliveryDate || o.deliveryDate >= today) return false;
    if (o.orderStatus === 'completed' || o.orderStatus === 'cancelled')
      return false;
    return !o.stages.every(
      (s) => s.status === 'done' || s.status === 'skipped',
    );
  });

  const readyToShip = allOrders.filter((o) => {
    if (o.orderStatus === 'completed' || o.orderStatus === 'cancelled')
      return false;
    const nonSkipped = o.stages.filter((s) => s.status !== 'skipped');
    return (
      nonSkipped.length > 0 && nonSkipped.every((s) => s.status === 'done')
    );
  });

  const inProgress = allOrders.filter((o) => {
    if (o.orderStatus === 'completed' || o.orderStatus === 'cancelled')
      return false;
    return o.stages.some((s) => s.status === 'in_progress');
  });

  // Orders/WOs that have progress rows but haven't started some stage yet
  const waitingToStart = allOrders.filter((o) => {
    if (o.orderStatus === 'completed' || o.orderStatus === 'cancelled')
      return false;
    return o.stages.every(
      (s) => s.status === 'pending' || s.status === 'skipped',
    );
  });

  return {
    overdue,
    readyToShip,
    inProgress,
    waitingToStart,
    totalOrders: allOrders.length,
  };
}

export async function createOrderProgress(
  row: OrderProgressInsert,
): Promise<OrderProgress> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert([row])
    .select()
    .single();
  if (error) throw error;
  return data as OrderProgress;
}

export async function updateOrderProgress(
  id: string,
  row: OrderProgressUpdate,
): Promise<OrderProgress> {
  const { data, error } = await supabase
    .from(TABLE)
    .update(row)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as OrderProgress;
}
