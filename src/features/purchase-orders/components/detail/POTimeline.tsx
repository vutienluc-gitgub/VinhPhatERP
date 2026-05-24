import { Icon } from '@/shared/components';

interface POTimelineProps {
  status: string;
}

export function POTimeline({ status }: POTimelineProps) {
  const steps = [
    { id: 'draft', label: 'Nháp (Draft)' },
    { id: 'approved', label: 'Đã duyệt' },
    { id: 'partial_received', label: 'Nhập kho 1 phần' },
    { id: 'completed', label: 'Hoàn tất' },
  ];

  if (status === 'rejected') {
    return (
      <div className="flex items-center gap-4 py-4 px-6 bg-red-50 border border-red-200 rounded-xl shadow-sm mb-6 text-red-700">
        <Icon name="XCircle" size={24} className="text-red-500" />
        <span className="font-semibold text-lg">Đã từ chối (Rejected)</span>
      </div>
    );
  }
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-4 py-4 px-6 bg-gray-50 border border-gray-200 rounded-xl shadow-sm mb-6 text-gray-700">
        <Icon name="Slash" size={24} className="text-gray-500" />
        <span className="font-semibold text-lg">Đã hủy (Cancelled)</span>
      </div>
    );
  }

  let currentIndex = steps.findIndex((s) => s.id === status);
  if (currentIndex === -1) currentIndex = 0;

  return (
    <div className="bg-surface border border-border rounded-xl p-6 shadow-sm mb-6 overflow-hidden">
      <h3 className="font-semibold text-lg border-b border-border pb-3 mb-8 m-0">
        Tiến trình xử lý (Lifecycle)
      </h3>
      <div className="flex items-center justify-between relative px-4 md:px-16">
        <div className="absolute left-14 right-14 top-5 h-1.5 bg-gray-100 -z-10 rounded-full"></div>
        <div
          className="absolute left-14 top-5 h-1.5 bg-primary -z-10 transition-all duration-500 rounded-full"
          style={{
            width: `calc(${(currentIndex / (steps.length - 1)) * 100}% - 7rem)`,
          }}
        ></div>
        {steps.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <div
              key={step.id}
              className="flex flex-col items-center gap-3 bg-surface px-4"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${isCompleted ? 'bg-primary border-primary text-white shadow-md' : 'bg-surface border-gray-200 text-gray-400'}`}
              >
                {isCompleted ? <Icon name="Check" size={20} /> : index + 1}
              </div>
              <span
                className={`text-sm font-semibold ${isCurrent ? 'text-primary' : isCompleted ? 'text-gray-800' : 'text-gray-400'}`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
