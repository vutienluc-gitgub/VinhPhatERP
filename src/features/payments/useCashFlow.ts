import { useQuery } from '@tanstack/react-query'
import {
  fetchCashFlowSummary,
  fetchExpenseByCategory,
  fetchSupplierDebt,
} from '@/api/payments.api'
import type { CashFlowRow, ExpenseByCategoryRow, SupplierDebtRow } from './types'

export type { CashFlowRow, ExpenseByCategoryRow, SupplierDebtRow }

export function useCashFlowSummary(fromDate: string, toDate: string) {
  return useQuery<CashFlowRow[]>({
    queryKey: ['cash-flow', fromDate, toDate],
    queryFn: () => fetchCashFlowSummary(fromDate, toDate),
  })
}

export function useExpenseByCategory(fromDate: string, toDate: string) {
  return useQuery<ExpenseByCategoryRow[]>({
    queryKey: ['expense-by-category', fromDate, toDate],
    queryFn: () => fetchExpenseByCategory(fromDate, toDate),
  })
}

export function useSupplierDebt() {
  return useQuery<SupplierDebtRow[]>({
    queryKey: ['supplier-debt'],
    queryFn: fetchSupplierDebt,
  })
}
