import { useMemo } from 'react';

import {
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
} from '@/features/operations/constants';

export type TaskFormOptionsProps = {
  employees: { id: string; name: string; code?: string; phone?: string }[];
  kpis: { id: string; name: string; code: string }[];
  ordersList: {
    id: string;
    order_number: string;
    customer_name: string | null;
  }[];
  workOrdersList: { id: string; wo_number: string; target_name: string }[];
};

export function useTaskFormOptions({
  employees,
  kpis,
  ordersList,
  workOrdersList,
}: TaskFormOptionsProps) {
  const employeeOptions = useMemo(
    () =>
      employees.map((e) => ({
        value: e.id,
        label: e.name,
        code: e.code,
        phone: e.phone,
      })),
    [employees],
  );

  const kpiOptions = useMemo(
    () =>
      kpis.map((k) => ({
        value: k.id,
        label: `${k.code} - ${k.name}`,
      })),
    [kpis],
  );

  const orderOptions = useMemo(
    () =>
      ordersList.map((o) => ({
        value: o.id,
        label: `${o.order_number} - ${o.customer_name || 'Khách lẻ'}`,
      })),
    [ordersList],
  );

  const workOrderOptions = useMemo(
    () =>
      workOrdersList.map((wo) => ({
        value: wo.id,
        label: `${wo.wo_number} - ${wo.target_name}`,
      })),
    [workOrdersList],
  );

  const priorityOptions = useMemo(
    () => [
      { value: 'low', label: TASK_PRIORITY_LABELS.low, icon: 'ArrowDown' },
      { value: 'normal', label: TASK_PRIORITY_LABELS.normal, icon: 'Minus' },
      { value: 'high', label: TASK_PRIORITY_LABELS.high, icon: 'ArrowUp' },
      { value: 'urgent', label: TASK_PRIORITY_LABELS.urgent, icon: 'Zap' },
    ],
    [],
  );

  const statusOptions = useMemo(
    () => [
      { value: 'todo', label: TASK_STATUS_LABELS.todo },
      { value: 'in_progress', label: TASK_STATUS_LABELS.in_progress },
      { value: 'review', label: TASK_STATUS_LABELS.review },
      { value: 'blocked', label: TASK_STATUS_LABELS.blocked },
      { value: 'done', label: TASK_STATUS_LABELS.done },
      { value: 'cancelled', label: TASK_STATUS_LABELS.cancelled },
    ],
    [],
  );

  return {
    employeeOptions,
    kpiOptions,
    orderOptions,
    workOrderOptions,
    priorityOptions,
    statusOptions,
  };
}
