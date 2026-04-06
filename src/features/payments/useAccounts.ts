import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchPaymentAccounts,
  createPaymentAccount,
  updatePaymentAccount,
  deletePaymentAccount,
} from '@/api/payments.api'
import type { AccountFormValues } from './payments.module'
import type { PaymentAccount } from './types'

export type { PaymentAccount }

const QUERY_KEY = ['payment-accounts'] as const

export function useAccountList(showInactive = false) {
  return useQuery<PaymentAccount[]>({
    queryKey: [...QUERY_KEY, showInactive],
    queryFn: () => fetchPaymentAccounts(showInactive),
  })
}

export function useAllAccounts() {
  return useQuery<PaymentAccount[]>({
    queryKey: [...QUERY_KEY, 'all'],
    queryFn: () => fetchPaymentAccounts(true),
  })
}

export function useCreateAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: AccountFormValues) =>
      createPaymentAccount({
        name: values.name.trim(),
        type: values.type,
        bank_name: values.bankName?.trim() || null,
        account_number: values.accountNumber?.trim() || null,
        initial_balance: values.initialBalance,
        current_balance: values.initialBalance,
        notes: values.notes?.trim() || null,
        status: values.status,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useUpdateAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: AccountFormValues }) =>
      updatePaymentAccount(id, {
        name: values.name.trim(),
        type: values.type,
        bank_name: values.bankName?.trim() || null,
        account_number: values.accountNumber?.trim() || null,
        initial_balance: values.initialBalance,
        notes: values.notes?.trim() || null,
        status: values.status,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useDeleteAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deletePaymentAccount,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}
