export type TaskStatus =
  | 'todo'
  | 'in_progress'
  | 'blocked'
  | 'review'
  | 'done'
  | 'cancelled';
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TaskType = 'growth' | 'maintenance' | 'admin' | 'urgent';

export interface Task {
  id: string;
  tenant_id?: string;
  title: string;
  description?: string | null;
  assignee_id?: string | null;
  reviewer_id?: string | null;
  linked_kpi_id?: string | null;
  priority: TaskPriority;
  task_type: TaskType;
  status: TaskStatus;
  due_date?: string | null;
  order_id?: string | null;
  work_order_id?: string | null;
  estimated_hours?: number | null;
  actual_hours?: number | null;
  version?: number; // Optimistic Concurrency Control (OCC)
  created_at?: string;
  updated_at?: string;
}

export interface Employee {
  id: string;
  name: string;
  code: string;
  phone?: string;
  status: string;
}

export interface Kpi {
  id: string;
  code: string;
  name: string;
  unit: string;
  description?: string | null;
}

export interface ActivityItem {
  id: string;
  actor: string;
  action: string;
  time: string;
  avatarColor: string;
}
