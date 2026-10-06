import { Link } from 'react-router-dom';

import { Icon } from '@/shared/components';
import { PORTAL_DASHBOARD_LABELS } from '@/features/customer-portal/constants';

interface PortalWelcomeBannerProps {
  fullName?: string | null;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return PORTAL_DASHBOARD_LABELS.GREETING_MORNING;
  if (hour < 18) return PORTAL_DASHBOARD_LABELS.GREETING_AFTERNOON;
  return PORTAL_DASHBOARD_LABELS.GREETING_EVENING;
}

export function PortalWelcomeBanner({ fullName }: PortalWelcomeBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f1f3d] via-[#152a52] to-[#1a3a6e] p-6 text-inverse-foreground shadow-md border border-primary/20">
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Identity & Greeting */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-inverse-foreground/10 border border-inverse-foreground/20 flex items-center justify-center font-bold text-inverse-foreground shadow-inner shrink-0 mt-0.5">
            <Icon
              name="Building2"
              size={24}
              className="text-inverse-foreground"
            />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs uppercase tracking-wider text-inverse-foreground/70 font-medium">
                {getGreeting()}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[0.7rem] font-medium bg-success/20 text-success border border-success/30">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                {PORTAL_DASHBOARD_LABELS.PARTNER_BADGE}
              </span>
            </div>
            <h1 className="mt-1 mb-0 text-xl md:text-2xl font-bold tracking-tight text-inverse-foreground">
              {fullName ?? 'Quý Khách Hàng'}
            </h1>
            <p className="mt-1 mb-0 text-xs text-inverse-foreground/60 font-normal">
              {PORTAL_DASHBOARD_LABELS.PORTAL_SUB}
            </p>
          </div>
        </div>

        {/* Quick Hero Actions */}
        <div className="flex items-center gap-2.5 flex-wrap self-start md:self-center shrink-0">
          <Link
            to="/portal/customer/fabric-catalog"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-inverse-foreground/10 hover:bg-inverse-foreground/20 text-inverse-foreground font-medium text-xs transition-all border border-inverse-foreground/20 shadow-xs"
          >
            <Icon name="Layers" size={14} />
            <span>{PORTAL_DASHBOARD_LABELS.BTN_CATALOG}</span>
          </Link>
          <Link
            to="/portal/customer/quotations"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs transition-all shadow-sm"
          >
            <Icon name="FilePlus2" size={14} />
            <span>{PORTAL_DASHBOARD_LABELS.BTN_QUOTATION}</span>
          </Link>
        </div>
      </div>

      {/* Ambient subtle glow */}
      <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
}
