import { supabase } from '@/services/supabase/client';
import { CUSTOMER_SOURCE_LABELS } from '@/schema/customer.schema';
import { formatCurrency } from '@/shared/utils/format';
import { PENDING_TASKS_LABELS } from '@/features/dashboard/dashboard.constants';

/* ============================================================
   Dashboard v3 — Executive Overview Types
   ============================================================ */

export type MonthlyDataPoint = {
  month: string;
  label: string;
  value: number;
};

export type SpendingBreakdown = {
  label: string;
  value: number;
  color: string;
};

export type UpcomingDebt = {
  id: string;
  name: string;
  type: 'supplier' | 'customer';
  amount: number;
  due_date: string;
};

export type RecentTransaction = {
  id: string;
  description: string;
  date: string;
  amount: number;
  type: 'income' | 'expense';
  status: 'success' | 'pending' | 'failed';
};

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
  referral: '#16a34a',
  exhibition: '#d97706',
  zalo: '#0068ff',
  facebook: '#1877f2',
  online: '#0891b2',
  direct: '#6b7280',
  cold_call: '#f59e0b',
  other: '#94a3b8',
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * ONE_DAY_MS;
const THREE_DAYS_MS = 3 * ONE_DAY_MS;

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS)
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
  const in3Days = new Date(Date.now() + THREE_DAYS_MS)
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
      icon: 'TriangleAlert',
      text: PENDING_TASKS_LABELS.OVERDUE,
      count: stats.overdueOrders,
      href: '/orders',
      isAlert: true,
    });
  }
  if (stats.expiringQuotations > 0) {
    tasks.push({
      icon: 'ClipboardList',
      text: PENDING_TASKS_LABELS.EXPIRING_QUOTATIONS,
      count: stats.expiringQuotations,
      href: '/quotations',
      isAlert: true,
    });
  }
  if (stats.pendingShipments > 0) {
    tasks.push({
      icon: 'PackageCheck',
      text: PENDING_TASKS_LABELS.PENDING_SHIPMENTS,
      count: stats.pendingShipments,
      href: '/shipments',
      isAlert: false,
    });
  }
  if (stats.draftOrders > 0) {
    tasks.push({
      icon: 'FilePenLine',
      text: PENDING_TASKS_LABELS.DRAFT_ORDERS,
      count: stats.draftOrders,
      href: '/orders',
      isAlert: false,
    });
  }
  if (stats.totalDebt > 0) {
    tasks.push({
      icon: 'Wallet',
      text: `${PENDING_TASKS_LABELS.DEBT_PREFIX} ${formatCurrency(stats.totalDebt)} ${PENDING_TASKS_LABELS.DEBT_SUFFIX}`,
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
      source:
        CUSTOMER_SOURCE_LABELS[source as keyof typeof CUSTOMER_SOURCE_LABELS] ??
        source,
      count,
      color: SOURCE_COLORS[source] ?? '#6b7280',
    }));
}

/* ============================================================
   Dashboard v3 — New Data Fetchers
   ============================================================ */

const MONTH_LABELS = [
  'Th1',
  'Th2',
  'Th3',
  'Th4',
  'Th5',
  'Th6',
  'Th7',
  'Th8',
  'Th9',
  'Th10',
  'Th11',
  'Th12',
];

/**
 * Fetch monthly revenue from confirmed/completed orders for the current year.
 * Maps to "Doanh thu bán hàng" chart.
 */
export async function fetchMonthlyRevenue(): Promise<{
  data: MonthlyDataPoint[];
  total: number;
  changePercent: number | null;
}> {
  const now = new Date();
  const year = now.getFullYear();
  const startOfYear = `${year}-01-01`;
  const endOfYear = `${year}-12-31`;
  const currentMonth = now.getMonth();

  const { data } = await supabase
    .from('orders')
    .select('total_amount, created_at')
    .in('status', ['confirmed', 'in_progress', 'completed'])
    .gte('created_at', startOfYear)
    .lte('created_at', endOfYear);

  const monthlyTotals = new Array<number>(12).fill(0);
  for (const row of data ?? []) {
    const month = new Date(row.created_at).getMonth();
    const current = monthlyTotals[month];
    if (current !== undefined) {
      monthlyTotals[month] = current + row.total_amount;
    }
  }

  const points: MonthlyDataPoint[] = monthlyTotals.map((val, i) => ({
    month: `${year}-${String(i + 1).padStart(2, '0')}`,
    label: MONTH_LABELS[i] ?? '',
    value: val,
  }));

  const totalCurrent = monthlyTotals[currentMonth] ?? 0;
  const totalPrev =
    currentMonth > 0 ? (monthlyTotals[currentMonth - 1] ?? 0) : 0;
  const changePercent =
    totalPrev > 0
      ? Math.round(((totalCurrent - totalPrev) / totalPrev) * 100 * 10) / 10
      : null;

  const yearTotal = monthlyTotals.reduce((s, v) => s + v, 0);

  return { data: points, total: yearTotal, changePercent };
}

