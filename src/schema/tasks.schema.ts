import { z } from 'zod';

export const taskSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống'),
  description: z.string().optional().nullable(),
  assignee_id: z.string().optional().nullable(),
  reviewer_id: z.string().optional().nullable(),
  linked_kpi_id: z.string().optional().nullable(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  task_type: z.enum(['growth', 'maintenance', 'admin', 'urgent']),
  status: z.enum([
    'todo',
    'in_progress',
    'blocked',
    'review',
    'done',
    'cancelled',
  ]),
  due_date: z.string().optional().nullable(),
  order_id: z.string().optional().nullable(),
  work_order_id: z.string().optional().nullable(),
  estimated_hours: z.number().optional().nullable(),
  actual_hours: z.number().optional().nullable(),
  version: z.number().optional(), // Optimistic Concurrency Control
});

export type TaskFormValues = z.infer<typeof taskSchema>;

export const tasksDefaultValues: TaskFormValues = {
  title: '',
  description: '',
  assignee_id: null,
  reviewer_id: null,
  linked_kpi_id: null,
  priority: 'normal',
  task_type: 'maintenance',
  status: 'todo',
  due_date: null,
  order_id: null,
  work_order_id: null,
  estimated_hours: 0,
  actual_hours: 0,
  version: 1,
};
