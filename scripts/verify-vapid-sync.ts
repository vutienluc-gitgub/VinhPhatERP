/**
 * scripts/verify-vapid-sync.ts
 * CI / Pre-push Architecture Guard: Verifies VAPID Public Key Integrity & Single Source of Truth
 * Ensures zero key-drift between Frontend, Server, and Environment.
 */

import fs from 'fs';
import path from 'path';
import 'dotenv/config';

import { AUTHORITATIVE_VAPID_PUBLIC_KEY } from '@/shared/constants/notifications';

function decodeBase64Url(base64Url: string): Buffer {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  return Buffer.from(base64 + padding, 'base64');
}

function validateNistP256Key(keyString: string, label: string): boolean {
  if (!keyString || keyString.trim().length === 0) {
    console.error(`[FAIL] [VAPID Guard] ${label} is empty or missing.`);
    return false;
  }

  const buf = decodeBase64Url(keyString.trim());
  if (buf.length !== 65) {
    console.error(
      `[FAIL] [VAPID Guard] ${label} has invalid byte length: ${buf.length} bytes (expected 65 bytes for NIST P-256).`,
    );
    return false;
  }

  if (buf[0] !== 0x04) {
    console.error(
      `[FAIL] [VAPID Guard] ${label} does not start with 0x04 uncompressed prefix byte.`,
    );
    return false;
  }

  console.log(
    `[PASS] [VAPID Guard] ${label}: 65-byte NIST P-256 format verified.`,
  );
  return true;
}

async function verifyVapidSync() {
  console.log('\n======================================================');
  console.log('   [VAPID INTEGRITY & REGRESSION GUARD (CI)]');
  console.log('======================================================\n');

  let hasError = false;

  // 1. Validate Authoritative Constant in notifications.ts
  const authKeyValid = validateNistP256Key(
    AUTHORITATIVE_VAPID_PUBLIC_KEY,
    'Authoritative Key (src/shared/constants/notifications.ts)',
  );
  if (!authKeyValid) hasError = true;

  // 2. Validate Root Environment (.env / process.env)
  const envKey = process.env.VITE_VAPID_PUBLIC_KEY;
  if (envKey) {
    const envKeyValid = validateNistP256Key(
      envKey,
      'Root .env (VITE_VAPID_PUBLIC_KEY)',
    );
    if (!envKeyValid) {
      hasError = true;
    } else if (envKey.trim() !== AUTHORITATIVE_VAPID_PUBLIC_KEY) {
      console.error(
        `[FAIL] [VAPID Guard] Root .env key does NOT match AUTHORITATIVE_VAPID_PUBLIC_KEY! Drift detected!`,
      );
      hasError = true;
    } else {
      console.log('[PASS] [VAPID Guard] Root .env matches Authoritative Key.');
    }
  } else {
    console.warn(
      '[WARN] [VAPID Guard] VITE_VAPID_PUBLIC_KEY not set in root environment (using Authoritative Fallback).',
    );
  }

  // 3. Validate Server Environment (server/.env)
  const serverEnvPath = path.resolve(process.cwd(), 'server', '.env');
  if (fs.existsSync(serverEnvPath)) {
    const serverEnvContent = fs.readFileSync(serverEnvPath, 'utf8');
    const match = serverEnvContent.match(/VAPID_PUBLIC_KEY=([^\r\n]+)/);
    if (match && match[1]) {
      const serverKey = match[1].trim();
      const serverKeyValid = validateNistP256Key(
        serverKey,
        'Server .env (VAPID_PUBLIC_KEY)',
      );
      if (!serverKeyValid) {
        hasError = true;
      } else if (serverKey !== AUTHORITATIVE_VAPID_PUBLIC_KEY) {
        console.error(
          `[FAIL] [VAPID Guard] Server .env VAPID_PUBLIC_KEY does NOT match AUTHORITATIVE_VAPID_PUBLIC_KEY! Drift detected!`,
        );
        hasError = true;
      } else {
        console.log(
          '[PASS] [VAPID Guard] Server .env matches Authoritative Key.',
        );
      }
    }
  }

  // 4. Codebase Scan for Obsolete/Hardcoded VAPID Keys
  console.log('\nScanning codebase for unauthorized hardcoded VAPID keys...');
  const OBSOLETE_KEY =
    'BFjNvul1vaXsyiw-wJBxXh11Q-zfKO5BIpZqNKmHrQIRMtmRfq71y_nJ7_chvZhxmrkEK3mFkxuiYbmP9Fv9hbU';

  const filesToCheck = [
    'src/shared/lib/vapidHelper.ts',
    'src/features/notifications/infrastructure/vapid-key.client.ts',
  ];

  for (const relPath of filesToCheck) {
    const fullPath = path.resolve(process.cwd(), relPath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes(OBSOLETE_KEY)) {
        console.error(
          `[FAIL] [VAPID Guard] Obsolete key found in ${relPath}! Must use Single Source of Truth.`,
        );
        hasError = true;
      }
    }
  }

  if (hasError) {
    console.error(
      '\n[FAIL] [VAPID Guard FAILED] VAPID configuration drift detected. Push blocked.',
    );
    process.exit(1);
  }

  console.log('\n======================================================');
  console.log('[PASS] [VAPID Guard PASSED] Single Source of Truth verified.');
  console.log('======================================================\n');
}

verifyVapidSync();
