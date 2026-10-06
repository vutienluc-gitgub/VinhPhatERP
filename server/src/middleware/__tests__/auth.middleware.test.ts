import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Hono } from 'hono';

// Stub the admin Supabase client so requireAuth's GoTrue path always fails,
// forcing the code down the local-JWT branch under test.
const { mockGetUser } = vi.hoisted(() => ({ mockGetUser: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: () => ({ select: () => ({ eq: () => ({ single: vi.fn() }) }) }),
  }),
}));

import { requireAuth } from '../auth.js';

const ORIGINAL_SUPABASE = process.env.SUPABASE_JWT_SECRET;
const ORIGINAL_JWT = process.env.JWT_SECRET;

function makeApp() {
  const app = new Hono();
  app.get('/protected', requireAuth, (c) => c.json({ ok: true }));
  return app;
}

describe('requireAuth — JWT secret configuration guard', () => {
  beforeEach(() => {
    delete process.env.SUPABASE_JWT_SECRET;
    delete process.env.JWT_SECRET;
    mockGetUser.mockReset();
    // GoTrue rejects the token, so the middleware falls through to the JWT branch
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'invalid' },
    });
  });

  afterEach(() => {
    if (ORIGINAL_SUPABASE === undefined) delete process.env.SUPABASE_JWT_SECRET;
    else process.env.SUPABASE_JWT_SECRET = ORIGINAL_SUPABASE;
    if (ORIGINAL_JWT === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = ORIGINAL_JWT;
  });

  it('returns 503 when no JWT secret is configured', async () => {
    const res = await makeApp().request('/protected', {
      headers: { Authorization: 'Bearer some.token.value' },
    });
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toMatch(/not configured/i);
  });

  it('returns 401 (not 503) once a secret is configured but the token is invalid', async () => {
    process.env.SUPABASE_JWT_SECRET = 'z'.repeat(40);
    const res = await makeApp().request('/protected', {
      headers: { Authorization: 'Bearer some.token.value' },
    });
    expect(res.status).toBe(401);
  });

  it('returns 401 when the Authorization header is missing', async () => {
    process.env.SUPABASE_JWT_SECRET = 'z'.repeat(40);
    const res = await makeApp().request('/protected');
    expect(res.status).toBe(401);
  });
});
