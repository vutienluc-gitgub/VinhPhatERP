/* eslint-disable no-console, @typescript-eslint/naming-convention */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { chromium, request, type FullConfig } from '@playwright/test';
import dotenv from 'dotenv';

const thisFile = fileURLToPath(import.meta.url);
const thisDir = path.dirname(thisFile);

// Load env files so we get Supabase URL/keys
dotenv.config({ path: path.resolve(thisDir, '../.env.local') });
dotenv.config({ path: path.resolve(thisDir, '../.env') });

/**
 * Playwright Global Setup
 *
 * Đăng nhập 1 lần bằng Supabase REST API, sau đó lưu storageState
 * (localStorage + cookies) vào `.auth/storageState.json`.
 * Các test sau đó có thể reuse session này, không cần login lại.
 *
 * Cấu hình credentials qua biến môi trường:
 *   E2E_EMAIL       — email tài khoản test (có role authenticated, is_active=true)
 *   E2E_PASSWORD    — mật khẩu
 *
 * Có thể đặt trong `.env.test.local` và source trước khi chạy, hoặc
 * set trực tiếp:
 *   $env:E2E_EMAIL="test@vinhphat.vn"; $env:E2E_PASSWORD="..." ; npm run test:e2e
 *
 * Nếu không có credentials → skip (test sẽ chạy không-auth như bình thường).
 */

const STORAGE_PATH = path.resolve(thisDir, '../.auth/storageState.json');

function hasUsableStorageState(): boolean {
  if (!fs.existsSync(STORAGE_PATH)) {
    return false;
  }

  try {
    const raw = fs.readFileSync(STORAGE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as {
      cookies?: unknown[];
      origins?: unknown[];
    };

    return (
      Array.isArray(parsed.cookies) &&
      Array.isArray(parsed.origins) &&
      (parsed.cookies.length > 0 || parsed.origins.length > 0)
    );
  } catch {
    return false;
  }
}

function readWindowsUserEnv(key: string): string | undefined {
  if (process.platform !== 'win32') {
    return undefined;
  }

  try {
    const value = execSync(
      `powershell -NoProfile -Command "[Environment]::GetEnvironmentVariable('${key}','User')"`,
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    )
      .trim()
      .replace(/^"|"$/g, '');

    return value || undefined;
  } catch {
    return undefined;
  }
}

async function globalSetup(_config: FullConfig) {
  const email = process.env.E2E_EMAIL || readWindowsUserEnv('E2E_EMAIL');
  const password =
    process.env.E2E_PASSWORD || readWindowsUserEnv('E2E_PASSWORD');

  if (!email || !password) {
    if (hasUsableStorageState()) {
      console.warn(
        `\n[globalSetup] E2E credentials chưa set — reuse storageState sẵn có tại ${STORAGE_PATH}.\n`,
      );
      return;
    }

    console.warn(
      '\n[globalSetup] E2E_EMAIL / E2E_PASSWORD chưa set — bỏ qua login setup.\n' +
        '              Các test sẽ chạy ở trạng thái chưa đăng nhập (/auth).\n',
    );
    // Tạo file rỗng để Playwright không lỗi khi storageState được reference
    fs.mkdirSync(path.dirname(STORAGE_PATH), { recursive: true });
    fs.writeFileSync(
      STORAGE_PATH,
      JSON.stringify({ cookies: [], origins: [] }),
      'utf-8',
    );
    return;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey =
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const authApiKey = serviceRoleKey || anonKey;

  if (!supabaseUrl || !authApiKey) {
    throw new Error(
      '[globalSetup] Thiếu VITE_SUPABASE_URL và (VITE_SUPABASE_SERVICE_ROLE_KEY hoặc VITE_SUPABASE_ANON_KEY) trong env',
    );
  }

  console.log(
    '[globalSetup] Đăng nhập qua Supabase REST API với',
    email,
    serviceRoleKey ? '(service role)' : '(anon key)',
  );

  // Gọi thẳng Supabase auth endpoint, bypass UI + Turnstile captcha.
  const apiContext = await request.newContext();
  const res = await apiContext.post(
    `${supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      headers: {
        'Content-Type': 'application/json',
        apikey: authApiKey,
        Authorization: `Bearer ${authApiKey}`,
      },
      data: { email, password },
    },
  );

  if (!res.ok()) {
    const body = await res.text();
    throw new Error(
      `[globalSetup] Supabase login thất bại (HTTP ${res.status()}): ${body}`,
    );
  }

  const session = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    expires_at?: number;
    token_type: string;
    user: unknown;
  };
  await apiContext.dispose();

  // Seed session vào localStorage của browser context với đúng storageKey
  // của app (`vinhphat_session` — xem src/services/supabase/client.ts).
  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.addInitScript((sessionJson: string) => {
    localStorage.setItem('vinhphat_session', sessionJson);
  }, JSON.stringify(session));

  // Navigate 1 lần để init script chạy và localStorage được persist
  const page = await context.newPage();
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);

  fs.mkdirSync(path.dirname(STORAGE_PATH), { recursive: true });
  await context.storageState({ path: STORAGE_PATH });

  await browser.close();
  console.log('[globalSetup] Session đã lưu vào', STORAGE_PATH);
}

export default globalSetup;
