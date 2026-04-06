import { Link } from 'react-router-dom'

import type { PendingTask } from './useDashboardData'

type PendingTasksCardProps = {
  tasks: PendingTask[]
}

export function PendingTasksCard({ tasks }: PendingTasksCardProps) {
  const totalTasks = tasks.length

  return (
    <div className="panel-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '1.25rem 1.25rem 0' }}>
        <div className="card-header-row">
          <div>
            <p className="eyebrow">Hành động</p>
            <h3 style={{ margin: 0 }}>
              Nhiệm vụ cần xử lý
              {totalTasks > 0 && (
                <span className="roll-status reserved" style={{ marginLeft: '0.5rem', fontSize: '0.75rem' }}>
                  {totalTasks}
                </span>
              )}
            </h3>
          </div>
        </div>
      </div>

      <div style={{ padding: '0.75rem 1.25rem 1.25rem' }}>
        {tasks.length === 0 ? (
          <div className="task-empty">
            ✅ Không có việc cần xử lý
          </div>
        ) : (
          <div className="task-list">
            {tasks.map((task) => (
              <Link
                key={task.text}
                to={task.href}
                className="task-item"
              >
                <span className="task-item-icon">{task.icon}</span>
                <span className="task-item-text">{task.text}</span>
                {task.count > 0 && (
                  <span className={`task-item-count${task.isAlert ? ' is-alert' : ''}`}>
                    {task.count}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
