/**
 * set-db-password.ts — Cập nhật mật khẩu DATABASE_URL vào .env (gốc) và server/.env
 *
 * Cách dùng:
 *   npx tsx .agents/set-db-password.ts                   # nhập mật khẩu khi được hỏi
 *   npx tsx .agents/set-db-password.ts --password=xxx    # truyền mật khẩu trực tiếp
 *   npx tsx .agents/set-db-password.ts --dry-run         # chỉ test kết nối, KHÔNG ghi file
 *
 * Script tự động URL-encode mật khẩu (@ # : / % ...) và ghi đúng 2 định dạng:
 *   .env (gốc)   → transaction pooler :6543 (dùng cho rpc:check / pre-push)
 *   server/.env  → session pooler    :5432 (dùng cho API server)
 * KHÔNG in mật khẩu ra output.
 */
import fs from 'fs';
import readline from 'readline';
import postgres from 'postgres';

const DRY_RUN = process.argv.includes('--dry-run');
const PASSWORD_ARG = process.argv
  .find((a) => a.startsWith('--password='))
  ?.split('=')
  .slice(1)
  .join('=');

const ROOT_ENV = '.env';
const SERVER_ENV = 'server/.env';
const DB_USER = 'postgres.sxphijrofljxkccdwtub';
const POOLER_HOST = 'aws-1-ap-northeast-1.pooler.supabase.com';

const TARGETS = [
  {
    label: 'ROOT   (.env,        transaction pooler :6543)',
    file: ROOT_ENV,
    port: 6543,
  },
  {
    label: 'SERVER (server/.env, session pooler    :5432)',
    file: SERVER_ENV,
    port: 5432,
  },
] as const;

function upsertDatabaseUrl(
  content: string,
  newUrl: string,
): { next: string; replaced: boolean } {
  const re = /^DATABASE_URL=.*$/m;
  if (!re.test(content)) return { next: content, replaced: false };
  return {
    next: content.replace(re, `DATABASE_URL=${newUrl}`),
    replaced: true,
  };
}

async function testConnection(label: string, url: string): Promise<boolean> {
  try {
    const sql = postgres(url, { max: 1, connect_timeout: 10 });
    await sql`select 1`;
    console.log(`[PASS] ${label}`);
    await sql.end({ timeout: 3 });
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`[FAIL] ${label}: ${msg.slice(0, 140)}`);
    return false;
  }
}

async function main() {
  console.log(
    '\n=== Cap nhat mat khau DATABASE_URL (.env goc + server/.env) ===\n',
  );

  let password = PASSWORD_ARG ?? '';
  if (!password) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    password = await new Promise<string>((resolve) => {
      rl.question(
        'Nhap mat khau DB hien tai (Supabase Dashboard > Settings > Database): ',
        (answer) => {
          rl.close();
          resolve(answer.trim());
        },
      );
    });
  }
  if (!password) {
    console.error('[STOP] Mat khau trong. Thoat.');
    process.exit(1);
  }

  // URL-encode de an toan voi ky tu dac biet: @ # : / % ? & ...
  const encoded = encodeURIComponent(password);
  const results: boolean[] = [];

  for (const target of TARGETS) {
    const url = `postgresql://${DB_USER}:${encoded}@${POOLER_HOST}:${target.port}/postgres`;
    const ok = await testConnection(target.label, url);
    results.push(ok);

    if (!ok) continue;
    if (DRY_RUN) {
      console.log(`[OK]   DRY-RUN: khong ghi ${target.file}`);
      continue;
    }
    if (!fs.existsSync(target.file)) {
      console.log(`[WARN] Khong tim thay ${target.file} — bo qua ghi file.`);
      continue;
    }
    const content = fs.readFileSync(target.file, 'utf8');
    const { next, replaced } = upsertDatabaseUrl(content, url);
    if (!replaced) {
      console.log(
        `[WARN] ${target.file} khong co dong DATABASE_URL — khong ghi (them thu cong).`,
      );
      continue;
    }
    fs.writeFileSync(target.file, next, 'utf8');
    console.log(`[OK]   Da cap nhat ${target.file}`);
  }

  console.log('');
  if (results.every(Boolean)) {
    console.log(
      DRY_RUN
        ? '=== DRY-RUN THANH CONG: mat khau dung. Bo --dry-run de ghi vao file. ==='
        : "=== THANH CONG. Chay 'npx tsx .agents/verify-db.ts' de xac minh lan cuoi. ===",
    );
    process.exit(0);
  }
  console.log(
    '=== THAT BAI: mat khau chua dung. Lay connection string tu Supabase Dashboard > Settings > Database (Reset database password neu can) roi chay lai. ===',
  );
  process.exit(1);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
