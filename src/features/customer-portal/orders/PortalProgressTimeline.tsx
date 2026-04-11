import type { PortalProgressStage } from '@/features/customer-portal/types';

const STAGE_LABEL: Record<string, string> = {
  warping: 'Mắc sợi',
  weaving: 'Dệt',
  greige_check: 'Kiểm vải mộc',
  dyeing: 'Nhuộm',
  finishing: 'Hoàn tất',
  final_check: 'Kiểm tra cuối',
  packing: 'Đóng gói',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ',
  in_progress: 'Đang làm',
  done: 'Hoàn thành',
  skipped: 'Bỏ qua',
};

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-500',
  in_progress: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
  skipped: 'bg-gray-100 text-gray-400',
};

interface Props {
  stages: PortalProgressStage[];
}

export function PortalProgressTimeline({ stages }: Props) {
  if (stages.length === 0) {
    return <p className="text-sm text-gray-400">Chưa có dữ liệu tiến độ.</p>;
  }

  return (
    <ol className="space-y-3">
      {stages.map((s) => (
        <li key={s.id} className="flex items-start gap-3">
          {/* Dot */}
          <div
            className={`mt-0.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${
              s.status === 'done'
                ? 'bg-green-500'
                : s.status === 'in_progress'
                  ? 'bg-blue-500'
                  : 'bg-gray-300'
            }`}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-900">
                {STAGE_LABEL[s.stage] ?? s.stage}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[s.status]}`}
              >
                {STATUS_LABEL[s.status] ?? s.status}
              </span>
              {s.is_overdue && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                  Trễ hạn
                </span>
              )}
            </div>
            <div className="flex gap-4 mt-0.5 text-xs text-gray-500">
              {s.planned_date && <span>Dự kiến: {s.planned_date}</span>}
              {s.actual_date && <span>Thực tế: {s.actual_date}</span>}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
