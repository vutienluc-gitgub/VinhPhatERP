import { Link } from 'react-router-dom';

import { usePortalOrders } from '@/application/crm/portal';
import { usePortalDebt } from '@/application/crm/portal';
import { usePortalShipments } from '@/application/crm/portal';
import { useAuth } from '@/features/auth/AuthProvider';
import { MoneyText } from '@/shared/value';
import { Icon, StatCard } from '@/shared/components';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_BADGE,
  PORTAL_DASHBOARD_LABELS,
} from '@/features/customer-portal/constants';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return PORTAL_DASHBOARD_LABELS.GREETING_MORNING;
  if (hour < 18) return PORTAL_DASHBOARD_LABELS.GREETING_AFTERNOON;
  return PORTAL_DASHBOARD_LABELS.GREETING_EVENING;
}

export function PortalDashboardPage() {
  const { profile } = useAuth();
  const { orders, loading: ordersLoading } = usePortalOrders();
  const { remainingDebt, loading: debtLoading } = usePortalDebt();
  const { shipments, loading: shipmentsLoading } = usePortalShipments();

  const latestShipment = shipments[0];

  const handleOpenChat = () => {
    const chatFab =
      document.querySelector<HTMLButtonElement>('.portal-chat-fab');
    if (chatFab) {
      chatFab.click();
    }
  };

  return (
    <div className="portal-section space-y-6">
      {/* ── 1. Welcome Hero Banner ── */}
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
                {profile?.full_name ?? 'Quý Khách Hàng'}
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

      {/* ── 2. Stat Cards Grid ── */}
      <div className="portal-summary-grid">
        {/* Đơn hàng */}
        <StatCard
          label={PORTAL_DASHBOARD_LABELS.ORDERS_LABEL}
          value={orders.length}
          icon="ShoppingBag"
          tone="default"
          isLoading={ordersLoading}
          linkTo="/portal/customer/orders"
          linkLabel={PORTAL_DASHBOARD_LABELS.VIEW_ALL}
        />

        {/* Công nợ */}
        <StatCard
          label={PORTAL_DASHBOARD_LABELS.DEBT_LABEL}
          value={<MoneyText value={remainingDebt} />}
          icon="Receipt"
          tone="danger"
          isLoading={debtLoading}
          linkTo="/portal/customer/debt"
          linkLabel={PORTAL_DASHBOARD_LABELS.VIEW_DETAILS}
        />

        {/* Giao hàng gần nhất */}
        <StatCard
          label={PORTAL_DASHBOARD_LABELS.SHIPMENT_LABEL}
          value={
            latestShipment ? (
              <span className="text-base font-semibold">
                {latestShipment.shipment_number}
              </span>
            ) : (
              PORTAL_DASHBOARD_LABELS.NO_SHIPMENT
            )
          }
          subtext={latestShipment?.shipment_date ?? undefined}
          icon="Truck"
          tone={latestShipment ? 'success' : 'default'}
          isLoading={shipmentsLoading}
          linkTo="/portal/customer/shipments"
          linkLabel={PORTAL_DASHBOARD_LABELS.VIEW_ALL}
        />
      </div>

      {/* ── 3. Quick Actions Hub (Eliminating Void) ── */}
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
            onClick={handleOpenChat}
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

      {/* ── 4. Main Section (2-Column Grid) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Orders (2/3 width) */}
        <div className="lg:col-span-2">
          {ordersLoading && (
            <div className="portal-table-wrap p-5 space-y-3">
              <div className="h-5 w-36 bg-surface-secondary rounded animate-pulse" />
              <div className="h-10 bg-surface-secondary/70 rounded-lg animate-pulse" />
              <div className="h-10 bg-surface-secondary/50 rounded-lg animate-pulse" />
              <div className="h-10 bg-surface-secondary/30 rounded-lg animate-pulse" />
            </div>
          )}

          {!ordersLoading && orders.length > 0 && (
            <div className="portal-table-wrap">
              <div className="portal-card-header">
                <span className="font-semibold text-foreground">
                  {PORTAL_DASHBOARD_LABELS.RECENT_ORDERS_TITLE}
                </span>
                <Link to="/portal/customer/orders" className="portal-stat-link">
                  {PORTAL_DASHBOARD_LABELS.VIEW_ALL}
                </Link>
              </div>

              {/* Desktop Table */}
              <div className="portal-table-desktop overflow-x-auto">
                <table className="portal-table">
                  <thead>
                    <tr>
                      <th>Số đơn</th>
                      <th>Ngày đặt</th>
                      <th className="right">Tổng tiền</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map((o) => (
                      <tr key={o.id}>
                        <td>
                          <Link
                            to={`/portal/customer/orders/${o.id}`}
                            className="portal-link font-medium"
                          >
                            {o.order_number}
                          </Link>
                        </td>
                        <td className="text-muted text-[0.82rem]">
                          {o.order_date}
                        </td>
                        <td className="right font-semibold text-foreground">
                          <MoneyText value={o.total_amount} />
                        </td>
                        <td>
                          <span
                            className={
                              ORDER_STATUS_BADGE[o.status] ?? 'portal-badge'
                            }
                          >
                            {ORDER_STATUS_LABELS[o.status] ?? o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="p-3 flex flex-col gap-3 md:hidden">
                {orders.slice(0, 5).map((o) => (
                  <div
                    key={o.id}
                    className="p-3 rounded-xl border border-border bg-surface flex flex-col gap-2 shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        to={`/portal/customer/orders/${o.id}`}
                        className="portal-link text-[0.9rem]"
                      >
                        {o.order_number}
                      </Link>
                      <span
                        className={
                          ORDER_STATUS_BADGE[o.status] ?? 'portal-badge'
                        }
                      >
                        {ORDER_STATUS_LABELS[o.status] ?? o.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted">
                      <span>{o.order_date}</span>
                      <span className="font-semibold text-foreground">
                        <MoneyText value={o.total_amount} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!ordersLoading && orders.length === 0 && (
            <div className="portal-table-wrap">
              <div className="portal-card-header">
                <span className="font-semibold text-foreground">
                  {PORTAL_DASHBOARD_LABELS.RECENT_ORDERS_TITLE}
                </span>
              </div>
              <div className="p-8 sm:p-10 text-center flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-surface-secondary text-muted flex items-center justify-center mb-3.5 ring-8 ring-surface-secondary/40">
                  <Icon name="PackageOpen" size={28} />
                </div>
                <h3 className="text-sm font-semibold text-foreground m-0">
                  {PORTAL_DASHBOARD_LABELS.EMPTY_ORDERS_TITLE}
                </h3>
                <p className="text-xs text-muted mt-1.5 mb-5 max-w-sm leading-relaxed">
                  {PORTAL_DASHBOARD_LABELS.EMPTY_ORDERS_DESC}
                </p>
                <div className="flex items-center gap-2.5 flex-wrap justify-center">
                  <Link
                    to="/portal/customer/fabric-catalog"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
                  >
                    <Icon name="Layers" size={14} />
                    <span>{PORTAL_DASHBOARD_LABELS.BTN_CATALOG}</span>
                  </Link>
                  <Link
                    to="/portal/customer/quotations"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg border border-border bg-surface hover:bg-surface-secondary text-foreground transition-all shadow-xs"
                  >
                    <Icon name="FilePlus2" size={14} />
                    <span>{PORTAL_DASHBOARD_LABELS.BTN_QUOTATION}</span>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Support Concierge Card (1/3 width) */}
        <div className="lg:col-span-1">
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
                onClick={handleOpenChat}
                className="w-full py-2.5 px-3 rounded-lg bg-surface-secondary hover:bg-surface-secondary/80 text-foreground text-xs font-medium transition-colors border border-border flex items-center justify-center gap-2 cursor-pointer"
              >
                <Icon name="MessageSquare" size={14} className="text-primary" />
                <span>{PORTAL_DASHBOARD_LABELS.BTN_SUPPORT_CHAT}</span>
              </button>
            </div>

            {/* Trust badge */}
            <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/10 flex items-center gap-2 text-[0.72rem] text-muted">
              <Icon
                name="ShieldCheck"
                size={16}
                className="text-primary shrink-0"
              />
              <span>
                Tiêu chuẩn quản lý chất lượng & bảo mật dữ liệu khách hàng
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
