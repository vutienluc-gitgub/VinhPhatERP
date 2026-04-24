import { untypedDb } from '@/services/supabase/untyped';
import { getTenantId } from '@/services/supabase/tenant';
import { Task, Employee, Kpi, ActivityItem } from '@/features/operations/types';
import { safeUpsert } from '@/lib/db-guard';
import { OPERATIONS_MESSAGES } from '@/features/operations/constants';

import { fetchEmployees as fetchCentralEmployees } from './employees.api';
import { demoTasks, demoKpis, demoActivities } from './operations.demo';

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
  const results = await safeUpsert<Partial<Task>>({
    table: 'tasks',
    data: { ...values, id },
    conflictKey: 'id',
  });

  const updated = (results as unknown as Task[])[0];
  if (!updated) throw new Error('Failed to update task');
  return updated;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await untypedDb.from('tasks').delete().eq('id', id);
  if (error) throw error;
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
