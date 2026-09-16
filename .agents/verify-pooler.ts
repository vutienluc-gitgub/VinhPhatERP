/**
 * Verify POOLER connection — KHONG in mat khau.
 * Ky vong: neu user da reset password tren Dashboard ma CHUA update .env
 * → auth phai FAIL (bang chung reset da co hieu luc).
 */
import fs from 'fs';
import postgres from 'postgres';

const envContent = fs.readFileSync('.env', 'utf8');
const url = envContent.match(/^DATABASE_URL=(.+)$/m)?.[1]?.trim();
const oldPassword = envContent.match(
  /^DATABASE_URL=postgresql:\/\/[^:]+:([^@]+)@/m,
)?.[1];

if (!url) {
  console.log('[FAIL] .env: khong co DATABASE_URL');
  process.exit(1);
}
console.log(
  `[CHECK] Password trong .env: ${oldPassword ? `co (${oldPassword.length} ky tu, gia tri bi che)` : 'KHONG TIM THAY'}`,
);

try {
  const sql = postgres(url, { connect_timeout: 8, max: 1 });
  const rows = await sql`select current_database() as db, version() as v`;
  console.log(
    `[UNEXPECTED-PASS] KET NOI THANH CONG voi mat khau CU trong .env → ${rows[0].db}`,
  );
  console.log(
    '  → Nghia la: password CHUA duoc reset that su (hoac reset o project khac)!',
  );
  await sql.end({ timeout: 3 });
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  const verdict = /password authentication failed/i.test(msg)
    ? '✅ DUNG KY VONG: reset password DA CO HIEU LUC (mat khau cu bi tu choi). Chi con thieu: cap nhat 2 file .env.'
    : /timeout|ETIMEDOUT/i.test(msg)
      ? '⚠️ TIMEOUT (host reachable da xac nhan truoc do — co the TLS/auth treo)'
      : /ENOTFOUND|ECONNREFUSED/i.test(msg)
        ? '❌ HOST/PORT problem'
        : '❌ Loi khac';
  console.log(`[AUTH-TEST] ${msg.slice(0, 120)}`);
  console.log(`[VERDICT] ${verdict}`);
}
