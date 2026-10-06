import { usePortalOrders } from '@/application/crm/portal';
import { usePortalDebt } from '@/application/crm/portal';
import { usePortalShipments } from '@/application/crm/portal';
import { useAuth } from '@/features/auth/AuthProvider';
import { MoneyText } from '@/shared/value';
import { StatCard } from '@/shared/components';
import { PORTAL_DASHBOARD_LABELS } from '@/features/customer-portal/constants';

import { PortalWelcomeBanner } from './PortalWelcomeBanner';
import { PortalQuickActions } from './PortalQuickActions';
import { PortalRecentOrdersSection } from './PortalRecentOrdersSection';
import { PortalSupportCard } from './PortalSupportCard';

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
      <PortalWelcomeBanner fullName={profile?.full_name} />

      {/* ── 2. Stat Cards Grid ── */}
      <div className="portal-summary-grid">
        <StatCard
          label={PORTAL_DASHBOARD_LABELS.ORDERS_LABEL}
          value={orders.length}
          icon="ShoppingBag"
          tone="default"
          isLoading={ordersLoading}
          linkTo="/portal/customer/orders"
          linkLabel={PORTAL_DASHBOARD_LABELS.VIEW_ALL}
        />

        <StatCard
          label={PORTAL_DASHBOARD_LABELS.DEBT_LABEL}
          value={<MoneyText value={remainingDebt} />}
          icon="Receipt"
          tone="danger"
          isLoading={debtLoading}
          linkTo="/portal/customer/debt"
          linkLabel={PORTAL_DASHBOARD_LABELS.VIEW_DETAILS}
        />

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
      <PortalQuickActions onOpenChat={handleOpenChat} />

      {/* ── 4. Main Section (2-Column Grid) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PortalRecentOrdersSection
            orders={orders}
            ordersLoading={ordersLoading}
          />
        </div>

        <div className="lg:col-span-1">
          <PortalSupportCard onOpenChat={handleOpenChat} />
        </div>
      </div>
    </div>
  );
}
