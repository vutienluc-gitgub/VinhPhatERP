import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';

import { useAuth } from '@/features/auth/AuthProvider';
import { untypedDb } from '@/services/supabase/client';
import { MoneyText } from '@/shared/value';
import { Icon, StatCard } from '@/shared/components';
import { SUPPLIER_PORTAL_LABELS } from '@/features/supplier-portal/supplier-portal.constants';

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
      {/* ── Welcome Banner (Premium gradient - same as Customer Portal) ── */}
      <div className="bg-gradient-to-br from-[#0f1f3d] to-[#1a3a6e] rounded-[14px] px-6 py-5 text-inverse-foreground flex items-center justify-between gap-4 flex-wrap">
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

      {/* ── Stat Cards (4-column grid with StatCard component) ── */}
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
        {/* Recent POs */}
        <div className="portal-card">
          <div className="portal-card-header">
            <span>{TEXT.DASHBOARD_RECENT_PO}</span>
            <Link to="/portal/supplier/orders" className="portal-stat-link">
              {TEXT.DASHBOARD_VIEW_ALL} &rarr;
            </Link>
          </div>
          <div className="portal-card-body" style={{ padding: 0 }}>
            {recentPos?.length === 0 ? (
              <div className="portal-empty">
                <div className="portal-empty-icon">
                  <Icon name="Inbox" size={40} />
                </div>
                <p style={{ margin: '0 0 0.25rem', fontWeight: 600 }}>
                  {TEXT.DASHBOARD_RECENT_PO_EMPTY}
                </p>
                <p style={{ margin: 0, fontSize: '0.78rem' }}>
                  {TEXT.DASHBOARD_RECENT_PO_EMPTY_DESC}
                </p>
              </div>
            ) : (
              recentPos?.map(
                (po: {
                  id: string;
                  po_code: string;
                  order_date: string;
                  total_amount: number;
                  status: string;
                }) => (
                  <div
                    key={po.id}
                    className="flex items-center justify-between gap-2 px-5 py-3 border-b border-dashed border-border last:border-none"
                  >
                    <div className="flex flex-col items-start gap-0.5 min-w-0">
                      <span className="font-semibold text-sm text-foreground">
                        {po.po_code}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {dayjs(po.order_date).format('DD/MM/YYYY')} —{' '}
                        <MoneyText value={po.total_amount ?? 0} />
                      </span>
                    </div>
                    {getPoStatusBadge(po.status)}
                  </div>
                ),
              )
            )}
          </div>
        </div>

        {/* Recent RFQs */}
        <div className="portal-card">
          <div className="portal-card-header">
            <span>{TEXT.DASHBOARD_RECENT_RFQ}</span>
            <Link to="/portal/supplier/quotations" className="portal-stat-link">
              {TEXT.DASHBOARD_VIEW_ALL} &rarr;
            </Link>
          </div>
          <div className="portal-card-body" style={{ padding: 0 }}>
            {recentRfqs?.length === 0 ? (
              <div className="portal-empty">
                <div className="portal-empty-icon">
                  <Icon name="FileSearch" size={40} />
                </div>
                <p style={{ margin: '0 0 0.25rem', fontWeight: 600 }}>
                  {TEXT.DASHBOARD_RECENT_RFQ_EMPTY}
                </p>
                <p style={{ margin: 0, fontSize: '0.78rem' }}>
                  {TEXT.DASHBOARD_RECENT_RFQ_EMPTY_DESC}
                </p>
              </div>
            ) : (
              recentRfqs?.map(
                (rfq: {
                  id: string;
                  rfq_code: string;
                  title: string;
                  deadline_date: string;
                }) => (
                  <Link
                    key={rfq.id}
                    to={`/portal/supplier/quotations/${rfq.id}`}
                    className="flex items-center justify-between gap-2 px-5 py-3 border-b border-dashed border-border last:border-none no-underline text-foreground hover:bg-surface-subtle transition-colors"
                  >
                    <div className="flex flex-col items-start gap-0.5 min-w-0">
                      <span className="font-semibold text-sm text-foreground">
                        {rfq.rfq_code}
                      </span>
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {rfq.title}
                      </span>
                    </div>
                    <span className="portal-badge portal-badge--info">
                      {TEXT.DASHBOARD_STATUS_NEW}
                    </span>
                  </Link>
                ),
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
