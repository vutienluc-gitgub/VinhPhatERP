import { useQuery } from '@tanstack/react-query'

import {
  fetchRevenueSummary,
  fetchDebtByCustomer,
  fetchInventorySummary,
  fetchOverdueOrders,
} from '@/api/reports.api'
import type { ReportsFilter } from '@/api/reports.api'

const REPORTS_KEY = ['reports'] as const

export function useRevenueSummary(filter: ReportsFilter = {}) {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'revenue', filter],
    queryFn: () => fetchRevenueSummary(filter),
  })
}

export function useDebtByCustomer(filter: ReportsFilter = {}) {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'debt', filter],
    queryFn: () => fetchDebtByCustomer(filter),
  })
}

export function useInventorySummary() {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'inventory'],
    queryFn: fetchInventorySummary,
  })
}

export function useOverdueOrders() {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'overdue'],
    queryFn: fetchOverdueOrders,
  })
}
