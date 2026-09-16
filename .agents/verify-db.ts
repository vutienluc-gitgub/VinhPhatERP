/**
 * Verify DB rotation (Giai doan 1) — KHONG in mat khau ra output.
 */
import fs from 'fs';
import postgres from 'postgres';

const OLD_PASSWORDS = new Set([
  '[Vinhphat-v2]',
  'Vinhphat-v2',
  'jhVVQpMHZXAtOXba',
]);

function readDbUrl(path: string): { url?: string; passwordChanged: boolean } {
  if (!fs.existsSync(path)) return { passwordChanged: false };
  const match = fs
    .readFileSync(path, 'utf8')
    .match(/^DATABASE_URL=postgresql:\/\/([^:]+):([^@]+)@/m);
  if (!match) return { passwordChanged: false };
  const password = match[2];
  return {
    url: fs
      .readFileSync(path, 'utf8')
      .match(/^DATABASE_URL=(.+)$/m)?.[1]
      ?.trim(),
    passwordChanged: !OLD_PASSWORDS.has(password),
  };
}

const direct = readDbUrl('server/.env');
const pooler = readDbUrl('.env');

console.log(
  `[CHECK] server/.env: mat khau da thay doi? ${direct.passwordChanged ? 'YES' : 'NO - van la mat khau cu!'}`,
);
console.log(
  `[CHECK] .env (root): mat khau da thay doi? ${pooler.passwordChanged ? 'YES' : 'NO - van la mat khau cu!'}`,
);

async function test(label: string, url?: string): Promise<boolean> {
  if (!url) {
    console.log(`[FAIL] ${label}: khong tim thay DATABASE_URL trong file`);
    return false;
  }
  const masked = url.replace(/:[^:@/]+@/, ':***@');
  try {
    const sql = postgres(url, { connect_timeout: 10, max: 1 });
    const rows = await sql`select version() as v, current_database() as db`;
    const info = `${String(rows[0].db)} / pg ${(String(rows[0].v).match(/PostgreSQL ([\d.]+)/) || [])[1] ?? '?'}`;
    console.log(`[PASS] ${label}: KET NOI THANH CONG → ${info}`);
    console.log(`       ${masked}`);
    await sql.end({ timeout: 3 });
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const hint = /password authentication failed|role .* does not exist/i.test(
      msg,
    )
      ? ' → SAI MAT KHAU: kiem tra lai chuoi DATABASE_URL'
      : /timeout|ETIMEDOUT|ENOTFOUND/i.test(msg)
        ? ' → LOI MANG: kiem tra internet/host'
        : '';
    console.log(`[FAIL] ${label}: ${msg.slice(0, 140)}${hint}`);
    return false;
  }
}

console.log('');
const r1 = await test('DIRECT  (server/.env, :5432)', direct.url);
const r2 = await test('POOLER  (.env root, :6543)', pooler.url);
console.log('');
console.log(
  `=== KET QUA: ${r1 && r2 ? 'GIAI DOAN 1 XAC MINH THANH CONG' : 'CHUA PASS — xem chi tiet tren'} ===`,
);
