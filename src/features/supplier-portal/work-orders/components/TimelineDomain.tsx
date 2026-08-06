import { Card } from '@/shared/components/Card';
import { Icon } from '@/shared/components/Icon';
import { Badge } from '@/shared/components/Badge';

interface TimelineEvent {
  id: string;
  type: 'status_change' | 'material_receipt' | 'qc_check' | 'exception_flag';
  actor: string;
  time: string;
  metadata: Record<string, string>;
}

export function TimelineDomain() {
  // Using useOutletContext without destructuring variables if they are unused

  // Mocking Event Sourcing Timeline Data
  const events: TimelineEvent[] = [
    {
      id: 'evt-4',
      type: 'exception_flag',
      actor: 'Hệ thống (IoT)',
      time: '10:15 - Hôm nay',
      metadata: {
        flag: 'machine_breakdown',
        description: 'Máy dệt số 03 báo lỗi mất kết nối.',
      },
    },
    {
      id: 'evt-3',
      type: 'status_change',
      actor: 'Nguyen Van A (Quản đốc)',
      time: '08:00 - Hôm nay',
      metadata: {
        from: 'yarn_issued',
        to: 'in_progress',
        note: 'Bắt đầu chạy máy',
      },
    },
    {
      id: 'evt-2',
      type: 'material_receipt',
      actor: 'Tran Thi B (Thủ kho)',
      time: '16:30 - Hôm qua',
      metadata: {
        item: 'Sợi Cotton 30s',
        qty: '510 kg',
        status: 'Xác nhận đủ',
      },
    },
    {
      id: 'evt-1',
      type: 'status_change',
      actor: 'ERP System',
      time: '14:00 - Hôm qua',
      metadata: {
        from: 'draft',
        to: 'yarn_issued',
        note: 'Đã xuất kho vật tư',
      },
    },
  ];

  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'status_change':
        return <Icon name="activity" size={16} className="text-primary" />;
      case 'material_receipt':
        return <Icon name="package" size={16} className="text-success" />;
      case 'qc_check':
        return <Icon name="check-circle" size={16} className="text-info" />;
      case 'exception_flag':
        return <Icon name="alert-triangle" size={16} className="text-danger" />;
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-6 text-foreground">
        Lịch sử hoạt động (Timeline)
      </h2>
      <div className="relative border-l border-default ml-4 space-y-8 pb-4">
        {events.map((evt) => (
          <div key={evt.id} className="relative pl-8">
            {/* Timeline Dot */}
            <div className="absolute -left-3.5 top-1 bg-surface border-2 border-default rounded-full p-1 z-10">
              {getEventIcon(evt.type)}
            </div>

            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-foreground">
                    {evt.actor}
                  </span>
                  <span className="text-sm text-muted hidden md:inline">•</span>
                  <span className="text-sm text-muted">{evt.time}</span>
                </div>

                {evt.type === 'status_change' && (
                  <p className="text-sm text-foreground">
                    Đã đổi trạng thái từ{' '}
                    <Badge variant="default" className="mx-1">
                      {evt.metadata.from}
                    </Badge>{' '}
                    sang{' '}
                    <Badge variant="default" className="mx-1">
                      {evt.metadata.to}
                    </Badge>
                  </p>
                )}

                {evt.type === 'material_receipt' && (
                  <p className="text-sm text-foreground">
                    Đã nhận <strong>{evt.metadata.qty}</strong> -{' '}
                    {evt.metadata.item}{' '}
                    <Badge variant="success" className="ml-2">
                      {evt.metadata.status}
                    </Badge>
                  </p>
                )}

                {evt.type === 'exception_flag' && (
                  <div className="mt-1 p-3 bg-danger-soft border border-danger-soft rounded text-sm text-danger">
                    <strong>Sự cố:</strong> {evt.metadata.description}
                  </div>
                )}

                {evt.metadata.note && (
                  <p className="text-sm text-muted mt-1 italic">
                    "{evt.metadata.note}"
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
