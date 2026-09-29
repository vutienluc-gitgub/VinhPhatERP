import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
} from '@simplewebauthn/browser';
import { useState, useCallback, useEffect } from 'react';

import { supabase } from '@/services/supabase/client';
import { PASSKEY_NO_REFRESH_TOKEN } from '@/shared/lib/session-kind';

export interface PasskeyCredentialInfo {
  id: string;
  credential_id: string;
  friendly_name: string;
  device_type: string;
  backed_up: boolean;
  created_at: string;
  last_used_at: string | null;
}

/**
 * Check if WebAuthn / Passkeys is supported by current browser
 */
export function isPasskeySupported(): boolean {
  return browserSupportsWebAuthn();
}

/**
 * Register a new Passkey device for the logged-in user
 */
export async function registerPasskey(
  friendlyName?: string,
): Promise<{ verified: boolean; credentialId: string }> {
  if (!browserSupportsWebAuthn()) {
    throw new Error(
      'Thiết bị hoặc trình duyệt này không hỗ trợ Passkey / WebAuthn.',
    );
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Vui lòng đăng nhập trước khi đăng ký thiết bị bảo mật.');
  }

  // 1. Get registration options from server
  const optionsRes = await fetch('/api/v1/auth/passkey/register/options', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!optionsRes.ok) {
    const err = await optionsRes.json().catch(() => ({}));
    throw new Error(err.error || 'Lỗi khi khởi tạo đăng ký Passkey');
  }

  const options = await optionsRes.json();

  // 2. Prompt browser authenticator (Touch ID, Face ID, Windows Hello, YubiKey)
  let regResponse;
  try {
    regResponse = await startRegistration({ optionsJSON: options });
  } catch (err: unknown) {
    if (
      err &&
      typeof err === 'object' &&
      'name' in err &&
      (err as { name: string }).name === 'NotAllowedError'
    ) {
      throw new Error('Đã hủy thao tác sinh trắc học hoặc hết thời gian chờ.');
    }
    const msg =
      err instanceof Error ? err.message : 'Lỗi thiết bị sinh trắc học.';
    throw new Error(msg);
  }

  // 3. Send authenticator assertion to server for verification and storage
  const verifyRes = await fetch('/api/v1/auth/passkey/register/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      response: regResponse,
      friendlyName: friendlyName || 'Thiết bị bảo mật',
    }),
  });

  if (!verifyRes.ok) {
    const err = await verifyRes.json().catch(() => ({}));
    throw new Error(err.error || 'Xác thực đăng ký Passkey thất bại');
  }

  return await verifyRes.json();
}

/**
 * Authenticate user with Passkey (1-touch Face ID / Touch ID / Windows Hello)
 */
export async function signInWithPasskey(
  identifier?: string,
): Promise<{ verified: boolean; credentialId?: string }> {
  if (!browserSupportsWebAuthn()) {
    throw new Error(
      'Thiết bị hoặc trình duyệt này không hỗ trợ Passkey / WebAuthn.',
    );
  }

  // 1. Get authentication options from server
  const optionsRes = await fetch('/api/v1/auth/passkey/login/options', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier }),
  });

  if (!optionsRes.ok) {
    const err = await optionsRes.json().catch(() => ({}));
    throw new Error(err.error || 'Lỗi khi lấy thử thách đăng nhập Passkey');
  }

  const options = await optionsRes.json();

  // 2. Prompt authenticator for signature
  let authResponse;
  try {
    authResponse = await startAuthentication({ optionsJSON: options });
  } catch (err: unknown) {
    if (
      err &&
      typeof err === 'object' &&
      'name' in err &&
      (err as { name: string }).name === 'NotAllowedError'
    ) {
      throw new Error('Đã hủy xác thực sinh trắc học hoặc hết thời gian.');
    }
    const msg =
      err instanceof Error ? err.message : 'Xác thực sinh trắc học thất bại.';
    throw new Error(msg);
  }

  // 3. Verify signature on server and receive Supabase-compatible JWT
  const verifyRes = await fetch('/api/v1/auth/passkey/login/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ response: authResponse }),
  });

  if (!verifyRes.ok) {
    const err = await verifyRes.json().catch(() => ({}));
    throw new Error(err.error || 'Xác thực chữ ký Passkey không hợp lệ');
  }

  const result = await verifyRes.json();

  // 4. Inject session into Supabase client to trigger auth state & RLS
  if (result?.session?.access_token) {
    // Passkey tokens are minted by our Hono API, not GoTrue, so GoTrue holds no
    // refresh token for them. supabase-js nonetheless requires a *truthy*
    // `refresh_token` for the session to be considered valid, so we pass a
    // sentinel instead of reusing the access token — reusing it made every
    // rotation attempt look like a real (and thus rejected) refresh request.
    // A sentinel truthy value keeps `getSession()` from throwing when the token
    // expires, and fails the same way GoTrue would (gracefully, never silently
    // valid-looking). See PasskeyExpiryNotice for the user-facing handoff.
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: result.session.access_token,
      refresh_token: PASSKEY_NO_REFRESH_TOKEN,
    });

    if (sessionError) {
      throw new Error('Lỗi kích hoạt phiên đăng nhập: ' + sessionError.message);
    }
  }

  return { verified: true, credentialId: authResponse.id };
}

/**
 * Fetch registered passkeys for current user
 */
export async function listPasskeyCredentials(): Promise<
  PasskeyCredentialInfo[]
> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return [];

  const res = await fetch('/api/v1/auth/passkey/credentials', {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (!res.ok) return [];
  const data = await res.json();
  return data.credentials || [];
}

/**
 * Revoke a registered passkey
 */
export async function deletePasskeyCredential(id: string): Promise<boolean> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Chưa đăng nhập');
  }

  const res = await fetch(`/api/v1/auth/passkey/credentials/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Không thể xóa khóa bảo mật');
  }

  return true;
}

export function usePasskeyAuth() {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isPlatformAvailable, setIsPlatformAvailable] =
    useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [passkeyError, setPasskeyError] = useState<string | null>(null);

  useEffect(() => {
    const supported = isPasskeySupported();
    setIsSupported(supported);
    if (supported) {
      platformAuthenticatorIsAvailable().then(setIsPlatformAvailable);
    }
  }, []);

  const handleRegister = useCallback(async (friendlyName?: string) => {
    setPasskeyError(null);
    try {
      setIsAuthenticating(true);
      return await registerPasskey(friendlyName);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setPasskeyError(msg);
      throw err;
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const handleSignIn = useCallback(async (identifier?: string) => {
    setPasskeyError(null);
    try {
      setIsAuthenticating(true);
      return await signInWithPasskey(identifier);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setPasskeyError(msg);
      throw err;
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  return {
    isSupported,
    isPlatformAvailable,
    isAuthenticating,
    passkeyError,
    registerPasskey: handleRegister,
    signInWithPasskey: handleSignIn,
    listCredentials: listPasskeyCredentials,
    deleteCredential: deletePasskeyCredential,
  };
}
