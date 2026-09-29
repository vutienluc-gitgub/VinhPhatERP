import { Hono } from 'hono';

import { serverSupabase } from '../db/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { PasskeyService } from '../services/passkey.service.js';
import { PasskeySessionService } from '../services/passkey-session.service.js';
import {
  PasskeyTokenService,
  getRefreshTokenTtlSeconds,
} from '../services/passkey-token.service.js';

type PasskeyEnv = {
  Variables: { user: { id: string; email?: string; role?: string } };
};
const passkeyRouter = new Hono<PasskeyEnv>();

/**
 * POST /api/v1/auth/passkey/register/options
 * Authenticated user requests options to register a new passkey
 */
passkeyRouter.post('/register/options', requireAuth, async (c) => {
  const user = c.get('user') as { id: string } | undefined;
  if (!user?.id) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const options = await PasskeyService.getRegistrationOptions(user.id);
    return c.json(options);
  } catch (err: unknown) {
    return c.json(
      {
        error:
          (err instanceof Error ? err.message : String(err)) ||
          'Lỗi sinh tham số đăng ký',
      },
      400,
    );
  }
});

/**
 * POST /api/v1/auth/passkey/register/verify
 * Authenticated user submits the authenticator response to save credential
 */
passkeyRouter.post('/register/verify', requireAuth, async (c) => {
  const user = c.get('user') as { id: string } | undefined;
  if (!user?.id) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await c.req.json();
    if (!body?.response) {
      return c.json(
        { error: 'Dữ liệu phản hồi authenticator không hợp lệ' },
        400,
      );
    }

    const result = await PasskeyService.verifyRegistration(
      user.id,
      body.response,
      body.friendlyName,
    );
    return c.json(result);
  } catch (err: unknown) {
    return c.json(
      {
        error:
          (err instanceof Error ? err.message : String(err)) ||
          'Xác thực đăng ký thất bại',
      },
      400,
    );
  }
});

/**
 * POST /api/v1/auth/passkey/login/options
 * Public: request challenge to log in with passkey (optional employeeId/identifier)
 */
passkeyRouter.post('/login/options', async (c) => {
  try {
    let identifier: string | undefined;
    try {
      const body = await c.req.json();
      identifier = body?.identifier || body?.employeeId;
    } catch {
      // Empty body is acceptable for discoverable credentials
    }

    const options = await PasskeyService.getLoginOptions(identifier);
    return c.json(options);
  } catch (err: unknown) {
    return c.json(
      {
        error:
          (err instanceof Error ? err.message : String(err)) ||
          'Lỗi sinh tham số đăng nhập Passkey',
      },
      400,
    );
  }
});

/**
 * POST /api/v1/auth/passkey/login/verify
 * Public: submit passkey assertion to verify and receive Supabase session
 */
passkeyRouter.post('/login/verify', async (c) => {
  try {
    const body = await c.req.json();
    if (!body?.response) {
      return c.json({ error: 'Thiếu dữ liệu phản hồi xác thực Passkey' }, 400);
    }

    const result = await PasskeyService.verifyLogin(body.response);
    return c.json(result);
  } catch (err: unknown) {
    return c.json(
      {
        error:
          (err instanceof Error ? err.message : String(err)) ||
          'Xác thực đăng nhập thất bại',
      },
      400,
    );
  }
});

/**
 * GET /api/v1/auth/passkey/credentials
 * Authenticated user gets list of active passkeys registered to their account
 */
passkeyRouter.get('/credentials', requireAuth, async (c) => {
  const user = c.get('user') as { id: string } | undefined;
  if (!user?.id) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const { data, error } = await serverSupabase
    .from('webauthn_credentials')
    .select(
      'id, credential_id, friendly_name, device_type, backed_up, created_at, last_used_at',
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json({ credentials: data || [] });
});

/**
 * DELETE /api/v1/auth/passkey/credentials/:id
 * Authenticated user revokes one of their passkeys
 */
passkeyRouter.delete('/credentials/:id', requireAuth, async (c) => {
  const user = c.get('user') as { id: string } | undefined;
  const credId = c.req.param('id');

  if (!user?.id || !credId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const { error } = await serverSupabase
    .from('webauthn_credentials')
    .delete()
    .eq('id', credId)
    .eq('user_id', user.id);

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  // A deleted authenticator must not keep a renewable session alive.
  try {
    await PasskeyTokenService.revokeForCredential(credId);
  } catch (err: unknown) {
    // The credential is already gone; a failed sweep is logged, not fatal.
    console.error('[Passkey] revoke refresh tokens for credential failed', err);
  }

  return c.json({ success: true });
});

/**
 * POST /api/v1/auth/passkey/refresh
 * Public: exchange a refresh token for a new access + refresh pair.
 *
 * The refresh token is the credential here, so this endpoint is unauthenticated
 * (the access token is expected to be expired when it is called).
 */
passkeyRouter.post('/refresh', async (c) => {
  try {
    const body = await c.req.json();
    const refreshToken = body?.refresh_token;
    const credentialId = body?.credential_id;

    if (!refreshToken || !credentialId) {
      return c.json(
        { error: 'Thiếu refresh token hoặc mã khóa bảo mật.' },
        400,
      );
    }

    const rotated = await PasskeyTokenService.rotateRefreshToken(
      refreshToken,
      credentialId,
    );

    if (rotated.status === 'not_configured') {
      // Deployment gap, not a bad credential — do not masquerade as 401.
      return c.json({ error: 'Dịch vụ xác thực chưa được cấu hình.' }, 503);
    }

    if (rotated.status === 'reuse') {
      return c.json(
        {
          error:
            'Refresh token đã được sử dụng trước đó. Vì an toàn, toàn bộ phiên của thiết bị này đã bị thu hồi. Vui lòng đăng nhập lại.',
          code: 'refresh_reuse',
        },
        401,
      );
    }

    if (rotated.status !== 'rotated') {
      return c.json(
        {
          error: 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.',
          code: rotated.status,
        },
        401,
      );
    }

    // Mint a matching access token. The rotated row already proved the caller
    // holds a live refresh token for this user+credential.
    const session = await PasskeySessionService.buildSession(
      rotated.userId!,
      rotated.credentialId,
    );

    return c.json({
      ...session,
      refresh_token: rotated.token,
      refresh_expires_in: getRefreshTokenTtlSeconds(),
      credential_id: rotated.credentialId,
      family_id: rotated.familyId,
    });
  } catch (err: unknown) {
    return c.json(
      {
        error:
          (err instanceof Error ? err.message : String(err)) ||
          'Không thể gia hạn phiên đăng nhập.',
      },
      400,
    );
  }
});

/**
 * POST /api/v1/auth/passkey/logout
 * Public: revoke a refresh-token family so the session cannot be renewed.
 */
passkeyRouter.post('/logout', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const familyId = body?.family_id;

    if (!familyId) {
      return c.json({ error: 'Thiếu mã phiên (family_id).' }, 400);
    }

    const revoked = await PasskeyTokenService.revokeFamily(familyId);
    return c.json({ success: true, revoked });
  } catch (err: unknown) {
    return c.json(
      {
        error:
          (err instanceof Error ? err.message : String(err)) ||
          'Không thể đăng xuất.',
      },
      400,
    );
  }
});

export default passkeyRouter;
