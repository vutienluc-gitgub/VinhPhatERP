import type { PortalProgressStage } from '@/domain/portal/types';
import {
  PRODUCTION_STAGE_LABELS,
  STAGE_STATUS_LABELS,
} from '@/features/customer-portal/constants';

interface Props {
  stages: PortalProgressStage[];
}

export function PortalProgressTimeline({ stages }: Props) {
  if (stages.length === 0) {
    return (
      <p className="portal-empty" style={{ padding: '0.5rem 0' }}>
        Chưa có dữ liệu tiến độ.
      </p>
    );
  }

  return (
    <ol className="portal-timeline">
      {stages.map((s) => (
        <li key={s.id} className="portal-timeline-item">
          <div
            className={`portal-timeline-dot${
              s.status === 'done'
                ? ' portal-timeline-dot--done'
                : s.status === 'in_progress'
                  ? ' portal-timeline-dot--active'
                  : ''
            }`}
          />
          <div className="portal-timeline-body">
            <div className="portal-timeline-title">
              <span className="portal-timeline-name">
                {PRODUCTION_STAGE_LABELS[s.stage] ?? s.stage}
              </span>
              <span className="portal-badge">
                {STAGE_STATUS_LABELS[s.status] ?? s.status}
              </span>
              {s.is_overdue && (
                <span className="portal-badge portal-badge--danger">
                  Trễ hạn
                </span>
              )}
            </div>
            <div className="portal-timeline-dates">
              {s.planned_date && <span>Dự kiến: {s.planned_date}</span>}
              {s.actual_date && <span>Thực tế: {s.actual_date}</span>}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
