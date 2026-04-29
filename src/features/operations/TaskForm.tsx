import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';

import { Button, Combobox } from '@/shared/components';
import {
  taskSchema,
  type TaskFormValues,
  tasksDefaultValues,
} from '@/schema/tasks.schema';
import {
  useOperationsData,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
} from '@/application/operations/useOperationsData';

import { Task } from './types';
import {
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  OPERATIONS_MESSAGES,
} from './constants';

type TaskFormProps = {
  task: Task | null;
  onClose: () => void;
};

interface OrderMin {
  id: string;
  order_number: string;
  customer_name: string | null;
}
interface WorkOrderMin {
  id: string;
  wo_number: string;
  target_name: string;
}

export function TaskForm({ task, onClose }: TaskFormProps) {
  const isEditing = !!task;
  const { employees, kpis, orders, workOrders } = useOperationsData();
  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const deleteMutation = useDeleteTask();

  const ordersList = (orders as unknown as OrderMin[]) || [];
  const workOrdersList = (workOrders as unknown as WorkOrderMin[]) || [];

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: task
      ? {
          title: task.title,
          description: task.description,
          assignee_id: task.assignee_id,
          reviewer_id: task.reviewer_id,
          linked_kpi_id: task.linked_kpi_id,
          priority: task.priority,
          task_type: task.task_type,
          status: task.status,
          due_date: task.due_date,
          order_id: task.order_id,
          work_order_id: task.work_order_id,
          estimated_hours: Number(task.estimated_hours) || 0,
          actual_hours: Number(task.actual_hours) || 0,
          version: task.version || 1,
        }
      : tasksDefaultValues,
  });

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description,
        assignee_id: task.assignee_id,
        reviewer_id: task.reviewer_id,
        linked_kpi_id: task.linked_kpi_id,
        priority: task.priority,
        task_type: task.task_type,
        status: task.status,
        due_date: task.due_date,
        order_id: task.order_id,
        work_order_id: task.work_order_id,
        estimated_hours: Number(task.estimated_hours) || 0,
        actual_hours: Number(task.actual_hours) || 0,
        version: task.version || 1,
      });
    } else {
      reset(tasksDefaultValues);
    }
  }, [task, reset]);

  const onSubmit = async (values: TaskFormValues) => {
    try {
      if (isEditing && task) {
        await updateMutation.mutateAsync({ id: task.id, values });
        toast.success(OPERATIONS_MESSAGES.UPDATE_SUCCESS);
      } else {
        await createMutation.mutateAsync(values);
        toast.success(OPERATIONS_MESSAGES.SAVE_SUCCESS);
      }
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : OPERATIONS_MESSAGES.SAVE_ERROR;
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!task || !window.confirm(OPERATIONS_MESSAGES.DELETE_CONFIRM)) return;
    try {
      await deleteMutation.mutateAsync(task.id);
      toast.success(OPERATIONS_MESSAGES.DELETE_SUCCESS);
      onClose();
    } catch {
      toast.error(OPERATIONS_MESSAGES.DELETE_ERROR);
    }
  };

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="form-field">
        <label className="text-sm font-medium text-zinc-700 mb-1 block">
          Tiêu đề task *
        </label>
        <input
          {...register('title')}
          className={`field-input ${errors.title ? 'is-error' : ''}`}
          placeholder="Nhập tiêu đề công việc..."
        />
        {errors.title && <p className="field-error">{errors.title.message}</p>}
      </div>

      <div className="form-field">
        <label className="text-sm font-medium text-zinc-700 mb-1 block">
          Mô tả
        </label>
        <textarea
          {...register('description')}
          className="field-textarea h-24"
          placeholder="Chi tiết công việc..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="form-field">
          <label className="text-sm font-medium text-zinc-700 mb-1 block">
            Người thực hiện
          </label>
          <Controller
            name="assignee_id"
            control={control}
            render={({ field }) => (
              <Combobox
                options={employees.map((e) => ({
                  value: e.id,
                  label: e.name,
                  code: e.code,
                  phone: e.phone,
                }))}
                value={field.value ?? undefined}
                onChange={field.onChange}
                placeholder="Chọn nhân viên"
              />
            )}
          />
        </div>

        <div className="form-field">
          <label className="text-sm font-medium text-zinc-700 mb-1 block">
            Người review
          </label>
          <Controller
            name="reviewer_id"
            control={control}
            render={({ field }) => (
              <Combobox
                options={employees.map((e) => ({
                  value: e.id,
                  label: e.name,
                  code: e.code,
                  phone: e.phone,
                }))}
                value={field.value ?? undefined}
                onChange={field.onChange}
                placeholder="Chọn nhân viên"
              />
            )}
          />
        </div>
      </div>

      {/* ERP Links */}
      <div className="grid grid-cols-2 gap-4 p-3 bg-surface rounded-lg border border-border">
        <div className="form-field">
          <label className="text-sm font-medium text-primary mb-1 block">
            Liên kết Đơn hàng
          </label>
          <Controller
            name="order_id"
            control={control}
            render={({ field }) => (
              <Combobox
                options={ordersList.map((o) => ({
                  value: o.id,
                  label: `${o.order_number} - ${o.customer_name || 'Khách lẻ'}`,
                }))}
                value={field.value ?? undefined}
                onChange={field.onChange}
                placeholder="Chọn Đơn hàng"
              />
            )}
          />
        </div>

        <div className="form-field">
          <label className="text-sm font-medium text-primary mb-1 block">
            Lệnh sản xuất (WO)
          </label>
          <Controller
            name="work_order_id"
            control={control}
            render={({ field }) => (
              <Combobox
                options={workOrdersList.map((wo) => ({
                  value: wo.id,
                  label: `${wo.wo_number} - ${wo.target_name}`,
                }))}
                value={field.value ?? undefined}
                onChange={field.onChange}
                placeholder="Chọn Lệnh SX"
              />
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="form-field">
          <label className="text-sm font-medium text-zinc-700 mb-1 block">
            Độ ưu tiên
          </label>
          <Controller
            name="priority"
            control={control}
            render={({ field }) => (
              <Combobox
                options={[
                  {
                    value: 'low',
                    label: TASK_PRIORITY_LABELS.low,
                    icon: 'ArrowDown',
                  },
                  {
                    value: 'normal',
                    label: TASK_PRIORITY_LABELS.normal,
                    icon: 'Minus',
                  },
                  {
                    value: 'high',
                    label: TASK_PRIORITY_LABELS.high,
                    icon: 'ArrowUp',
                  },
                  {
                    value: 'urgent',
                    label: TASK_PRIORITY_LABELS.urgent,
                    icon: 'Zap',
                  },
                ]}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </div>

        <div className="form-field">
          <label className="text-sm font-medium text-zinc-700 mb-1 block">
            Trạng thái
          </label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Combobox
                options={[
                  { value: 'todo', label: TASK_STATUS_LABELS.todo },
                  {
                    value: 'in_progress',
                    label: TASK_STATUS_LABELS.in_progress,
                  },
                  { value: 'review', label: TASK_STATUS_LABELS.review },
                  { value: 'blocked', label: TASK_STATUS_LABELS.blocked },
                  { value: 'done', label: TASK_STATUS_LABELS.done },
                  { value: 'cancelled', label: TASK_STATUS_LABELS.cancelled },
                ]}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="form-field">
          <label className="text-sm font-medium text-zinc-700 mb-1 block">
            KPI liên kết
          </label>
          <Controller
            name="linked_kpi_id"
            control={control}
            render={({ field }) => (
              <Combobox
                options={kpis.map((k) => ({
                  value: k.id,
                  label: `${k.code} - ${k.name}`,
                }))}
                value={field.value ?? undefined}
                onChange={field.onChange}
                placeholder="Chọn KPI"
              />
            )}
          />
        </div>

        <div className="form-field">
          <label className="text-sm font-medium text-zinc-700 mb-1 block">
            Hạn chót (Deadline)
          </label>
          <input
            {...register('due_date')}
            type="date"
            className="field-input"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="form-field">
          <label className="text-sm font-medium text-zinc-700 mb-1 block">
            Giờ dự kiến (h)
          </label>
          <input
            {...register('estimated_hours', { valueAsNumber: true })}
            type="number"
            step="0.5"
            className="field-input"
          />
        </div>

        <div className="form-field">
          <label className="text-sm font-medium text-zinc-700 mb-1 block">
            Giờ thực tế (h)
          </label>
          <input
            {...register('actual_hours', { valueAsNumber: true })}
            type="number"
            step="0.5"
            className="field-input"
          />
        </div>
      </div>

      <div className="pt-4 flex justify-between items-center border-t border-zinc-100">
        <div>
          {isEditing && (
            <Button
              variant="secondary"
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-100"
            >
              Xóa Task
            </Button>
          )}
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isPending}>
            Hủy
          </Button>
          <Button variant="primary" type="submit" disabled={isPending}>
            {isPending ? 'Đang lưu...' : isEditing ? 'Cập nhật' : 'Tạo Task'}
          </Button>
        </div>
      </div>
    </form>
  );
}
