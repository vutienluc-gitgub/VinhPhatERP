import { supabase } from '@/services/supabase/client';
import { formatCurrency } from '@/shared/utils/format';

export type DashboardStats = {
  draftOrders: number;
  activeOrders: number;
  overdueOrders: number;
  totalDebt: number;
  recentPayments: number;
  pendingShipments: number;
  expiringQuotations: number;
  conversionRate: number | null;
};

export type PendingTask = {
  icon: string;
  text: string;
  count: number;
  href: string;
  isAlert: boolean;
};

export type RecentOrder = {
  id: string;
  order_number: string;
  customer_name: string | null;
  total_amount: number;
  status: string;
  created_at: string;
};

export type CustomerSourceItem = {
  source: string;
  count: number;
  color: string;
};

const SOURCE_COLORS: Record<string, string> = {
  referral: '#0b6bcb',
  facebook: '#1877f2',
  website: '#0c8f68',
  hotline: '#d97706',
  other: '#6b7280',
  agent: '#9333ea',
  zalo: '#0068ff',
};

const SOURCE_LABELS: Record<string, string> = {
  referral: 'Giới thiệu',
  facebook: 'Facebook',
  website: 'Website',
  hotline: 'Hotline',
  other: 'Khác',
  agent: 'Đại lý',
  zalo: 'Zalo',
};

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [drafts, active, overdue, debt, payments, shipments, quotations] =
    await Promise.all([
      supabase
        .from('orders')
        .select('id', {
          count: 'exact',
          head: true,
        })
        .eq('status', 'draft'),
      supabase
        .from('orders')
        .select('id', {
          count: 'exact',
          head: true,
        })
        .in('status', ['confirmed', 'in_progress']),
      supabase
        .from('orders')
        .select('id', {
          count: 'exact',
          head: true,
        })
        .in('status', ['confirmed', 'in_progress'])
        .lt('delivery_date', today),
      supabase
        .from('orders')
        .select('total_amount, paid_amount')
        .in('status', ['confirmed', 'in_progress', 'completed']),
      supabase
        .from('payments')
        .select('amount')
        .gte('payment_date', sevenDaysAgo),
      supabase
        .from('shipments')
        .select('id', {
          count: 'exact',
          head: true,
        })
        .eq('status', 'preparing'),
      supabase.from('quotations').select('id, status, valid_until'),
    ]);

  const totalDebt = (debt.data ?? []).reduce(
    (sum, o) => sum + (o.total_amount - o.paid_amount),
    0,
  );
  const recentPayments = (payments.data ?? []).reduce(
    (sum, p) => sum + p.amount,
    0,
  );

  const qList = quotations.data ?? [];
  const in3Days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const expiringList = qList.filter(
    (q) =>
      q.status !== 'converted' &&
      q.status !== 'rejected' &&
      q.valid_until &&
      q.valid_until >= today &&
      q.valid_until <= in3Days,
  );

  const totalDecided = qList.filter((q) =>
    ['converted', 'rejected', 'expired'].includes(q.status),
  ).length;
  const totalConverted = qList.filter((q) => q.status === 'converted').length;
  const conversionRate =
    totalDecided > 0 ? Math.round((totalConverted / totalDecided) * 100) : null;

  return {
    draftOrders: drafts.count ?? 0,
    activeOrders: active.count ?? 0,
    overdueOrders: overdue.count ?? 0,
    totalDebt: Math.max(0, totalDebt),
    recentPayments,
    pendingShipments: shipments.count ?? 0,
    expiringQuotations: expiringList.length,
    conversionRate,
  };
}

export function buildPendingTasks(stats: DashboardStats): PendingTask[] {
  const tasks: PendingTask[] = [];

  if (stats.overdueOrders > 0) {
    tasks.push({
      icon: '⚠️',
      text: 'Đơn hàng trễ hạn',
      count: stats.overdueOrders,
      href: '/orders',
      isAlert: true,
    });
  }
  if (stats.expiringQuotations > 0) {
    tasks.push({
      icon: '📋',
      text: 'Báo giá sắp hết hạn',
      count: stats.expiringQuotations,
      href: '/quotations',
      isAlert: true,
    });
  }
  if (stats.pendingShipments > 0) {
    tasks.push({
      icon: '📦',
      text: 'Phiếu xuất chờ xử lý',
      count: stats.pendingShipments,
      href: '/shipments',
      isAlert: false,
    });
  }
  if (stats.draftOrders > 0) {
    tasks.push({
      icon: '📝',
      text: 'Đơn nháp chưa xác nhận',
      count: stats.draftOrders,
      href: '/orders',
      isAlert: false,
    });
  }
  if (stats.totalDebt > 0) {
    tasks.push({
      icon: '💰',
      text: `Công nợ còn ${formatCurrency(stats.totalDebt)} đ`,
      count: 0,
      href: '/payments',
      isAlert: stats.totalDebt > 50_000_000,
    });
  }

  return tasks;
}

export async function fetchRecentOrders(): Promise<RecentOrder[]> {
  const { data } = await supabase
    .from('orders')
    .select(
      'id, order_number, total_amount, status, created_at, customers(name)',
    )
    .order('created_at', { ascending: false })
    .limit(5);

  return (data ?? []).map((row) => {
    const customer = row.customers as { name: string } | null;
    return {
      id: row.id,
      order_number: row.order_number,
      customer_name: customer?.name ?? null,
      total_amount: row.total_amount,
      status: row.status,
      created_at: row.created_at,
    };
  });
}

export async function fetchCustomerSources(): Promise<CustomerSourceItem[]> {
  const { data } = await supabase.from('customers').select('source');
  if (!data || data.length === 0) return [];

  const counts: Record<string, number> = {};
  for (const row of data) {
    const src = row.source ?? 'other';
    counts[src] = (counts[src] ?? 0) + 1;
  }

  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .map(([source, count]) => ({
      source: SOURCE_LABELS[source] ?? source,
      count,
      color: SOURCE_COLORS[source] ?? '#6b7280',
    }));
}