/**
 * Fetch yarn purchase spending breakdown for the current month.
 * Maps to "Chi phí nhập sợi" card.
 */
export async function fetchYarnSpending(): Promise<{
  total: number;
  changePercent: number | null;
  breakdown: SpendingBreakdown[];
}> {
  const now = new Date();
  const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
  const prevYear =
    now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const startOfPrevMonth = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;

  const [currentData, prevData] = await Promise.all([
    supabase
      .from('yarn_receipts')
      .select('total_amount, supplier_id, suppliers(name)')
      .gte('receipt_date', startOfMonth),
    supabase
      .from('yarn_receipts')
      .select('total_amount')
      .gte('receipt_date', startOfPrevMonth)
      .lt('receipt_date', startOfMonth),
  ]);

  const total = (currentData.data ?? []).reduce(
    (sum, r) => sum + (r.total_amount ?? 0),
    0,
  );
  const prevTotal = (prevData.data ?? []).reduce(
    (sum, r) => sum + (r.total_amount ?? 0),
    0,
  );
  const changePercent =
    prevTotal > 0
      ? Math.round(((total - prevTotal) / prevTotal) * 100 * 10) / 10
      : null;

  const bySupplier: Record<string, number> = {};
  for (const row of currentData.data ?? []) {
    const supplier = row.suppliers as { name: string } | null;
    const name = supplier?.name ?? 'Khác';
    bySupplier[name] = (bySupplier[name] ?? 0) + (row.total_amount ?? 0);
  }

  const { BREAKDOWN_COLORS } =
    await import('@/features/dashboard/dashboard.constants');
  const breakdown: SpendingBreakdown[] = Object.entries(bySupplier)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([label, value], i) => ({
      label,
      value,
      color: BREAKDOWN_COLORS[i % BREAKDOWN_COLORS.length] ?? '#94A3B8',
    }));

  return { total, changePercent, breakdown };
}

/**
 * Fetch upcoming supplier/customer debts sorted by due date.
 * Maps to "Công nợ sắp đến hạn" card.
 */
export async function fetchUpcomingDebts(): Promise<UpcomingDebt[]> {
  const { data: supplierDebts } = await supabase
    .from('yarn_receipts')
    .select('id, total_amount, paid_amount, receipt_date, suppliers(name)')
    .gt('total_amount', 0)
    .order('receipt_date', { ascending: true })
    .limit(20);

  const debts: UpcomingDebt[] = [];

  for (const row of supplierDebts ?? []) {
    const remaining = (row.total_amount ?? 0) - (row.paid_amount ?? 0);
    if (remaining <= 0) continue;
    const supplier = row.suppliers as { name: string } | null;
    debts.push({
      id: row.id,
      name: supplier?.name ?? 'NCC',
      type: 'supplier',
      amount: remaining,
      due_date: row.receipt_date,
    });
  }

  const { data: customerDebts } = await supabase
    .from('orders')
    .select('id, total_amount, paid_amount, delivery_date, customers(name)')
    .in('status', ['confirmed', 'in_progress', 'completed'])
    .order('delivery_date', { ascending: true })
    .limit(20);

  for (const row of customerDebts ?? []) {
    const remaining = (row.total_amount ?? 0) - (row.paid_amount ?? 0);
    if (remaining <= 0) continue;
    const customer = row.customers as { name: string } | null;
    debts.push({
      id: row.id,
      name: customer?.name ?? 'KH',
      type: 'customer',
      amount: remaining,
      due_date: row.delivery_date ?? '',
    });
  }

  return debts.sort((a, b) => a.due_date.localeCompare(b.due_date)).slice(0, 6);
}

/**
 * Fetch recent transactions combining payments.
 * Maps to "Giao dịch gần đây" card.
 */
export async function fetchRecentTransactions(): Promise<RecentTransaction[]> {
  const { data: payments } = await supabase
    .from('payments')
    .select('id, amount, payment_date, notes')
    .order('payment_date', { ascending: false })
    .limit(5);

  return (payments ?? []).map((p) => ({
    id: p.id,
    description: p.notes ?? 'Thanh toán',
    date: p.payment_date,
    amount: p.amount,
    type: 'income' as const,
    status: 'success' as RecentTransaction['status'],
  }));
}
