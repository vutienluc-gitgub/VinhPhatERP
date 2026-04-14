import { Icon } from '@/shared/components/Icon';
import { useOrderAuditLogs } from '@/application/orders';

type OrderAuditLogViewerProps = {
  orderId: string;
};

// Map event types to readable texts
const EVENT_MAP: Record<
  string,
  { label: string; icon: string; color: string }
> = {
  ORDER_REQUEST_CREATED: {
    label: 'Tạo yêu cầu',
    icon: 'FilePlus',
    color: 'text-primary',
  },
  ORDER_STATUS_CHANGED: {
    label: 'Cập nhật trạng thái',
    icon: 'RefreshCw',
    color: 'text-warning',
  },
};

export function OrderAuditLogViewer({ orderId }: OrderAuditLogViewerProps) {
  const { data: logs, isLoading, error } = useOrderAuditLogs(orderId);

  if (isLoading) {
    return (
      <div className="p-4 text-center text-sm text-muted">
        Đang tải lịch sử...
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel-card card-flush mt-6 p-5">
        <h3 className="m-0 mb-4 flex items-center gap-2">
          <Icon name="Activity" size={18} className="text-muted" /> Lịch sử hoạt
          động
        </h3>
        <p className="text-danger text-sm">Lỗi tải dữ liệu lịch sử</p>
      </div>
    );
  }

  return (
    <div className="panel-card card-flush mt-6 p-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-5">
        <Icon name="History" size={100} />
      </div>
      <h3 className="m-0 mb-4 flex items-center gap-2 relative z-10">
        <Icon name="Activity" size={18} className="text-muted" /> Lịch sử hoạt
        động
      </h3>

      {!logs || logs.length === 0 ? (
        <div className="text-sm text-muted italic relative z-10">
          Chưa có giao dịch hoạt động nào được ghi nhận.
        </div>
      ) : (
        <div className="relative border-l-2 border-border ml-3 pl-5 space-y-6 z-10">
          {logs.map((log) => {
            const config = EVENT_MAP[log.event_type] || {
              label: log.event_type,
              icon: 'Zap',
              color: 'text-muted',
            };
            const payload = log.payload as Record<string, string>;
            const user = log.profiles as {
              full_name?: string;
              role?: string;
            } | null;

            let detailText = '';
            if (log.event_type === 'ORDER_STATUS_CHANGED') {
              detailText = `Trạng thái mới: ${payload.new_status}`;
            } else if (log.event_type === 'ORDER_REQUEST_CREATED') {
              detailText = `Tạo từ Portal Khách hàng`;
            }

            return (
              <div key={log.id} className="relative">
                <div
                  className={`absolute -left-[30px] p-1 bg-surface rounded-full border border-border flex items-center justify-center ${config.color}`}
                >
                  <Icon
                    name={config.icon as Parameters<typeof Icon>[0]['name']}
                    size={14}
                  />
                </div>
                <div className="flex flex-col md:flex-row md:items-baseline md:justify-between mb-1 gap-1">
                  <div className="font-semibold text-sm flex items-center gap-2">
                    {config.label}
                    <span className="text-xs font-normal text-muted bg-hover px-2 py-0.5 rounded-full">
                      {user?.full_name || payload.customer_name || 'Hệ thống'}
                      {user?.role && ` (${user.role})`}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted flex items-center gap-1 font-mono">
                    <Icon name="Clock" size={12} />
                    {new Date(log.created_at).toLocaleString('vi-VN')}
                  </div>
                </div>
                {detailText && (
                  <div className="text-sm text-text pr-10">{detailText}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
