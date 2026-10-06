import { Link } from 'react-router-dom';

import { Icon } from '@/shared/components';
import { PORTAL_DASHBOARD_LABELS } from '@/features/customer-portal/constants';

interface PortalQuickActionsProps {
  onOpenChat: () => void;
}

export function PortalQuickActions({ onOpenChat }: PortalQuickActionsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground tracking-tight m-0">
          {PORTAL_DASHBOARD_LABELS.QUICK_ACTIONS_TITLE}
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Action 1: Danh mục vải */}
        <Link
          to="/portal/customer/fabric-catalog"
          className="group p-4 rounded-xl border border-border bg-surface hover:bg-surface-secondary/50 transition-all hover:-translate-y-0.5 hover:shadow-sm flex flex-col gap-2.5 text-inherit no-underline"
        >
          <div className="w-9 h-9 rounded-lg bg-info-soft text-info flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Icon name="Layers" size={18} />
          </div>
          <div>
            <p className="m-0 text-xs font-semibold text-foreground">
              Danh mục Vải & Sợi
            </p>
            <p className="mt-1 mb-0 text-[0.75rem] text-muted leading-relaxed">
              Tra cứu thông số GSM, bảng màu dệt may và định lượng mẫu.
            </p>
          </div>
        </Link>

        {/* Action 2: Báo giá */}
        <Link
          to="/portal/customer/quotations"
          className="group p-4 rounded-xl border border-border bg-surface hover:bg-surface-secondary/50 transition-all hover:-translate-y-0.5 hover:shadow-sm flex flex-col gap-2.5 text-inherit no-underline"
        >
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Icon name="FileText" size={18} />
          </div>
          <div>
            <p className="m-0 text-xs font-semibold text-foreground">
              Yêu cầu Báo giá
            </p>
            <p className="mt-1 mb-0 text-[0.75rem] text-muted leading-relaxed">
              Khởi tạo đơn yêu cầu báo giá dệt nhuộm và theo dõi phản hồi.
            </p>
          </div>
        </Link>

        {/* Action 3: Giao hàng */}
        <Link
          to="/portal/customer/shipments"
          className="group p-4 rounded-xl border border-border bg-surface hover:bg-surface-secondary/50 transition-all hover:-translate-y-0.5 hover:shadow-sm flex flex-col gap-2.5 text-inherit no-underline"
        >
          <div className="w-9 h-9 rounded-lg bg-success-soft text-success flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Icon name="Truck" size={18} />
          </div>
          <div>
            <p className="m-0 text-xs font-semibold text-foreground">
              Lịch trình Giao hàng
            </p>
            <p className="mt-1 mb-0 text-[0.75rem] text-muted leading-relaxed">
              Kiểm tra biên bản giao nhận và theo dõi tiến độ vận chuyển.
            </p>
          </div>
        </Link>

        {/* Action 4: Hỗ trợ chat */}
        <button
          type="button"
          onClick={onOpenChat}
          className="group p-4 rounded-xl border border-border bg-surface hover:bg-surface-secondary/50 transition-all hover:-translate-y-0.5 hover:shadow-sm flex flex-col gap-2.5 text-left cursor-pointer border-solid"
        >
          <div className="w-9 h-9 rounded-lg bg-warning-soft text-warning flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Icon name="MessageSquare" size={18} />
          </div>
          <div>
            <p className="m-0 text-xs font-semibold text-foreground">
              Tư vấn Khách hàng
            </p>
            <p className="mt-1 mb-0 text-[0.75rem] text-muted leading-relaxed">
              Trò chuyện trực tuyến với chuyên viên quản lý tài khoản của bạn.
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
