import { untypedDb } from '@/services/supabase/untyped';
import { getTenantId } from '@/services/supabase/tenant';
import { Task, Employee, Kpi, ActivityItem } from '@/features/operations/types';
import { safeUpsert, safeUpsertOne } from '@/lib/db-guard';
import { validateApiInput } from '@/lib/validate-api-input';
import { apiTaskInsert } from '@/schema/api-validation.schema';
import { OPERATIONS_MESSAGES } from '@/features/operations/constants';

import { fetchEmployees as fetchCentralEmployees } from './employees.api';
import { demoTasks, demoKpis, demoActivities } from './operations.demo';

export interface BlockedTransitionTelemetryEvent {
  taskId: string;
  fromStatus: string;
  targetStatus: string;
  reason: string;
  source: 'preview' | 'commit';
  timestamp: string;
}

export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await untypedDb
    .from('tasks')
    .select('*')
    .order('due_date', { ascending: true });

  if (error || !data || data.length === 0) {
    console.warn('Using demo tasks due to missing data or error:', error);
    return demoTasks as unknown as Task[];
  }
  return data as unknown as Task[];
}

export async function fetchEmployees(): Promise<Employee[]> {
  // Use central employee API to ensure data consistency across modules
  const data = await fetchCentralEmployees();
  return data as unknown as Employee[];
}

export async function fetchKpis(): Promise<Kpi[]> {
  const { data, error } = await untypedDb
    .from('kpis')
    .select('*')
    .order('code', { ascending: true });

  if (error || !data || data.length === 0) {
    return demoKpis as unknown as Kpi[];
  }
  return data as unknown as Kpi[];
}

interface RawAuditLog {
  id: string;
  created_at: string;
  event_type: string;
  profiles: { full_name: string } | null;
}

export async function fetchActivities(): Promise<ActivityItem[]> {
  const { data, error } = await untypedDb
    .from('business_audit_log')
    .select('id, created_at, event_type, payload, user_id, profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error || !data || data.length === 0) {
    return demoActivities;
  }

  return (data as unknown as RawAuditLog[]).map((item) => ({
    id: item.id,
    actor: item.profiles?.full_name || OPERATIONS_MESSAGES.SYSTEM,
    action: item.event_type,
    time: new Date(item.created_at).toLocaleString('vi-VN'),
    avatarColor: 'bg-zinc-500',
  }));
}

export async function createTask(task: Partial<Task>): Promise<Task> {
  validateApiInput(apiTaskInsert.passthrough(), task);
  const tenantId = await getTenantId();
  const results = await safeUpsert<Partial<Task>>({
    table: 'tasks',
    data: { ...task, tenant_id: tenantId },
    conflictKey: 'id',
  });

  const created = (results as unknown as Task[])[0];
  if (!created) throw new Error('Failed to create task');
  return created;
}

export async function updateTask(
  id: string,
  values: Partial<Task>,
): Promise<Task> {
  const targetVersion = values.version;
  const updatePayload = { ...values };
  delete updatePayload.version; // Xoá version khỏi payload vì DB tự trigger tăng

  let query = untypedDb.from('tasks').update(updatePayload).eq('id', id);

  if (targetVersion !== undefined) {
    query = query.eq('version', targetVersion);
  }

  const { data, error } = await query.select().maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error(
      'Dữ liệu đã bị thay đổi bởi người khác (Lost Update). Vui lòng tải lại trang.',
    );
  }

  return data as unknown as Task;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await untypedDb.from('tasks').delete().eq('id', id);
  if (error) throw error;
}

export async function logBlockedTransitionEvent(
  event: BlockedTransitionTelemetryEvent,
): Promise<void> {
  const tenantId = await getTenantId();

  const { data: authData } = await untypedDb.auth.getUser();
  const userId = authData?.user?.id ?? null;

  await safeUpsertOne({
    table: 'business_audit_log',
    data: {
      tenant_id: tenantId,
      entity_type: 'operations_task_board',
      entity_id: event.taskId,
      event_type: 'OPS_TASK_TRANSITION_BLOCKED',
      payload: {
        ...event,
        module: 'operations-board',
      },
      user_id: userId,
    },
    conflictKey: 'id',
  });
}

/**
 * Gọi RPC để hoàn thành task và ghi nhận giờ làm thực tế
 */
export async function completeTask(
  taskId: string,
  actualHours?: number,
): Promise<void> {
  const { error } = await untypedDb.rpc('rpc_complete_task', {
    p_task_id: taskId,
    p_actual_hours: actualHours ?? 0,
  });

  if (error) throw error;
}

export interface EmployeeWorkload {
  id: string;
  name: string;
  open_tasks: number;
}

/**
 * Lấy dữ liệu tải trọng công việc từ View v_employee_workload
 */
export async function fetchWorkload(): Promise<EmployeeWorkload[]> {
  const { data, error } = await untypedDb
    .from('v_employee_workload')
    .select('*')
    .order('open_tasks', { ascending: false });

  if (error || !data || data.length === 0) {
    return [];
  }
  return data as EmployeeWorkload[];
}
