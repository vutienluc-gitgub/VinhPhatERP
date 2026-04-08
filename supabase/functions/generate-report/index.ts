// Supabase Edge Function: generate-report
// Chạy trên Deno runtime bên cạnh Supabase
// Deploy: supabase functions deploy generate-report

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Xác thực user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }

    const { type, from, to } = (await req.json()) as {
      type: 'orders' | 'payments' | 'inventory';
      from: string;
      to: string;
    };

    // Lấy dữ liệu tương ứng với loại báo cáo
    let reportData: unknown = null;

    if (type === 'orders') {
      const { data } = await supabase
        .from('orders')
        .select('*, customers(name), order_items(*)')
        .gte('order_date', from)
        .lte('order_date', to)
        .order('order_date', { ascending: false });
      reportData = data;
    } else if (type === 'payments') {
      const { data } = await supabase
        .from('payments')
        .select('*, orders(order_number), customers(name)')
        .gte('payment_date', from)
        .lte('payment_date', to)
        .order('payment_date', { ascending: false });
      reportData = data;
    } else if (type === 'inventory') {
      const { data: rawData } = await supabase
        .from('v_raw_fabric_inventory')
        .select('*');
      reportData = rawData;
    }

    return new Response(JSON.stringify({ data: reportData }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});
