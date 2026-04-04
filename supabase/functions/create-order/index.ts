/**
 * Supabase Edge Function: create-order
 * =====================================
 * ERP-grade createOrder với đầy đủ business logic trong một atomic transaction:
 *
 * STEP 1: Credit Limit Check (trước khi làm gì cả)
 *   - blocked  → reject hard
 *   - overdue  → require manager_override flag
 *   - over credit limit → require manager_override flag
 *
 * STEP 2: Stock Availability Check
 *   - Tính tổng available_quantity cần cho từng line item
 *   - Nếu thiếu → reject, trả về chi tiết thiếu bao nhiêu
 *
 * STEP 3: FIFO Lot Allocation
 *   - Với mỗi line item: sắp xếp rolls theo production_date ASC, lấy dần
 *   - Ghi kết quả vào order_lot_allocations
 *
 * STEP 4: Atomic Insert
 *   - Insert orders (header)
 *   - Insert order_items (line items)
 *   - Insert order_lot_allocations
 *   - Update finished_fabric_rolls status → 'reserved'
 *   - Update customers.current_debt += order.total_amount
 *   - Insert business_audit_log event = ORDER_CREATED
 *
 * Deploy: supabase functions deploy create-order
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ---------------------------------------------------------------------------
// CORS headers
// ---------------------------------------------------------------------------
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ---------------------------------------------------------------------------
// Request / Response types
// ---------------------------------------------------------------------------

interface OrderItemInput {
  fabricType: string        // mã/loại vải tìm kiếm trong kho
  colorName?: string
  colorCode?: string
  widthCm?: number
  quantity: number          // SỐ MÉT yêu cầu
  unit: 'm' | 'kg'
  unitPrice: number
  notes?: string
}

interface CreateOrderRequest {
  orderNumber:       string
  customerId:        string
  orderDate:         string          // ISO date 'YYYY-MM-DD'
  deliveryDate?:     string
  notes?:            string
  sourceQuotationId?: string
  items:             OrderItemInput[]
  /** Sale không có quyền override. Manager/Admin mới được set true */
  managerOverride?:  boolean
}

interface AllocationPlan {
  rollId:     string
  rollNumber: string
  meters:     number
  itemIndex:  number   // index vào items[]
}

interface InsufficientStockError {
  itemIndex:   number
  fabricType:  string
  requested:   number
  available:   number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function errorResponse(code: string, message: string, detail?: unknown, status = 400): Response {
  return jsonResponse({ ok: false, error: { code, message, detail } }, status)
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

serve(async (req: Request) => {
  // Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ── Auth ──────────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return errorResponse('UNAUTHORIZED', 'Missing Authorization header', null, 401)
    }

    // Client gọi với user JWT — dùng service role để bypass RLS trong transaction
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Supabase client dùng JWT của user để lấy thông tin user
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) {
      return errorResponse('UNAUTHORIZED', 'Invalid token', null, 401)
    }

    // Lấy role của user
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    if (profileErr || !profile) {
      return errorResponse('FORBIDDEN', 'Không tìm thấy profile người dùng', null, 403)
    }

    if (!profile.is_active) {
      return errorResponse('FORBIDDEN', 'Tài khoản bị vô hiệu hoá', null, 403)
    }

    const userRole: string = profile.role
    const allowedRoles = ['admin', 'manager', 'staff', 'sale']
    if (!allowedRoles.includes(userRole)) {
      return errorResponse('FORBIDDEN', 'Không có quyền tạo đơn hàng', null, 403)
    }

    // ── Parse body ────────────────────────────────────────────────────────
    const body: CreateOrderRequest = await req.json()
    const {
      orderNumber,
      customerId,
      orderDate,
      deliveryDate,
      notes,
      sourceQuotationId,
      items,
      managerOverride = false,
    } = body

    // Validate: Sale không được set managerOverride
    if (managerOverride && userRole === 'sale') {
      return errorResponse(
        'FORBIDDEN',
        'Sale không có quyền override credit limit. Vui lòng liên hệ Manager.',
        null,
        403,
      )
    }

    // Validate managerOverride chỉ cho manager/admin
    if (managerOverride && !['admin', 'manager'].includes(userRole)) {
      return errorResponse('FORBIDDEN', 'Chỉ Manager/Admin mới được override.', null, 403)
    }

    if (!items || items.length === 0) {
      return errorResponse('VALIDATION', 'Phải có ít nhất 1 dòng hàng', null, 400)
    }

    // ─────────────────────────────────────────────────────────────────────
    // STEP 1: Credit Limit Check
    // ─────────────────────────────────────────────────────────────────────
    const { data: customer, error: custErr } = await supabaseAdmin
      .from('customers')
      .select('id, name, credit_limit, current_debt, overdue_debt, credit_status')
      .eq('id', customerId)
      .single()

    if (custErr || !customer) {
      return errorResponse('NOT_FOUND', 'Không tìm thấy khách hàng', null, 404)
    }

    const orderTotal = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0)

