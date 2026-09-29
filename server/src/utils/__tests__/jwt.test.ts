import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { getJwtSecret, hasJwtSecret } from '../jwt.js';

const ORIGINAL_SUPABASE = process.env.SUPABASE_JWT_SECRET;
const ORIGINAL_JWT = process.env.JWT_SECRET;

function clearSecretEnv() {
  delete process.env.SUPABASE_JWT_SECRET;
  delete process.env.JWT_SECRET;
}

function restoreSecretEnv() {
  if (ORIGINAL_SUPABASE === undefined) delete process.env.SUPABASE_JWT_SECRET;
  else process.env.SUPABASE_JWT_SECRET = ORIGINAL_SUPABASE;
  if (ORIGINAL_JWT === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = ORIGINAL_JWT;
}

describe('getJwtSecret', () => {
  beforeEach(clearSecretEnv);
  afterEach(restoreSecretEnv);

  it('returns SUPABASE_JWT_SECRET when configured', () => {
    process.env.SUPABASE_JWT_SECRET = 'a'.repeat(40);
    expect(getJwtSecret()).toBe('a'.repeat(40));
  });

  it('falls back to JWT_SECRET when SUPABASE_JWT_SECRET is absent', () => {
    process.env.JWT_SECRET = 'b'.repeat(40);
    expect(getJwtSecret()).toBe('b'.repeat(40));
  });

  it('prefers SUPABASE_JWT_SECRET over JWT_SECRET', () => {
    process.env.SUPABASE_JWT_SECRET = 'primary-secret-value-1234567890';
    process.env.JWT_SECRET = 'secondary-secret-value-1234567890';
    expect(getJwtSecret()).toBe('primary-secret-value-1234567890');
  });

  // Regression: the old implementation silently used a public well-known
  // string, letting anyone forge a token for any `sub` and bypass RLS.
  it('throws instead of falling back to the public default secret', () => {
    expect(() => getJwtSecret()).toThrow(/SUPABASE_JWT_SECRET/);
  });

  it('throws when the configured secret is blank', () => {
    process.env.SUPABASE_JWT_SECRET = '   ';
    expect(() => getJwtSecret()).toThrow(/SUPABASE_JWT_SECRET/);
  });

  it('never returns the historical hardcoded default', () => {
    process.env.SUPABASE_JWT_SECRET = 'x'.repeat(40);
    expect(getJwtSecret()).not.toBe(
      'your-super-secret-jwt-token-with-at-least-32-characters-long',
    );
  });
});

describe('hasJwtSecret', () => {
  beforeEach(clearSecretEnv);
  afterEach(restoreSecretEnv);

  it('is false when no secret is configured', () => {
    expect(hasJwtSecret()).toBe(false);
  });

  it('is false for a blank secret', () => {
    process.env.SUPABASE_JWT_SECRET = '  ';
    expect(hasJwtSecret()).toBe(false);
  });

  it('is true when a secret is configured', () => {
    process.env.SUPABASE_JWT_SECRET = 'y'.repeat(40);
    expect(hasJwtSecret()).toBe(true);
  });
});
