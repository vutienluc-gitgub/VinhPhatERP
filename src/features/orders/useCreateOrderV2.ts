/**
 * useCreateOrderV2
 * ==================
 * Hook tạo đơn hàng qua Supabase Edge Function.
 * Nếu Edge Function không kết nối được → tự động fallback sang direct DB insert.
 *
 * Flow:
 *   1. Gọi Edge Function create-order
 *   2. Nếu lỗi kết nối (Failed to send a request) → fallback direct insert
 *   3. Xử lý các error codes: CREDIT_BLOCKED, CREDIT_OVERDUE, CREDIT_LIMIT_EXCEEDED
 *   4. Hỗ trợ managerOverride flow (2-step confirmation)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  createOrder,
  getAccessToken,
  invokeCreateOrderFunction,
} from '@/api/orders.api';

import type { OrdersFormValues } from './orders.module';

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
  | 'INTERNAL_ERROR';

export interface CreateOrderError {
  code: CreateOrderErrorCode;
  message: string;
  detail?: {
    overdueDebt?: number;
    creditLimit?: number;
    currentDebt?: number;
    orderTotal?: number;
    projectedDebt?: number;
    requireOverride?: boolean;
    stockErrors?: Array<{
      itemIndex: number;
      fabricType: string;
      requested: number;
      available: number;
    }>;
  };
}

export interface CreateOrderResult {
  ok: boolean;
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  allocation: Array<{ rollId: string; rollNumber: string; meters: number }>;
  creditInfo: {
    previousDebt: number;
    newDebt: number;
    creditLimit: number;
    managerOverride: boolean;
  };
  message: string;
}

// ---------------------------------------------------------------------------
// Mutation input
// ---------------------------------------------------------------------------

export interface CreateOrderInput extends OrdersFormValues {
  /** Set true khi Manager đã xác nhận override credit warning */
  managerOverride?: boolean;
}

// ---------------------------------------------------------------------------
// Kiểm tra lỗi kết nối Edge Function
// ---------------------------------------------------------------------------

function isConnectionError(error: unknown): boolean {
  if (!error) return false;
  const msg = String(
    (error as { message?: string }).message ?? error,
  ).toLowerCase();
  return (
    msg.includes('failed to send a request') ||
    msg.includes('edge function') ||
    msg.includes('fetch') ||
    msg.includes('network') ||
    msg.includes('econnrefused') ||
    msg.includes('timeout') ||
    msg.includes('aborted')
  );
}

// ---------------------------------------------------------------------------
// Edge Function caller
// ---------------------------------------------------------------------------

async function callCreateOrderFunction(
  input: CreateOrderInput,
  token: string,
): Promise<CreateOrderResult> {
  const payload = {
    orderNumber: input.orderNumber.trim(),
    customerId: input.customerId,
    orderDate: input.orderDate,
    deliveryDate: input.deliveryDate?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    sourceQuotationId: (
      input as CreateOrderInput & { sourceQuotationId?: string }
    ).sourceQuotationId,
    managerOverride: input.managerOverride ?? false,
    items: input.items.map((item) => ({
      fabricType: item.fabricType.trim(),
      colorName: item.colorName?.trim() || undefined,
      colorCode: item.colorCode?.trim() || undefined,
      unit: item.unit ?? 'kg',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
  };

  try {
    const data = await invokeCreateOrderFunction<CreateOrderResult>(
      payload,
      token,
    );
    if (!data?.ok) {
      throw {
        code: 'INTERNAL_ERROR',
        message: 'Không nhận được phản hồi từ server',
      } as CreateOrderError;
    }
    return data;
  } catch (error) {
    // Re-throw connection errors for fallback
    if (isConnectionError(error)) throw error;

    // Parse business errors from Edge Function body
    const body = (error as unknown as { context?: { body?: string } }).context
      ?.body;
    if (body) {
      try {
        const parsed = JSON.parse(body) as { error: CreateOrderError };
        if (parsed.error) throw parsed.error;
      } catch (parseErr) {
        if (parseErr && typeof parseErr === 'object' && 'code' in parseErr) {
          throw parseErr;
        }
      }
    }
    throw {
      code: 'INTERNAL_ERROR',
      message: (error as Error).message,
    } as CreateOrderError;
  }
}

// ---------------------------------------------------------------------------
// Fallback: Direct DB insert (khi Edge Function không kết nối được)
// ---------------------------------------------------------------------------

async function createOrderDirectInsert(
  input: CreateOrderInput,
): Promise<CreateOrderResult> {
  const total = input.items.reduce(
    (sum, it) => sum + it.quantity * it.unitPrice,
    0,
  );

  const order = await createOrder(
    {
      order_number: input.orderNumber.trim(),
      customer_id: input.customerId,
      order_date: input.orderDate,
      delivery_date: input.deliveryDate?.trim() || null,
      total_amount: total,
      notes: input.notes?.trim() || null,
      status: 'draft' as const,
    },
    input.items.map((item, idx) => ({
      fabric_type: item.fabricType.trim(),
      color_name: item.colorName?.trim() || null,
      color_code: item.colorCode?.trim() || null,
      unit: item.unit ?? 'kg',
      quantity: item.quantity,
      unit_price: item.unitPrice,
      sort_order: idx,
    })),
  );

  return {
    ok: true,
    orderId: order.id,
    orderNumber: input.orderNumber.trim(),
    totalAmount: total,
    allocation: [],
    creditInfo: {
      previousDebt: 0,
      newDebt: 0,
      creditLimit: 0,
      managerOverride: false,
    },
    message: `Đơn hàng ${input.orderNumber.trim()} đã được tạo thành công (direct).`,
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

const QUERY_KEY = ['orders'] as const;

export function useCreateOrderV2() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateOrderInput): Promise<CreateOrderResult> => {
      const token = await getAccessToken();

      try {
        return await callCreateOrderFunction(input, token);
      } catch (edgeFnError) {
        // Business error from Edge Function → throw for UI to handle
        if (
          edgeFnError &&
          typeof edgeFnError === 'object' &&
          'code' in edgeFnError &&
          !isConnectionError(edgeFnError)
        ) {
          throw edgeFnError;
        }

        // Connection error → fallback direct insert
        console.warn(
          '[createOrder] ⚠️ Edge Function không thể kết nối, chuyển sang direct insert.',
          edgeFnError,
        );
        return await createOrderDirectInsert(input);
      }
    },

    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ['finished-fabric'] });
      void queryClient.invalidateQueries({ queryKey: ['reserve-rolls'] });
      void queryClient.invalidateQueries({ queryKey: ['customers'] });
      console.info(
        `[createOrder] ✅ ${result.orderNumber} created. ` +
          `Allocated ${result.allocation.length} rolls.`,
      );
    },

    onError: (err: Error | CreateOrderError) => {
      const code = 'code' in err ? err.code : 'UNKNOWN';
      console.error('[createOrder] ❌ Error:', code, err.message);
    },
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function isCreditWarning(code: CreateOrderErrorCode): boolean {
  return code === 'CREDIT_OVERDUE' || code === 'CREDIT_LIMIT_EXCEEDED';
}

export function isCreditBlocked(code: CreateOrderErrorCode): boolean {
  return code === 'CREDIT_BLOCKED';
}

export function isStockError(code: CreateOrderErrorCode): boolean {
  return code === 'INSUFFICIENT_STOCK';
}
