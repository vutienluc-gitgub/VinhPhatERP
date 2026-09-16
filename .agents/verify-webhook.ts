/**
 * Verify WEBHOOK_SECRET rotation.
 * (1) Secret MOI trong server/.env → HMAC verify PHAI PASS
 * (2) Secret CU da bi leak (tu server/.env cu) → PHAI FAIL
 * Khong in secret ra output.
 */
import fs from 'fs';
import crypto from 'node:crypto';

const LEAKED_OLD_SECRET =
  'e5fac8b054ae0d643c0579af35ed5a142c8a5274ef6eee4c9470cc41314ff8c1';

const newSecret = fs
  .readFileSync('server/.env', 'utf8')
  .match(/^WEBHOOK_SECRET=(.+)$/m)?.[1]
  ?.trim();

if (!newSecret) {
  console.log('[FAIL] server/.env: khong tim thay WEBHOOK_SECRET');
  process.exit(1);
}
const masked = `${newSecret.slice(0, 6)}...${newSecret.slice(-4)} (len=${newSecret.length})`;

// Mô phỏng đúng scheme của WebhookSecurityService.verifyHmacSignature
function sign(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}
function verify(payload: string, signature: string, secret: string): boolean {
  const clean = signature.trim().replace(/^sha256=/, '');
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  const a = Buffer.from(clean, 'hex');
  const b = Buffer.from(expected, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const payload = JSON.stringify({
  event_id: 'evt_verify_rotation_1',
  test: true,
});

// (1) New secret must verify
const sigNew = sign(payload, newSecret);
const passNew = verify(payload, sigNew, newSecret);
console.log(
  `[TEST-1] Secret MOI (${masked}) sign→verify: ${passNew ? 'PASS ✅' : 'FAIL ❌'}`,
);

// (2) Old leaked secret must FAIL against new secret
const sigOld = sign(payload, LEAKED_OLD_SECRET);
const passOld = verify(payload, sigOld, newSecret);
console.log(
  `[TEST-2] Secret CU (leaked) sign→verify voi secret moi: ${passOld ? '❌ FAIL-OPEN — ROTATION KHONG CO HIEU LUC!' : 'FAIL (DUNG ✅ — secret cu bi tu choi)'}`,
);

// (3) Tamper test: payload bị sửa phải FAIL
const tampered = verify(payload + ' ', sigNew, newSecret);
console.log(
  `[TEST-3] Tamper test (payload bi sua): ${tampered ? '❌ FAIL-OPEN!' : 'FAIL (DUNG ✅)'}`,
);

console.log(
  `\n=== KET QUA: ${passNew && !passOld && !tampered ? 'GIAI DOAN 3 XAC MINH THANH CONG' : 'CHUA PASS'} ===`,
);
