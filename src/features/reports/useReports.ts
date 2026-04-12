import { useQuery } from '@tanstack/react-query';

import {
  fetchRevenueSummary,
  fetchDebtByCustomer,
  fetchInventorySummary,
  fetchOverdueOrders,
  fetchProductionEfficiency,
  fetchRevenueByFabric,
  fetchMonthlyRevenue,
  fetchOnTimeDelivery,
  fetchPaymentCollection,
  fetchInventoryDemand,
} from '@/api/reports.api';
import type { ReportsFilter } from '@/api/reports.api';

const REPORTS_KEY = ['reports'] as const;

export function useRevenueSummary(filter: ReportsFilter = {}) {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'revenue', filter],
    queryFn: () => fetchRevenueSummary(filter),
  });
}

export function useDebtByCustomer(filter: ReportsFilter = {}) {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'debt', filter],
    queryFn: () => fetchDebtByCustomer(filter),
  });
}

export function useInventorySummary() {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'inventory'],
    queryFn: fetchInventorySummary,
  });
}

export function useOverdueOrders() {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'overdue'],
    queryFn: fetchOverdueOrders,
  });
}

// --- Deep analytics hooks ---

export function useProductionEfficiency() {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'production'],
    queryFn: fetchProductionEfficiency,
  });
}

export function useRevenueByFabric() {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'revenue-by-fabric'],
    queryFn: fetchRevenueByFabric,
  });
}

export function useMonthlyRevenue() {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'monthly-revenue'],
    queryFn: fetchMonthlyRevenue,
  });
}

export function useOnTimeDelivery() {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'on-time'],
    queryFn: fetchOnTimeDelivery,
  });
}

export function usePaymentCollection() {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'payment-collection'],
    queryFn: fetchPaymentCollection,
  });
}

export function useInventoryDemand() {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'inventory-demand'],
    queryFn: fetchInventoryDemand,
  });
}
