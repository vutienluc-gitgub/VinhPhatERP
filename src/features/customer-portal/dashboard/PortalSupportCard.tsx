import { Icon } from '@/shared/components';
import { PORTAL_DASHBOARD_LABELS } from '@/features/customer-portal/constants';

interface PortalSupportCardProps {
  onOpenChat: () => void;
}

export function PortalSupportCard({ onOpenChat }: PortalSupportCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-xs space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Icon name="Headphones" size={20} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground m-0">
            {PORTAL_DASHBOARD_LABELS.SUPPORT_CARD_TITLE}
          </h2>
          <p className="text-[0.72rem] text-muted m-0 mt-0.5">
            {PORTAL_DASHBOARD_LABELS.SUPPORT_CARD_DESC}
          </p>
        </div>
      </div>

      <div className="pt-2 border-t border-border space-y-3">
        {/* Hotline */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted flex items-center gap-1.5">
            <Icon name="Phone" size={13} className="text-muted" />
            {PORTAL_DASHBOARD_LABELS.HOTLINE_LABEL}
          </span>
          <a
            href={`tel:${PORTAL_DASHBOARD_LABELS.HOTLINE_VALUE.replace(/\s+/g, '')}`}
            className="font-semibold text-primary hover:underline"
          >
            {PORTAL_DASHBOARD_LABELS.HOTLINE_VALUE}
          </a>
        </div>

        {/* Email */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted flex items-center gap-1.5">
            <Icon name="Mail" size={13} className="text-muted" />
            {PORTAL_DASHBOARD_LABELS.EMAIL_LABEL}
          </span>
          <a
            href={`mailto:${PORTAL_DASHBOARD_LABELS.EMAIL_VALUE}`}
            className="font-semibold text-primary hover:underline"
          >
            {PORTAL_DASHBOARD_LABELS.EMAIL_VALUE}
          </a>
        </div>

        {/* Hours */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted flex items-center gap-1.5">
            <Icon name="Clock" size={13} className="text-muted" />
            {PORTAL_DASHBOARD_LABELS.HOURS_LABEL}
          </span>
          <span className="font-medium text-foreground text-right text-[0.75rem]">
            {PORTAL_DASHBOARD_LABELS.HOURS_VALUE}
          </span>
        </div>
      </div>

      {/* Chat Action */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onOpenChat}
          className="w-full py-2.5 px-3 rounded-lg bg-surface-secondary hover:bg-surface-secondary/80 text-foreground text-xs font-medium transition-colors border border-border flex items-center justify-center gap-2 cursor-pointer"
        >
          <Icon name="MessageSquare" size={14} className="text-primary" />
          <span>{PORTAL_DASHBOARD_LABELS.BTN_SUPPORT_CHAT}</span>
        </button>
      </div>

      {/* Trust badge */}
      <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/10 flex items-center gap-2 text-[0.72rem] text-muted">
        <Icon name="ShieldCheck" size={16} className="text-primary shrink-0" />
        <span>Tiêu chuẩn quản lý chất lượng & bảo mật dữ liệu khách hàng</span>
      </div>
    </div>
  );
}
