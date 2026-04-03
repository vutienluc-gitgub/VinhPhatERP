import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/services/supabase/client'

import type { CashFlowRow, ExpenseByCategoryRow, SupplierDebtRow } from './types'

/* ── Cash flow summary (daily breakdown) ── */

export function useCashFlowSummary(fromDate: string, toDate: string) {
  return useQuery({
    queryKey: ['cash-flow', fromDate, toDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_cash_flow_summary', {
        p_from: fromDate,
        p_to: toDate,
      })

      if (error) throw error
      return (data ?? []) as CashFlowRow[]
    },
  })
}

/* ── Expense breakdown by category ── */

export function useExpenseByCategory(fromDate: string, toDate: string) {
  return useQuery({
    queryKey: ['expense-by-category', fromDate, toDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_expense_by_category', {
        p_from: fromDate,
        p_to: toDate,
      })

      if (error) throw error
      return (data ?? []) as ExpenseByCategoryRow[]
    },
  })
}

/* ── Supplier debt summary ── */

export function useSupplierDebt() {
  return useQuery({
    queryKey: ['supplier-debt'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_supplier_debt')
        .select('*')

      if (error) throw error
      return (data ?? []) as SupplierDebtRow[]
    },
  })
}