    // Rule 1: blocked → hard reject
    if (customer.credit_status === 'blocked') {
      return errorResponse(
        'CREDIT_BLOCKED',
        `Khách hàng ${customer.name} đang bị khoá tín dụng. Liên hệ kế toán để được hỗ trợ.`,
        { creditStatus: customer.credit_status },
        422,
      )
    }

    // Rule 2: overdue_debt > 0 → cảnh báo, cần managerOverride
    if (Number(customer.overdue_debt) > 0 && !managerOverride) {
      return errorResponse(
        'CREDIT_OVERDUE',
        `Khách hàng ${customer.name} có ${formatVND(customer.overdue_debt)} công nợ quá hạn. Manager cần xác nhận để tiếp tục.`,
        {
          overdueDebt:     customer.overdue_debt,
          requireOverride: true,
        },
        422,
      )
    }

    // Rule 3: (current_debt + orderTotal) > credit_limit → cảnh báo, cần managerOverride
    if (
      Number(customer.credit_limit) > 0 &&
      (Number(customer.current_debt) + orderTotal) > Number(customer.credit_limit) &&
      !managerOverride
    ) {
      return errorResponse(
        'CREDIT_LIMIT_EXCEEDED',
        `Đơn hàng vượt hạn mức tín dụng. Hạn mức: ${formatVND(customer.credit_limit)}, Nợ hiện tại: ${formatVND(customer.current_debt)}, Đơn mới: ${formatVND(orderTotal)}.`,
        {
          creditLimit:     customer.credit_limit,
          currentDebt:     customer.current_debt,
          orderTotal,
          projectedDebt:   Number(customer.current_debt) + orderTotal,
          requireOverride: true,
        },
        422,
      )
    }

    // ─────────────────────────────────────────────────────────────────────
    // STEP 2: Stock Availability Check + STEP 3: FIFO Allocation Planning
    // ─────────────────────────────────────────────────────────────────────
    const allocationPlan: AllocationPlan[] = []
    const stockErrors: InsufficientStockError[] = []

    for (let i = 0; i < items.length; i++) {
      const item = items[i]!

      // Chỉ kiểm tra tồn kho cho item tính theo mét
      if (item.unit !== 'm') continue

      // Query rolls khớp với fabric_type, color, width — FIFO: production_date ASC
      let rollQuery = supabaseAdmin
        .from('finished_fabric_rolls')
        .select('id, roll_number, length_m, production_date')
        .eq('status', 'in_stock')       // Chỉ lấy lô chưa bị reserve/shipped
        .eq('fabric_type', item.fabricType)
        .order('production_date', { ascending: true })  // FIFO: cũ nhất lên đầu

      if (item.colorCode) {
        rollQuery = rollQuery.eq('color_code', item.colorCode)
      } else if (item.colorName) {
        rollQuery = rollQuery.eq('color_name', item.colorName)
      }

      if (item.widthCm) {
        rollQuery = rollQuery.gte('width_cm', item.widthCm - 1).lte('width_cm', item.widthCm + 1)
      }

      const { data: rolls, error: rollErr } = await rollQuery

      if (rollErr) {
        return errorResponse('DB_ERROR', `Lỗi truy vấn tồn kho: ${rollErr.message}`, null, 500)
      }

      const availableRolls = (rolls ?? []).filter(r => Number(r.length_m) > 0)
      const totalAvailable = availableRolls.reduce((sum, r) => sum + Number(r.length_m), 0)

      if (totalAvailable < item.quantity) {
        stockErrors.push({
          itemIndex:  i,
          fabricType: item.fabricType,
          requested:  item.quantity,
          available:  totalAvailable,
        })
        continue
      }

      // FIFO allocation: lần lượt lấy từng roll
      let remaining = item.quantity
      for (const roll of availableRolls) {
        if (remaining <= 0) break
        const take = Math.min(remaining, Number(roll.length_m))
        allocationPlan.push({
          rollId:     roll.id,
          rollNumber: roll.roll_number,
          meters:     take,
          itemIndex:  i,
        })
        remaining -= take
      }
    }

