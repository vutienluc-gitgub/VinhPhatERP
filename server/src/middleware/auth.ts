import { createClient } from '@supabase/supabase-js';
import type { Context, Next } from 'hono';

import { verifySupabaseJwt, hasJwtSecret } from '../utils/jwt.js';

const supabaseUrl =
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';

// Admin client dùng service_role — chỉ dùng ở server, không bao giờ expose ra client
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Middleware xác thực JWT Supabase & Passkey tokens.
 * Đọc Bearer token từ Authorization header, verify qua Supabase hoặc JWT secret,
 * gán user vào context.
 */
export async function requireAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.slice(7);

  // 1. Thử verify qua GoTrue (dành cho session OAuth / password)
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (!error && data?.user) {
    c.set('user', data.user);
    await next();
    return;
  }

  // 2. Thử verify JWT ký bằng JWT_SECRET (dành cho Passkey session)
  if (!hasJwtSecret()) {
    // Không có secret: không thể verify passkey JWT. Đây là lỗi cấu hình phía
    // server, không phải lỗi xác thực của client — trả 503 để sự cố vận hành
    // không bị che sau lớp 401.
    return c.json({ error: 'Authentication service not configured' }, 503);
  }

  try {
    const payload = await verifySupabaseJwt(token);
    if (payload?.sub) {
      c.set('user', {
        id: payload.sub as string,
        email: (payload.email as string) || '',
        role: (payload.role as string) || 'authenticated',
        user_metadata: (payload.user_metadata as Record<string, unknown>) || {},
      });
      await next();
      return;
    }
  } catch {
    // Token không hợp lệ ở cả 2 cơ chế
  }

  return c.json({ error: 'Invalid or expired token' }, 401);
}

/**
 * Middleware chỉ cho phép role admin/manager.
 * Phải dùng sau requireAuth.
 */
export async function requireManager(c: Context, next: Next) {
  const user = c.get('user') as { id: string } | undefined;
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'manager'].includes(profile.role)) {
    return c.json({ error: 'Forbidden: manager or admin required' }, 403);
  }

  await next();
}
