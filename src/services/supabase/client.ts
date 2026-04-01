import { createClient } from '@supabase/supabase-js'

import type { Database } from './database.types'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export function hasSupabaseEnv(): boolean {
  return Boolean(url && anonKey)
}

if (!hasSupabaseEnv()) {
  console.warn(
    '[Supabase] VITE_SUPABASE_URL hoặc VITE_SUPABASE_ANON_KEY chưa được cấu hình.\n' +
    'Tạo file .env.local với đúng giá trị để kết nối Supabase.',
  )
}

function createSupabaseClient() {
  if (!url || !anonKey) {
    // Return a client with empty URL — all requests will fail gracefully
    // instead of silently sending to wrong endpoints
    const placeholder = createClient<Database>('https://placeholder.supabase.co', 'placeholder', {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    return placeholder
  }

  return createClient<Database>(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'vinhphat_session',
    },
    global: {
      headers: { 'x-app-version': '2' },
    },
  })
}

export const supabase = createSupabaseClient()
