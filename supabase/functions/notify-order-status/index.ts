// Supabase Edge Function: notify-order-status
// Gửi thông báo khi trạng thái đơn hàng thay đổi (Zalo / email tương lai)
// Deploy: supabase functions deploy notify-order-status

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OrderStatusPayload {
  orderId:   string
  newStatus: string
  message?:  string
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { orderId, newStatus, message }: OrderStatusPayload = await req.json()

    // Lấy thông tin đơn hàng + khách hàng
    const { data: order } = await supabase
      .from('orders')
      .select('order_number, customers(name, phone)')
      .eq('id', orderId)
      .single()

    if (!order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Cập nhật trạng thái
    await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)

    // TODO: tích hợp Zalo OA API hoặc email service tại đây
    const notificationPayload = {
      orderNumber: order.order_number,
      newStatus,
      message: message ?? `Đơn hàng ${order.order_number} đã được cập nhật sang trạng thái: ${newStatus}`,
    }

    console.log('[notify-order-status] Notification payload:', notificationPayload)

    return new Response(JSON.stringify({ ok: true, notification: notificationPayload }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
