import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/services/supabase/client'

import type { AccountFormValues } from './payments.module'
import type { PaymentAccount } from './types'

const TABLE = 'payment_accounts'
const QUERY_KEY = ['payment-accounts'] as const

/* ── Account list (active accounts for selects) ── */

export function useAccountList(showInactive = false) {
  return useQuery({
    queryKey: [...QUERY_KEY, showInactive],
    queryFn: async () => {
      let query = supabase
        .from(TABLE)
        .select('*')
        .order('name', { ascending: true })

      if (!showInactive) {
        query = query.eq('status', 'active')
      }

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as PaymentAccount[]
    },
  })
}

/* ── All accounts (for management page) ── */

export function useAllAccounts() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      return (data ?? []) as PaymentAccount[]
    },
  })
}

/* ── Create account ── */

export function useCreateAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: AccountFormValues) => {
      const { data, error } = await supabase
        .from(TABLE)
        .insert({
          name: values.name.trim(),
          type: values.type,
          bank_name: values.bankName?.trim() || null,
          account_number: values.accountNumber?.trim() || null,
          initial_balance: values.initialBalance,
          current_balance: values.initialBalance,
          notes: values.notes?.trim() || null,
          status: values.status,
        })
        .select()
        .single()

      if (error) throw error
      return data as PaymentAccount
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

/* ── Update account ── */

export function useUpdateAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: AccountFormValues }) => {
      const { data, error } = await supabase
        .from(TABLE)
        .update({
          name: values.name.trim(),
          type: values.type,
          bank_name: values.bankName?.trim() || null,
          account_number: values.accountNumber?.trim() || null,
          initial_balance: values.initialBalance,
          notes: values.notes?.trim() || null,
          status: values.status,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as PaymentAccount
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

/* ── Delete account ── */

export function useDeleteAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(TABLE).delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}
