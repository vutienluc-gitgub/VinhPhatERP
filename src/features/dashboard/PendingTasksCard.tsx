import { Link } from 'react-router-dom';

import { Icon, Badge } from '@/shared/components';
import type { PendingTask } from '@/application/analytics';

import { DASHBOARD_LABELS } from './dashboard.constants';
import styles from './PendingTasksCard.module.css';

type PendingTasksCardProps = {
  tasks: PendingTask[];
};

export function PendingTasksCard({ tasks }: PendingTasksCardProps) {
  const totalTasks = tasks.length;

  return (
    <div className="panel-card card-flush">
      <div className="card-header-area">
        <div className="card-header-row">
          <h3 className="text-lg font-bold m-0 flex items-center">
            {DASHBOARD_LABELS.PENDING_TASKS_TITLE}
            {totalTasks > 0 && (
              <Badge variant="info" className="ml-2 text-[0.65rem]">
                {totalTasks}
              </Badge>
            )}
          </h3>
        </div>
      </div>

      <div className="pt-3">
        {tasks.length === 0 ? (
          <div
            className={`${styles.taskEmpty} text-success flex items-center justify-center gap-2`}
          >
            <Icon name="Sparkles" size={20} />
            {DASHBOARD_LABELS.PENDING_TASKS_EMPTY}
          </div>
        ) : (
          <div className={styles.taskList}>
            {tasks.map((task) => (
              <Link key={task.text} to={task.href} className={styles.taskItem}>
                <span className={styles.taskItemIcon}>
                  <Icon name={task.icon} size={20} />
                </span>
                <span className={`${styles.taskItemText} font-medium`}>
                  {task.text}
                </span>
                {task.count > 0 && (
                  <span
                    className={`${styles.taskItemCount}${task.isAlert ? ` ${styles.isAlert}` : ''}`}
                  >
                    {task.count}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
