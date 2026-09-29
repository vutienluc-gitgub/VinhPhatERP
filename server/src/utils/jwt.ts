import { sign, verify } from 'hono/jwt';

export interface SupabaseJwtUser {
  userId: string;
  email?: string;
  role?: string;
  employeeId?: string;
  fullName?: string;
  expiresInSeconds?: number;
}

/**
 * Read the HMAC secret used to sign/verify Supabase-compatible JWTs.
 *
 * Never falls back to a default value: a well-known secret would let anyone
 * mint a token for any `sub`, bypassing RLS across the whole instance.
 * Throws instead, so a missing configuration fails loudly rather than
 * silently insecurely.
 */
export function getJwtSecret(): string {
  const secret = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET;
  if (!secret || secret.trim().length === 0) {
    throw new Error(
      'SUPABASE_JWT_SECRET (or JWT_SECRET) chưa được cấu hình. ' +
        'Từ chối ký/verify JWT để tránh dùng secret mặc định công khai.',
    );
  }
  return secret;
}

/** True when a JWT secret is configured. Used to guard startup and the auth middleware. */
export function hasJwtSecret(): boolean {
  const secret = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET;
  return Boolean(secret && secret.trim().length > 0);
}

/**
 * Mint an HS256 JWT compatible with Supabase GoTrue / PostgREST RLS.
 * Sets `sub = userId` so `auth.uid()` in PostgreSQL evaluates correctly.
 */
export async function mintSupabaseJwt(user: SupabaseJwtUser): Promise<string> {
  const secret = getJwtSecret();
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = user.expiresInSeconds ?? 60 * 60 * 24 * 7; // 7 days

  const payload = {
    sub: user.userId,
    aud: 'authenticated',
    role: user.role || 'authenticated',
    email: user.email || '',
    app_metadata: {
      provider: 'passkey',
      providers: ['passkey'],
    },
    user_metadata: {
      employee_id: user.employeeId || '',
      full_name: user.fullName || '',
    },
    iat: now,
    exp: now + expiresIn,
    iss: 'supabase',
  };

  return await sign(payload, secret, 'HS256');
}

/**
 * Verify a Supabase JWT signature and expiry.
 */
export async function verifySupabaseJwt(
  token: string,
): Promise<Record<string, unknown>> {
  const secret = getJwtSecret();
  return (await verify(token, secret, 'HS256')) as Record<string, unknown>;
}
