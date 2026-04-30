import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';

import { Button, Combobox } from '@/shared/components';
import {
  taskSchema,
  type TaskFormValues,
  tasksDefaultValues,
} from '@/schema/tasks.schema';

import { Task } from './types';
import { useTaskFormOptions } from './hooks/useTaskFormOptions';

export type TaskFormViewProps = {
  task: Task | null;
  employees: { id: string; name: string; code?: string; phone?: string }[];
  kpis: { id: string; name: string; code: string }[];
  ordersList: {
    id: string;
    order_number: string;
    customer_name: string | null;
  }[];
  workOrdersList: { id: string; wo_number: string; target_name: string }[];
  isPending: boolean;
  onSubmit: (values: TaskFormValues) => void;
  onClose: () => void;
  onDelete?: () => void;
};

export function TaskFormView({
  task,
  employees,
  kpis,
  ordersList,
  workOrdersList,
  isPending,
  onSubmit,
  onClose,
  onDelete,
}: TaskFormViewProps) {
  const isEditing = !!task;

  const {
    register,
    handleSubmit,
    control,
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

  const {
    employeeOptions,
    kpiOptions,
    orderOptions,
    workOrderOptions,
    priorityOptions,
    statusOptions,
  } = useTaskFormOptions({ employees, kpis, ordersList, workOrdersList });

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
                options={employeeOptions}
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
                options={employeeOptions}
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
                options={orderOptions}
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
                options={workOrderOptions}
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
                options={priorityOptions}
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
                options={statusOptions}
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
                options={kpiOptions}
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
          {isEditing && onDelete && (
            <Button
              variant="secondary"
              type="button"
              onClick={onDelete}
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
