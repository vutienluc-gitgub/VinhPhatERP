// Supabase Edge Function: notify-order-status
// Hardened with Authentication Guard, UUID validation, Order State Machine protection, and Structured Reliability Logging

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { WebhookReliability } from '../_shared/webhook-reliability.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const VALID_ORDER_STATUSES = new Set([
  'draft',
  'pending',
  'confirmed',
  'processing',
  'completed',
  'cancelled',
]);

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface OrderStatusPayload {
  orderId: string;
  newStatus: string;
  message?: string;
}

serve(async (req: Request) => {
  const startTime = Date.now();

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Caller Authentication Guard
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      WebhookReliability.logWarn(
        'notify-order-status called without authorization header',
      );
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      );
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    let isAuthorized = false;

    if (supabaseServiceKey && token === supabaseServiceKey) {
      isAuthorized = true;
    } else {
      const { data: userAuth, error: authErr } =
        await supabase.auth.getUser(token);
      if (!authErr && userAuth?.user) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      WebhookReliability.logWarn(
        'notify-order-status called with invalid credentials',
      );
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token or credentials' }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      );
    }

    // 2. Schema & Payload Validation
    const body: unknown = await req.json();
    if (!body || typeof body !== 'object') {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { orderId, newStatus, message } = body as Partial<OrderStatusPayload>;

    if (!orderId || !UUID_REGEX.test(orderId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid orderId: must be a valid UUID' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    if (!newStatus || !VALID_ORDER_STATUSES.has(newStatus.toLowerCase())) {
      return new Response(
        JSON.stringify({
          error: `Invalid newStatus: must be one of [${Array.from(VALID_ORDER_STATUSES).join(', ')}]`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const normalizedStatus = newStatus.toLowerCase();

    // 3. Fetch order & enforce State Machine rules
    const { data: order, error: orderFetchErr } = await supabase
      .from('orders')
      .select('id, order_number, status, tenant_id, customers(name, phone)')
      .eq('id', orderId)
      .single();

    if (orderFetchErr || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }

    // Guard terminal states
    if (order.status === 'completed' || order.status === 'cancelled') {
      return new Response(
        JSON.stringify({
          error: `Cannot update order in terminal state '${order.status}' to '${normalizedStatus}'`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // 4. Update order status
    const { error: updateErr } = await supabase
      .from('orders')
      .update({
        status: normalizedStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateErr) {
      WebhookReliability.logError('Order status update failed', updateErr, {
        orderId,
        durationMs: Date.now() - startTime,
      });
      return new Response(
        JSON.stringify({ error: `Update failed: ${updateErr.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // 5. Structure notification payload
    const notificationPayload = {
      orderNumber: order.order_number,
      previousStatus: order.status,
      newStatus: normalizedStatus,
      message:
        message ??
        `Đơn hàng #${order.order_number} đã được chuyển sang trạng thái: ${normalizedStatus}`,
    };

    WebhookReliability.logInfo('Order status transitioned successfully', {
      orderId,
      orderNumber: order.order_number,
      previousStatus: order.status,
      newStatus: normalizedStatus,
      durationMs: Date.now() - startTime,
    });

    return new Response(
      JSON.stringify({
        ok: true,
        notification: notificationPayload,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (err: unknown) {
    WebhookReliability.logError('Unhandled error in notify-order-status', err, {
      durationMs: Date.now() - startTime,
    });
    const errorMsg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});
