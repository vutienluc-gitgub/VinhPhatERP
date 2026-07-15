import path from 'path';
import { fileURLToPath } from 'url';

import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// Load env files in priority order
dotenv.config({ path: path.resolve(dirname, '.env.test.local') });
dotenv.config({ path: path.resolve(dirname, '.env.local') });
dotenv.config({ path: path.resolve(dirname, '.env') });

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2, // Giới hạn 2 workers local để tránh Supabase rate-limit/timeout
  reporter: 'html',
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: 'http://localhost:5174', // Sử dụng port 5174 cho E2E test
    trace: 'on-first-retry',
  },
  projects: [
    {
      // Default: chưa auth (auth.spec.ts cần test login form)
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: [
        '**/mobile-overflow.spec.ts',
        '**/core-smoke.spec.ts',
        '**/operations-dnd.spec.ts',
        '**/fluid-layout.spec.ts',
      ],
    },
    {
      // Auth project: reuse storageState đã login từ globalSetup
      name: 'chromium-authed',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/storageState.json',
      },
      testMatch: [
        '**/mobile-overflow.spec.ts',
        '**/core-smoke.spec.ts',
        '**/operations-dnd.spec.ts',
        '**/fluid-layout.spec.ts',
      ],
    },
  ],
  webServer: {
    command: 'npm run dev -- --mode test --port 5174',
    url: 'http://localhost:5174',
    reuseExistingServer: false, // Luôn khởi động server test mới, không xài chung với server dev thật
  },
});
