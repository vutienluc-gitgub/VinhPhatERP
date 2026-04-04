/**
 * useCreateOrderV2
 * ==================
 * Hook tạo đơn hàng qua ERP-grade Supabase Edge Function.
 * Thay thế hook cũ useCreateOrder (direct Supabase insert) bằng cách:
 *   - Gọi Edge Function create-order thay vì direct DB insert
 *   - Xử lý các error codes đặc biệt: CREDIT_BLOCKED, CREDIT_OVERDUE,
 *     CREDIT_LIMIT_EXCEEDED, INSUFFICIENT_STOCK
 *   - Hỗ trợ managerOverride flow (2-step confirmation)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/services/supabase/client'
import type { OrdersFormValues } from './orders.module'

// ---------------------------------------------------------------------------
// Error types từ Edge Function
// ---------------------------------------------------------------------------

export type CreateOrderErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'CREDIT_BLOCKED'
  | 'CREDIT_OVERDUE'
  | 'CREDIT_LIMIT_EXCEEDED'
  | 'INSUFFICIENT_STOCK'
  | 'CONCURRENT_RESERVATION'
  | 'TRANSACTION_FAILED'
  | 'INTERNAL_ERROR'

export interface CreateOrderError {
  code:    CreateOrderErrorCode
  message: string
  detail?: {
    overdueDebt?:     number
    creditLimit?:     number
    currentDebt?:     number
    orderTotal?:      number
    projectedDebt?:   number
    requireOverride?: boolean
    stockErrors?: Array<{
      itemIndex:  number
      fabricType: string
      requested:  number
      available:  number
    }>
  }
}

export interface CreateOrderResult {
  ok:          boolean
  orderId:     string
  orderNumber: string
  totalAmount: number
  allocation:  Array<{ rollId: string; rollNumber: string; meters: number }>
  creditInfo: {
    previousDebt:  number
    newDebt:       number
    creditLimit:   number
    managerOverride: boolean
  }
  message: string
}

// ---------------------------------------------------------------------------
// Mutation input
// ---------------------------------------------------------------------------

export interface CreateOrderInput extends OrdersFormValues {
  /** Set true khi Manager đã xác nhận override credit warning */
  managerOverride?: boolean
}

// ---------------------------------------------------------------------------
// Edge Function caller
// ---------------------------------------------------------------------------

async function callCreateOrderFunction(
  input: CreateOrderInput,
  accessToken: string,
): Promise<CreateOrderResult> {
  const { data: sessionData } = await supabase.auth.getSession()
  const token = accessToken || sessionData?.session?.access_token

  const payload = {
    orderNumber:       input.orderNumber.trim(),
    customerId:        input.customerId,
    orderDate:         input.orderDate,
    deliveryDate:      input.deliveryDate?.trim() || undefined,
    notes:             input.notes?.trim()         || undefined,
    sourceQuotationId: (input as CreateOrderInput & { sourceQuotationId?: string }).sourceQuotationId,
    managerOverride:   input.managerOverride ?? false,
    items: input.items.map(item => ({
      fabricType: item.fabricType.trim(),
      colorName:  item.colorName?.trim()  || undefined,
      colorCode:  item.colorCode?.trim()  || undefined,
      unit:       item.unit ?? 'm',
      quantity:   item.quantity,
      unitPrice:  item.unitPrice,
    })),
  }

  const { data, error } = await supabase.functions.invoke<CreateOrderResult>('create-order', {
    body: payload,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })

  if (error) {
    // Supabase functions.invoke wraps HTTP errors
    // Parse error body nếu có
    const body = (error as unknown as { context?: { body?: string } }).context?.body
    if (body) {
      try {
        const parsed = JSON.parse(body) as { error: CreateOrderError }
        throw parsed.error
      } catch {
        // fallthrough
      }
    }
    throw { code: 'INTERNAL_ERROR', message: error.message } as CreateOrderError
  }

  if (!data?.ok) {
    throw { code: 'INTERNAL_ERROR', message: 'Không nhận được phản hồi từ server' } as CreateOrderError
  }

  return data
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

const QUERY_KEY = ['orders'] as const

/**
 * useCreateOrderV2
 *
 * Usage:
 * ```tsx
 * const { mutateAsync, isPending } = useCreateOrderV2()
 *
 * // Normal create:
 * await mutateAsync(formValues)
 *
 * // With manager override (sau khi user đã confirm dialog):
 * await mutateAsync({ ...formValues, managerOverride: true })
 * ```
 *
 * Error handling:
 * ```tsx
 * try {
 *   const result = await mutateAsync(formValues)
 *   navigate(`/orders/${result.orderId}`)
 * } catch (err) {
 *   const e = err as CreateOrderError
 *   if (e.code === 'CREDIT_OVERDUE' || e.code === 'CREDIT_LIMIT_EXCEEDED') {
 *     // Hiện confirmation dialog cho Manager
 *     setOverrideWarning({ code: e.code, detail: e.detail, message: e.message })
 *   } else {
 *     toast.error(e.message)
 *   }
 * }
 * ```
 */
export function useCreateOrderV2() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateOrderInput): Promise<CreateOrderResult> => {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token ?? ''
      return callCreateOrderFunction(input, token)
    },

    onSuccess: (result) => {
      // Invalidate order list
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })

      // Invalidate inventory views
      void queryClient.invalidateQueries({ queryKey: ['finished-fabric'] })
      void queryClient.invalidateQueries({ queryKey: ['reserve-rolls'] })

      // Invalidate customer (current_debt đã thay đổi)
      void queryClient.invalidateQueries({ queryKey: ['customers'] })

      console.info(
        `[createOrder] ✅ ${result.orderNumber} created. ` +
        `Allocated ${result.allocation.length} rolls. ` +
        `New debt: ${result.creditInfo.newDebt}`,
      )
    },

    onError: (err: CreateOrderError) => {
      console.error('[createOrder] ❌ Error:', err.code, err.message)
    },
  })
}

// ---------------------------------------------------------------------------
// Helper: Phân loại error để UI biết cách hiện dialog
// ---------------------------------------------------------------------------

export function isCreditWarning(code: CreateOrderErrorCode): boolean {
  return code === 'CREDIT_OVERDUE' || code === 'CREDIT_LIMIT_EXCEEDED'
}

export function isCreditBlocked(code: CreateOrderErrorCode): boolean {
  return code === 'CREDIT_BLOCKED'
}

export function isStockError(code: CreateOrderErrorCode): boolean {
  return code === 'INSUFFICIENT_STOCK'
}
