import { EmployeeWorkload } from '@/api/operations.api';
import { OPERATIONS_MESSAGES } from '@/features/operations/constants';
import { ActivityItem } from '@/features/operations/types';
import { LiveIndicator } from '@/shared/components';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/Card';

import { ActivityFeed } from './ActivityFeed';
import { ProgressList } from './ProgressList';

interface OperationsDashboardProps {
  workload: EmployeeWorkload[];
  activities: ActivityItem[];
}

export function OperationsDashboard({
  workload,
  activities,
}: OperationsDashboardProps) {
  const workloadRows = workload.slice(0, 6);
  const maxOpenTasks = Math.max(8, ...workloadRows.map((x) => x.open_tasks));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <Card className="lg:col-span-7 border-none shadow-sm bg-surface backdrop-blur-sm">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-text">
            {OPERATIONS_MESSAGES.TEAM_WORKLOAD}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ProgressList
            rows={workloadRows.map((r) => ({
              label: r.name,
              value: r.open_tasks,
              max: maxOpenTasks,
              right: `${r.open_tasks} ${OPERATIONS_MESSAGES.TASK}`,
              color:
                r.open_tasks > 5
                  ? '#ef4444'
                  : r.open_tasks > 3
                    ? '#f59e0b'
                    : '#6366f1',
            }))}
          />
        </CardContent>
      </Card>
      <Card className="lg:col-span-5 border-none shadow-sm bg-surface backdrop-blur-sm">
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-text">
              {OPERATIONS_MESSAGES.LIVE_ACTIVITY}
            </CardTitle>
            <LiveIndicator label={OPERATIONS_MESSAGES.LIVE} />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-y-auto max-h-[400px]">
          <ActivityFeed items={activities} />
        </CardContent>
      </Card>
    </div>
  );
}
