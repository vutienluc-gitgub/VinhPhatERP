/**
 * Supabase Edge Function: create-customer-account
 * ================================================
 * Tạo tài khoản Customer Portal cho một khách hàng.
 * Chỉ admin mới được gọi (kiểm tra role từ profiles).
 *
 * Request body:
 *   { email: string, password: string, customer_id: string, full_name: string }
 *
 * Deploy: supabase functions deploy create-customer-account
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function errorResponse(code: string, message: string, status = 400): Response {
  return jsonResponse(
    {
      ok: false,
      error: {
        code,
        message,
      },
    },
    status,
  );
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse('UNAUTHORIZED', 'Missing Authorization header', 401);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Verify caller is admin
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return errorResponse('UNAUTHORIZED', 'Invalid token', 401);
    }

    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single();

    if (!callerProfile?.is_active || callerProfile.role !== 'admin') {
      return errorResponse(
        'FORBIDDEN',
        'Chỉ admin mới được tạo tài khoản khách hàng',
        403,
      );
    }

    // Parse body
    const { email, password, customer_id, full_name } = await req.json();

    if (!email || !password || !customer_id || !full_name) {
      return errorResponse(
        'VALIDATION',
        'Thiếu thông tin bắt buộc: email, password, customer_id, full_name',
      );
    }

    // Check customer exists
    const { data: customer, error: custErr } = await supabaseAdmin
      .from('customers')
      .select('id, name')
      .eq('id', customer_id)
      .single();

    if (custErr || !customer) {
      return errorResponse('NOT_FOUND', 'Không tìm thấy khách hàng', 404);
    }

    // Check unique constraint: customer_id chưa có account
    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('customer_id', customer_id)
      .maybeSingle();

    if (existing) {
      return errorResponse(
        'DUPLICATE',
        `Khách hàng ${customer.name} đã có tài khoản Portal. Mỗi khách hàng chỉ được liên kết với 1 tài khoản.`,
        409,
      );
    }

    // Create Supabase Auth user
    const { data: newUser, error: createErr } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (createErr || !newUser.user) {
      return errorResponse(
        'CREATE_FAILED',
        `Tạo tài khoản thất bại: ${createErr?.message}`,
        500,
      );
    }

    // Update profile: role = customer, customer_id, full_name
    const { error: profileErr } = await supabaseAdmin
      .from('profiles')
      .update({
        role: 'customer',
        customer_id,
        full_name,
        is_active: true,
      })
      .eq('id', newUser.user.id);

    if (profileErr) {
      // Rollback: delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return errorResponse(
        'PROFILE_UPDATE_FAILED',
        `Cập nhật profile thất bại: ${profileErr.message}`,
        500,
      );
    }

    return jsonResponse({
      ok: true,
      user_id: newUser.user.id,
      email,
      customer_id,
      message: `Tài khoản Portal cho khách hàng ${customer.name} đã được tạo thành công.`,
    });
  } catch (err) {
    console.error('[create-customer-account] Error:', err);
    return errorResponse('INTERNAL_ERROR', String(err), 500);
  }
});
