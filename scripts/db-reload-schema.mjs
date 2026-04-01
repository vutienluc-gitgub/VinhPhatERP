/**
 * Reload PostgREST schema cache trên Supabase project.
 *
 * Cách dùng:
 *   npm run db:reload
 *
 * Script gửi lệnh NOTIFY pgrst, 'reload schema' qua Supabase REST API
 * bằng hàm rpc, không cần mở Dashboard.
 */

const PROJECT_REF = 'sxphijrofljxkccdwtub'

// Đọc .env.local để lấy key
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '..', '.env.local')
const envContent = readFileSync(envPath, 'utf-8')

function getEnv(name) {
  const match = envContent.match(new RegExp(`^${name}=(.+)$`, 'm'))
  return match ? match[1].trim() : ''
}

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL')
const SERVICE_KEY = getEnv('VITE_SUPABASE_SERVICE_ROLE_KEY') || getEnv('VITE_SUPABASE_ANON_KEY')

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Thiếu VITE_SUPABASE_URL hoặc key trong .env.local')
  process.exit(1)
}

// Gọi SQL qua Supabase REST RPC — tạo function helper 1 lần
// Cách đơn giản nhất: dùng pg_notify qua rpc nếu đã tạo function,
// hoặc fallback qua supabase CLI
async function reloadViaCliSql() {
  const { execSync } = await import('child_process')
  try {
    execSync(
      `npx supabase db query --linked "NOTIFY pgrst, 'reload schema';"`,
      { stdio: 'inherit', cwd: resolve(__dirname, '..') }
    )
    console.log('✅ Schema cache đã được reload thành công!')
  } catch {
    console.error('❌ Không thể reload schema cache. Kiểm tra lại kết nối Supabase.')
    process.exit(1)
  }
}

reloadViaCliSql()
