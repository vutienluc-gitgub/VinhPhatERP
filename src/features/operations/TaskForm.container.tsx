import toast from 'react-hot-toast';

import {
  useOperationsData,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
} from '@/application/operations/useOperationsData';
import { useOrderList } from '@/application/orders/useOrders';
import { useWorkOrders } from '@/application/production/useWorkOrders';
import type { TaskFormValues } from '@/schema/tasks.schema';
import type { Task } from '@/domain/operations/types';

import { OPERATIONS_MESSAGES } from './constants';
import { TaskFormView } from './TaskForm.view';

type TaskFormContainerProps = {
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

/**
 * Safely extract an array from a query result that may be:
 * - a plain array (T[])
 * - a paginated object ({ data: T[], ... })
 * Avoids `as unknown as` double cast.
 */
function extractList<T>(queryData: unknown): T[] {
  if (Array.isArray(queryData)) {
    return queryData as T[];
  }
  if (
    queryData !== null &&
    typeof queryData === 'object' &&
    'data' in queryData &&
    Array.isArray((queryData as { data: unknown }).data)
  ) {
    return (queryData as { data: T[] }).data;
  }
  return [];
}

export function TaskFormContainer({ task, onClose }: TaskFormContainerProps) {
  const isEditing = !!task;

  const { employees, kpis, isLoading: isOpsLoading } = useOperationsData();
  const ordersQuery = useOrderList();
  const workOrdersQuery = useWorkOrders();

  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const deleteMutation = useDeleteTask();

  const ordersList = extractList<OrderMin>(ordersQuery.data);
  const workOrdersList = extractList<WorkOrderMin>(workOrdersQuery.data);

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  const isLoadingData =
    isOpsLoading || ordersQuery.isLoading || workOrdersQuery.isLoading;

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
    } catch (err) {
      const message =
        err instanceof Error ? err.message : OPERATIONS_MESSAGES.DELETE_ERROR;
      toast.error(message);
      console.error('[TaskForm] Delete failed:', err);
    }
  };

  if (isLoadingData) {
    return (
      <div className="p-8 flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-sm text-zinc-500">Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <TaskFormView
      key={task?.id ?? 'new-task'}
      task={task}
      employees={employees}
      kpis={kpis}
      ordersList={ordersList}
      workOrdersList={workOrdersList}
      isPending={isPending}
      onSubmit={onSubmit}
      onClose={onClose}
      onDelete={handleDelete}
    />
  );
}
