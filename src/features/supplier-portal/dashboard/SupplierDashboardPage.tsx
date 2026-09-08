import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/AuthProvider';
import { untypedDb } from '@/services/supabase/client';
import { MoneyText } from '@/shared/value';
import { StatCard } from '@/shared/components';
import { SUPPLIER_PORTAL_LABELS } from '@/features/supplier-portal/supplier-portal.constants';

import { SupplierRecentPOsCard } from './SupplierRecentPOsCard';
import { SupplierRecentRFQsCard } from './SupplierRecentRFQsCard';

const TEXT = SUPPLIER_PORTAL_LABELS;

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return TEXT.DASHBOARD_GREETING_MORNING;
  if (hour < 18) return TEXT.DASHBOARD_GREETING_AFTERNOON;
  return TEXT.DASHBOARD_GREETING_EVENING;
}

export function SupplierDashboardPage() {
  const { profile } = useAuth();
  const supplierId = profile?.supplier_id;

  // Metric 1: Unpaid Debt
  const { data: debt, isLoading: isLoadingDebt } = useQuery({
    queryKey: ['supplier-debt', supplierId],
    queryFn: async () => {
      if (!supplierId) return null;
      const { data } = await untypedDb
        .from('v_supplier_debt')
        .select('*')
        .eq('supplier_id', supplierId)
        .maybeSingle();
      return data as {
        balance_due: number;
        total_purchased: number;
        total_paid: number;
      } | null;
    },
    enabled: !!supplierId,
  });

  // Metric 2: New POs (pending, sent, approved)
  const { data: newPoCount, isLoading: isLoadingPo } = useQuery({
    queryKey: ['supplier-new-pos', supplierId],
    queryFn: async () => {
      if (!supplierId) return 0;
      const { count } = await untypedDb
        .from('purchase_orders')
        .select('*', { count: 'exact', head: true })
        .eq('supplier_id', supplierId)
        .in('status', ['pending', 'approved', 'sent']);
      return count || 0;
    },
    enabled: !!supplierId,
  });

  // Metric 3: Delivering POs
  const { data: deliveringPoCount, isLoading: isLoadingDelivering } = useQuery({
    queryKey: ['supplier-delivering-pos', supplierId],
    queryFn: async () => {
      if (!supplierId) return 0;
      const { count } = await untypedDb
        .from('purchase_orders')
        .select('*', { count: 'exact', head: true })
        .eq('supplier_id', supplierId)
        .eq('status', 'confirmed');
      return count || 0;
    },
    enabled: !!supplierId,
  });

  // Metric 4: New RFQs
  const { data: newRfqCount, isLoading: isLoadingRfq } = useQuery({
    queryKey: ['supplier-new-rfqs'],
    queryFn: async () => {
      const { count } = await untypedDb
        .from('sourcing_rfqs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published');
      return count || 0;
    },
    enabled: !!supplierId,
  });

  // Lists: Recent POs
  const { data: recentPos } = useQuery({
    queryKey: ['supplier-recent-pos', supplierId],
    queryFn: async () => {
      if (!supplierId) return [];
      const { data } = await untypedDb
        .from('purchase_orders')
        .select('id, po_code, status, order_date, total_amount')
        .eq('supplier_id', supplierId)
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!supplierId,
  });

  // Lists: Recent RFQs
  const { data: recentRfqs } = useQuery({
    queryKey: ['supplier-recent-rfqs'],
    queryFn: async () => {
      const { data } = await untypedDb
        .from('sourcing_rfqs')
        .select('id, rfq_code, title, status, deadline_date')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!supplierId,
  });

  const getPoStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
      case 'sent':
        return (
          <span className="portal-badge portal-badge--in-progress">
            {TEXT.DASHBOARD_STATUS_NEW}
          </span>
        );
      case 'approved':
      case 'confirmed':
        return (
          <span className="portal-badge portal-badge--confirmed">
            {TEXT.DASHBOARD_STATUS_PROCESSING}
          </span>
        );
      case 'completed':
        return (
          <span className="portal-badge portal-badge--completed">
            {TEXT.DASHBOARD_STATUS_COMPLETED}
          </span>
        );
      default:
        return <span className="portal-badge">{status}</span>;
    }
  };

  return (
    <div className="portal-section">
      {/* ── Welcome Banner ── */}
      <div className="bg-gradient-to-br from-primary-strong to-primary rounded-[14px] px-6 py-5 text-inverse-foreground flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="m-0 text-[0.78rem] text-inverse-foreground/55 uppercase tracking-[0.06em] font-semibold">
            {getGreeting()}
          </p>
          <p className="mt-1 mb-0 text-[1.15rem] font-bold tracking-[-0.01em]">
            {profile?.full_name ?? 'Nhà cung cấp'}
          </p>
        </div>
        <div className="text-[0.78rem] text-inverse-foreground/50 text-right">
          <p className="m-0">{TEXT.DASHBOARD_PORTAL_LABEL}</p>
          <p className="mt-1 mb-0 text-inverse-foreground/30">
            {TEXT.DASHBOARD_BRAND}
          </p>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div
        className="portal-summary-grid"
        style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}
      >
        <StatCard
          label={TEXT.DASHBOARD_NEW_PO}
          value={newPoCount ?? 0}
          subtext={TEXT.DASHBOARD_NEW_PO_SUB}
          icon="ShoppingBag"
          tone="default"
          isLoading={isLoadingPo}
          linkTo="/portal/supplier/orders"
          linkLabel={TEXT.DASHBOARD_VIEW_ALL}
        />
        <StatCard
          label={TEXT.DASHBOARD_NEW_RFQ}
          value={newRfqCount ?? 0}
          subtext={TEXT.DASHBOARD_NEW_RFQ_SUB}
          icon="FileText"
          tone="warning"
          isLoading={isLoadingRfq}
          linkTo="/portal/supplier/quotations"
          linkLabel={TEXT.DASHBOARD_VIEW_ALL}
        />
        <StatCard
          label={TEXT.DASHBOARD_DELIVERING}
          value={deliveringPoCount ?? 0}
          subtext={TEXT.DASHBOARD_DELIVERING_SUB}
          icon="Truck"
          tone="success"
          isLoading={isLoadingDelivering}
        />
        <StatCard
          label={TEXT.DASHBOARD_UNPAID}
          value={<MoneyText value={debt?.balance_due ?? 0} />}
          subtext={TEXT.DASHBOARD_UNPAID_SUB}
          icon="Receipt"
          tone="danger"
          isLoading={isLoadingDebt}
          linkTo="/portal/supplier/debt"
          linkLabel={TEXT.DASHBOARD_VIEW_DETAIL}
        />
      </div>

      {/* ── Recent Lists (2-column layout) ── */}
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}
      >
        <SupplierRecentPOsCard
          recentPos={recentPos}
          getPoStatusBadge={getPoStatusBadge}
        />
        <SupplierRecentRFQsCard recentRfqs={recentRfqs} />
      </div>
    </div>
  );
}
