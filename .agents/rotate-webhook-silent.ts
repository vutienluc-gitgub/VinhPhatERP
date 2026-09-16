/**
 * Silent re-rotation of WEBHOOK_SECRET — gia tri KHONG bao gio xuat hien
 * trong command line / terminal echo. (Server/.env được ghi trực tiếp.)
 */
import fs from 'fs';
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';

const next = crypto.randomBytes(32).toString('hex');

// 1. Ghi server/.env
const envPath = 'server/.env';
const updated = fs
  .readFileSync(envPath, 'utf8')
  .split('\n')
  .map((line) =>
    line.startsWith('WEBHOOK_SECRET=') ? `WEBHOOK_SECRET=${next}` : line,
  )
  .join('\n');
fs.writeFileSync(envPath, updated, 'utf8');

// 2. Set Edge Function secret qua spawn (args khong duoc echo)
const res = spawnSync(
  'npx',
  ['supabase', 'secrets', 'set', `WEBHOOK_SECRET=${next}`],
  {
    shell: true,
    encoding: 'utf8',
  },
);
const ok = res.status === 0;
const masked = `${next.slice(0, 6)}...${next.slice(-4)} (len=${next.length})`;
console.log(`[ROTATE] server/.env: da ghi secret moi (${masked})`);
console.log(
  `[ROTATE] supabase secrets set: ${ok ? 'OK' : `FAIL — ${(res.stderr || res.stdout || '').slice(0, 120)}`}`,
);
console.log(
  `[VERIFY-READBACK] server/.env khop vua ghi: ${fs.readFileSync(envPath, 'utf8').includes(`WEBHOOK_SECRET=${next}`)}`,
);
