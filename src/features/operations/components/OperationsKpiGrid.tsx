import { KpiGridPremium, KpiCardPremium } from '@/shared/components';
import { OPERATIONS_MESSAGES } from '@/features/operations/constants';

interface OperationsKpiGridProps {
  totalTasks: number;
  doneCount: number;
  overdueCount: number;
  onTimeRate: number;
}

export function OperationsKpiGrid({
  totalTasks,
  doneCount,
  overdueCount,
  onTimeRate,
}: OperationsKpiGridProps) {
  return (
    <KpiGridPremium className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
      <KpiCardPremium
        label={OPERATIONS_MESSAGES.TOTAL_TASK}
        value={totalTasks}
        icon="ListTodo"
        variant="secondary"
      />
      <KpiCardPremium
        label={OPERATIONS_MESSAGES.COMPLETED}
        value={doneCount}
        icon="CircleCheck"
        variant="success"
        trendValue="+5"
        trendDirection="up"
      />
      <KpiCardPremium
        label={OPERATIONS_MESSAGES.OVERDUE}
        value={overdueCount}
        icon="TriangleAlert"
        variant={overdueCount > 0 ? 'danger' : 'success'}
      />
      <KpiCardPremium
        label={OPERATIONS_MESSAGES.EFFICIENCY}
        value={`${onTimeRate}%`}
        icon="Target"
        variant="primary"
      />
    </KpiGridPremium>
  );
}
