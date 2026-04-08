import { describe, expect, it } from 'vitest';

import { authDefaultValues, authSchema } from '@/features/auth/auth.module';

describe('auth.module', () => {
  it('accepts valid credentials', () => {
    const result = authSchema.parse({
      email: 'user@example.com',
      password: '12345678',
      rememberMe: true,
    });
    expect(result.email).toBe('user@example.com');
  });

  it('trims email whitespace', () => {
    const result = authSchema.parse({
      email: '  user@example.com  ',
      password: '12345678',
    });
    expect(result.email).toBe('user@example.com');
  });

  it('rejects invalid email', () => {
    const result = authSchema.safeParse({
      email: 'not-an-email',
      password: '12345678',
    });
    expect(result.success).toBe(false);
  });

  it('rejects password shorter than 8 chars', () => {
    const result = authSchema.safeParse({
      email: 'user@example.com',
      password: '1234567',
    });
    expect(result.success).toBe(false);
  });

  it('defaults rememberMe to true', () => {
    const result = authSchema.parse({
      email: 'user@example.com',
      password: '12345678',
    });
    expect(result.rememberMe).toBe(true);
  });

  it('keeps stable defaults', () => {
    expect(authDefaultValues.email).toBe('');
    expect(authDefaultValues.password).toBe('');
    expect(authDefaultValues.rememberMe).toBe(true);
  });
});
