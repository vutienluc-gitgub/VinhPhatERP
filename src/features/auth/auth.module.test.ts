import { describe, expect, it } from 'vitest';

import {
  authDefaultValues,
  authSchema,
  normalizeAuthIdentifier,
  isCustomerCode,
} from '@/features/auth/auth.module';

describe('auth.module', () => {
  it('accepts valid credentials with standard email', () => {
    const result = authSchema.parse({
      email: 'user@example.com',
      password: '12345678',
      rememberMe: true,
    });
    expect(result.email).toBe('user@example.com');
  });

  it('accepts valid customer code as login identifier', () => {
    const result = authSchema.parse({
      email: 'KH-001',
      password: '12345678',
    });
    expect(result.email).toBe('KH-001');
  });

  it('trims email and identifier whitespace', () => {
    const result = authSchema.parse({
      email: '  user@example.com  ',
      password: '12345678',
    });
    expect(result.email).toBe('user@example.com');

    const codeResult = authSchema.parse({
      email: '  KH-001  ',
      password: '12345678',
    });
    expect(codeResult.email).toBe('KH-001');
  });

  it('rejects invalid email', () => {
    const result = authSchema.safeParse({
      email: 'invalid-email@',
      password: '12345678',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid identifier with forbidden characters', () => {
    const result = authSchema.safeParse({
      email: 'kh 001 invalid!',
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

  describe('normalizeAuthIdentifier & isCustomerCode', () => {
    it('detects customer code correctly', () => {
      expect(isCustomerCode('KH-001')).toBe(true);
      expect(isCustomerCode('VP_KH02')).toBe(true);
      expect(isCustomerCode('user@example.com')).toBe(false);
      expect(isCustomerCode('a')).toBe(false);
    });

    it('normalizes customer code to internal portal email', () => {
      expect(normalizeAuthIdentifier('KH-001')).toBe(
        'kh-001@portal.vinhphaterp.vn',
      );
      expect(normalizeAuthIdentifier('  KH-002  ')).toBe(
        'kh-002@portal.vinhphaterp.vn',
      );
    });

    it('leaves standard email lowercase unchanged', () => {
      expect(normalizeAuthIdentifier('User@Example.COM')).toBe(
        'user@example.com',
      );
    });
  });
});
