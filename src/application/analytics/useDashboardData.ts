import { useQuery } from '@tanstack/react-query';

import {
  fetchDashboardStats,
  buildPendingTasks,
  fetchRecentOrders,
  fetchCustomerSources,
  fetchMonthlyRevenue,
  fetchYarnSpending,
  fetchUpcomingDebts,
  fetchRecentTransactions,
} from '@/api/dashboard.api';
import type {
  DashboardStats,
  PendingTask,
  RecentOrder,
  CustomerSourceItem,
  MonthlyDataPoint,
  SpendingBreakdown,
  UpcomingDebt,
  RecentTransaction,
} from '@/api/dashboard.api';

export type {
  DashboardStats,
  PendingTask,
  RecentOrder,
  CustomerSourceItem,
  MonthlyDataPoint,
  SpendingBreakdown,
  UpcomingDebt,
  RecentTransaction,
};

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
    refetchInterval: 60_000,
  });
}

export function usePendingTasks(
  stats: DashboardStats | undefined,
): PendingTask[] {
  if (!stats) return [];
  return buildPendingTasks(stats);
}

export function useRecentOrders() {
  return useQuery<RecentOrder[]>({
    queryKey: ['dashboard-recent-orders'],
    queryFn: fetchRecentOrders,
    refetchInterval: 60_000,
  });
}

export function useCustomerSources() {
  return useQuery<CustomerSourceItem[]>({
    queryKey: ['dashboard-customer-sources'],
    queryFn: fetchCustomerSources,
    staleTime: 5 * 60_000,
  });
}

/* ── Dashboard v3 hooks ── */

export function useDashboardRevenue() {
  return useQuery({
    queryKey: ['dashboard-monthly-revenue'],
    queryFn: fetchMonthlyRevenue,
    staleTime: 5 * 60_000,
  });
}

export function useYarnSpending() {
  return useQuery({
    queryKey: ['dashboard-yarn-spending'],
    queryFn: fetchYarnSpending,
    staleTime: 5 * 60_000,
  });
}

export function useUpcomingDebts() {
  return useQuery<UpcomingDebt[]>({
    queryKey: ['dashboard-upcoming-debts'],
    queryFn: fetchUpcomingDebts,
    staleTime: 5 * 60_000,
  });
}

export function useRecentTransactions() {
  return useQuery<RecentTransaction[]>({
    queryKey: ['dashboard-recent-transactions'],
    queryFn: fetchRecentTransactions,
    refetchInterval: 60_000,
  });
}