    // Nếu có lỗi thiếu hàng → reject toàn bộ (không partial)
    if (stockErrors.length > 0) {
      const detail = stockErrors.map(e =>
        `Item ${e.itemIndex + 1} (${e.fabricType}): yêu cầu ${e.requested}m, chỉ có ${e.available}m`
      ).join('; ')

      return errorResponse(
        'INSUFFICIENT_STOCK',
        `Không đủ tồn kho. ${detail}`,
        { stockErrors },
        422,
      )
    }

    // ─────────────────────────────────────────────────────────────────────
    // STEP 4: Atomic Transaction (via pgSQL function)
    //         Gọi stored procedure để đảm bảo atomicity.
    //         Tất cả inserts/updates xảy ra trong cùng 1 transaction.
    // ─────────────────────────────────────────────────────────────────────

    // 4a. Prepare order items payload
    const orderItemsPayload = items.map((item, idx) => ({
      fabric_type: item.fabricType.trim(),
      color_name:  item.colorName?.trim()  ?? null,
      color_code:  item.colorCode?.trim()  ?? null,
      width_cm:    item.widthCm            ?? null,
      unit:        item.unit               ?? 'm',
      quantity:    item.quantity,
      unit_price:  item.unitPrice,
      notes:       item.notes?.trim()      ?? null,
      sort_order:  idx,
    }))

    // 4b. Prepare allocation payload
    const allocationsPayload = allocationPlan.map(a => ({
      roll_id:          a.rollId,
      allocated_meters: a.meters,
      item_index:       a.itemIndex,  // sẽ match với order_items sau khi insert
    }))

    // 4c. Gọi stored function để thực hiện ATOMIC transaction
    const { data: result, error: txErr } = await supabaseAdmin.rpc('fn_create_order_atomic', {
      p_order_number:        orderNumber.trim(),
      p_customer_id:         customerId,
      p_order_date:          orderDate,
      p_delivery_date:       deliveryDate?.trim() ?? null,
      p_total_amount:        orderTotal,
      p_notes:               notes?.trim() ?? null,
      p_source_quotation_id: sourceQuotationId   ?? null,
      p_created_by:          user.id,
      p_items:               orderItemsPayload,
      p_allocations:         allocationsPayload,
      p_manager_override:    managerOverride,
      p_override_user_id:    managerOverride ? user.id : null,
    })

    if (txErr) {
      console.error('[create-order] Transaction error:', txErr)
      return errorResponse(
        'TRANSACTION_FAILED',
        `Tạo đơn thất bại: ${txErr.message}`,
        { pgError: txErr },
        500,
      )
    }

    // ── Success ───────────────────────────────────────────────────────────
    return jsonResponse({
      ok:          true,
      orderId:     result.order_id,
      orderNumber: orderNumber.trim(),
      totalAmount: orderTotal,
      allocation:  allocationPlan.map(a => ({
        rollId:     a.rollId,
        rollNumber: a.rollNumber,
        meters:     a.meters,
      })),
      creditInfo: {
        previousDebt:  customer.current_debt,
        newDebt:       Number(customer.current_debt) + orderTotal,
        creditLimit:   customer.credit_limit,
        managerOverride,
      },
      message: `Đơn hàng ${orderNumber.trim()} đã được tạo thành công. Phân bổ ${allocationPlan.length} lô vải theo FIFO.`,
    })

  } catch (err) {
    console.error('[create-order] Unexpected error:', err)
    return errorResponse('INTERNAL_ERROR', String(err), null, 500)
  }
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatVND(amount: number | string): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
    .format(Number(amount))
}
