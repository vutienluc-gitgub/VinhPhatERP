import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  // eslint-disable-next-line no-console
  console.warn(
    '[Supabase Server] Cảnh báo: SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY chưa được đặt trong .env',
  );
}

export const serverSupabase = createClient(
  supabaseUrl || '',
  serviceRoleKey || '',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);
