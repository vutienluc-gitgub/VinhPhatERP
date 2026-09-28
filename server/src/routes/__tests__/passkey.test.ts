import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';

import {
  mintSupabaseJwt,
  verifySupabaseJwt,
  getJwtSecret,
} from '../../utils/jwt.js';
import { getWebAuthnConfig } from '../../services/passkey.service.js';
import passkeyRouter from '../passkey.js';

describe('Passkey Core & JWT Minting', () => {
  it('mints and verifies a valid Supabase-compatible JWT', async () => {
    const user = {
      userId: '7724bad2-5156-4015-8d64-c83097b4e31d',
      email: 'user@detmayvinhphat.com',
      role: 'admin',
      employeeId: 'NV001',
      fullName: 'Vũ Tiến Lực',
    };

    const token = await mintSupabaseJwt(user);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);

    const payload = await verifySupabaseJwt(token);
    expect(payload.sub).toBe(user.userId);
    expect(payload.role).toBe('admin');
    expect(payload.aud).toBe('authenticated');
    expect(payload.email).toBe(user.email);
    expect((payload.user_metadata as any).employee_id).toBe('NV001');
    expect((payload.app_metadata as any).provider).toBe('passkey');
  });

  it('rejects invalid or tampered JWTs', async () => {
    const user = { userId: 'test-user-id' };
    const token = await mintSupabaseJwt(user);
    const tampered = token.slice(0, -5) + 'abcde';

    await expect(verifySupabaseJwt(tampered)).rejects.toThrow();
  });

  it('returns valid WebAuthn relying party configuration', () => {
    const config = getWebAuthnConfig();
    expect(config.rpName).toBe('Dệt May Vĩnh Phát ERP');
    expect(config.rpID).toBeDefined();
    expect(config.expectedOrigins.length).toBeGreaterThan(0);
    expect(config.expectedOrigins).toContain(
      'https://quantri.detmayvinhphat.com',
    );
  });
});

describe('Passkey Router Endpoints', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.route('/auth/passkey', passkeyRouter);
  });

  it('POST /auth/passkey/login/verify rejects missing response', async () => {
    const res = await app.request('/auth/passkey/login/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Thiếu dữ liệu phản hồi');
  });

  it('POST /auth/passkey/register/options requires authentication', async () => {
    const res = await app.request('/auth/passkey/register/options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    // Without Bearer token, requireAuth returns 401
    expect(res.status).toBe(401);
  });

  it('GET /auth/passkey/credentials requires authentication', async () => {
    const res = await app.request('/auth/passkey/credentials', {
      method: 'GET',
    });

    expect(res.status).toBe(401);
  });
});
