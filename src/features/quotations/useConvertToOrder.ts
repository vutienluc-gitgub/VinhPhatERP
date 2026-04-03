import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/services/supabase/client'
import type { Quotation, QuotationStatus } from './types'

/**
 * Hook chuyển đổi Báo giá đã duyệt → Đơn hàng (draft).
 *
 * Flow:
 *  1. Fetch quotation + items
 *  2. Generate next order number
 *  3. Insert order header (draft)
 *  4. Copy quotation_items → order_items
 *  5. Update quotation status → 'converted', lưu converted_order_id
 */
export function useConvertToOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (quotationId: string) => {
      // 1. Fetch quotation with items
      const { data: quotation, error: fetchErr } = await supabase
        .from('quotations')
        .select('*, quotation_items(*)')
        .eq('id', quotationId)
        .single()

      if (fetchErr) throw fetchErr
      if (!quotation) throw new Error('Không tìm thấy báo giá')

      const q = quotation as unknown as Quotation
      if (q.status !== 'confirmed') {
        throw new Error('Chỉ có thể chuyển báo giá đã duyệt thành đơn hàng')
      }

      // 2. Generate next order number
      const now = new Date()
      const yy = String(now.getFullYear()).slice(-2)
      const mm = String(now.getMonth() + 1).padStart(2, '0')
      const orderPrefix = `DH${yy}${mm}-`

      const { data: lastOrders, error: numErr } = await supabase
        .from('orders')
        .select('order_number')
        .ilike('order_number', `${orderPrefix}%`)
        .order('order_number', { ascending: false })
        .limit(1)

      if (numErr) throw numErr

      let nextOrderNum = `${orderPrefix}0001`
      if (lastOrders && lastOrders.length > 0) {
        const last = lastOrders[0]
        if (last) {
          const match = last.order_number.match(/(\d{4})$/)
          if (match?.[1]) {
            const num = parseInt(match[1], 10) + 1
            nextOrderNum = `${orderPrefix}${String(num).padStart(4, '0')}`
          }
        }
      }

      // 3. Insert order header
      const combinedNotes = [
        `Từ BG: ${q.quotation_number}`,
        q.delivery_terms ? `Giao hàng: ${q.delivery_terms}` : '',
        q.payment_terms ? `Thanh toán: ${q.payment_terms}` : '',
        q.notes ? `Ghi chú: ${q.notes}` : ''
      ].filter(Boolean).join('. ')

      const { data: newOrder, error: orderErr } = await supabase
        .from('orders')
        .insert({
          order_number: nextOrderNum,
          customer_id: q.customer_id,
          order_date: now.toISOString().slice(0, 10),
          total_amount: q.total_amount,
          source_quotation_id: quotationId,
          notes: combinedNotes,
          status: 'draft' as const,
        })
        .select()
        .single()

      if (orderErr) throw orderErr
      if (!newOrder) throw new Error('Không thể tạo đơn hàng')

      const orderId = (newOrder as { id: string }).id

      // 4. Copy quotation items → order items
      const items = (q.quotation_items ?? []).map((item, idx) => ({
        order_id: orderId,
        fabric_type: item.fabric_type,
        color_name: item.color_name,
        color_code: item.color_code,
        width_cm: item.width_cm,
        unit: item.unit,
        quantity: item.quantity,
        unit_price: item.unit_price,
        sort_order: idx,
      }))

      if (items.length > 0) {
        const { error: itemsErr } = await supabase.from('order_items').insert(items)
        if (itemsErr) {
          // Rollback: delete the order created
          await supabase.from('orders').delete().eq('id', orderId)
          throw itemsErr
        }
      }

      // 5. Update quotation → converted
      const { error: updateErr } = await supabase
        .from('quotations')
        .update({
          status: 'converted' as QuotationStatus,
          converted_order_id: orderId,
        })
        .eq('id', quotationId)

      if (updateErr) throw updateErr

      return { orderId, orderNumber: nextOrderNum }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['quotations'] })
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}
