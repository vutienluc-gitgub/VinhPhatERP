import { Link } from 'react-router-dom';

import { Icon } from '@/shared/components';
import type { PendingTask } from '@/application/analytics';

type PendingTasksCardProps = {
  tasks: PendingTask[];
};

export function PendingTasksCard({ tasks }: PendingTasksCardProps) {
  const totalTasks = tasks.length;

  return (
    <div className="panel-card card-flush">
      <div className="card-header-area">
        <div className="card-header-row">
          <div>
            <p className="eyebrow">Hành động</p>
            <h3
              style={{
                margin: 0,
                fontSize: '1rem',
                fontWeight: 700,
              }}
            >
              Nhiệm vụ cần xử lý
              {totalTasks > 0 && (
                <span
                  className="badge badge-info ml-2"
                  style={{ fontSize: '0.65rem' }}
                >
                  {totalTasks}
                </span>
              )}
            </h3>
          </div>
        </div>
      </div>

      <div style={{ paddingTop: '0.75rem' }}>
        {tasks.length === 0 ? (
          <div className="task-empty text-success flex items-center justify-center gap-2">
            <Icon name="Sparkles" size={20} />
            Tuyệt vời! Không còn nhiệm vụ nào chưa xử lý.
          </div>
        ) : (
          <div className="task-list">
            {tasks.map((task) => (
              <Link key={task.text} to={task.href} className="task-item">
                <span className="task-item-icon">
                  <Icon name={task.icon} size={20} />
                </span>
                <span className="task-item-text font-medium">{task.text}</span>
                {task.count > 0 && (
                  <span
                    className={`task-item-count${task.isAlert ? ' is-alert' : ''}`}
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
