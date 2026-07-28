import { KpiGrid, KpiCard } from '@/shared/components';
import { OPERATIONS_MESSAGES } from '@/features/operations/constants';

interface OperationsKpiGridProps {
  totalTasks: number;
  doneCount: number;
  overdueCount: number;
  completionRate: number;
}

export function OperationsKpiGrid({
  totalTasks,
  doneCount,
  overdueCount,
  completionRate,
}: OperationsKpiGridProps) {
  return (
    <KpiGrid className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 -mt-2">
      <KpiCard
        label={OPERATIONS_MESSAGES.TOTAL_TASK}
        value={totalTasks}
        icon="ClipboardList"
        variant="secondary"
      />
      <KpiCard
        label={OPERATIONS_MESSAGES.COMPLETED}
        value={doneCount}
        icon="CheckCircle2"
        variant="success"
      />
      <KpiCard
        label={OPERATIONS_MESSAGES.OVERDUE}
        value={overdueCount}
        icon="Clock"
        variant={overdueCount > 0 ? 'danger' : 'success'}
      />
      <KpiCard
        label={OPERATIONS_MESSAGES.COMPLETION_RATE}
        value={`${completionRate}%`}
        icon="TrendingUp"
        variant={
          completionRate >= 80
            ? 'success'
            : completionRate >= 50
              ? 'primary'
              : 'warning'
        }
      />
    </KpiGrid>
  );
}
