import { useQuery } from '@tanstack/react-query'
import {
  fetchDashboardStats,
  buildPendingTasks,
  fetchRecentOrders,
  fetchCustomerSources,
} from '@/api/dashboard.api'
import type { DashboardStats, PendingTask, RecentOrder, CustomerSourceItem } from '@/api/dashboard.api'

export type { DashboardStats, PendingTask, RecentOrder, CustomerSourceItem }

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
    refetchInterval: 60_000,
  })
}

export function usePendingTasks(stats: DashboardStats | undefined): PendingTask[] {
  if (!stats) return []
  return buildPendingTasks(stats)
}

export function useRecentOrders() {
  return useQuery<RecentOrder[]>({
    queryKey: ['dashboard-recent-orders'],
    queryFn: fetchRecentOrders,
    refetchInterval: 60_000,
  })
}

export function useCustomerSources() {
  return useQuery<CustomerSourceItem[]>({
    queryKey: ['dashboard-customer-sources'],
    queryFn: fetchCustomerSources,
    staleTime: 5 * 60_000,
  })
}
