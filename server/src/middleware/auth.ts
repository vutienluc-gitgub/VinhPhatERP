import { createClient } from '@supabase/supabase-js';
import type { Context, Next } from 'hono';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Admin client dùng service_role — chỉ dùng ở server, không bao giờ expose ra client
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Middleware xác thực JWT Supabase.
 * Đọc Bearer token từ Authorization header, verify qua Supabase,
 * gán user vào context.
 */
export async function requireAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.slice(7);
  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }

  c.set('user', data.user);
  await next();
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
