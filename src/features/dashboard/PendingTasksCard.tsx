import { Link } from 'react-router-dom';

import type { PendingTask } from './useDashboardData';

type PendingTasksCardProps = {
  tasks: PendingTask[];
};

export function PendingTasksCard({ tasks }: PendingTasksCardProps) {
  const totalTasks = tasks.length;

  return (
    <div className="panel-card card-flush">
      <div className="card-header-area card-header-premium">
        <div>
          <p className="eyebrow-premium">HÀNH ĐỘNG</p>
          <h3 className="title-premium">
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

      <div className="p-4">
        {tasks.length === 0 ? (
          <div className="task-empty py-6 text-success">
            ✨ Tuyệt vời! Bạn không còn nhiệm vụ nào chưa xử lý.
          </div>
        ) : (
          <div className="task-list">
            {tasks.map((task) => (
              <Link key={task.text} to={task.href} className="task-item">
                <span className="task-item-icon">{task.icon}</span>
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
