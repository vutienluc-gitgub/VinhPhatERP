import { useState, useCallback, useEffect } from 'react';

import { supabase } from '@/services/supabase/client';

/**
 * Helper to check if WebAuthn / Passkey is supported on current device
 */
export function isPasskeySupported(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'PublicKeyCredential' in window &&
    typeof window.PublicKeyCredential === 'function'
  );
}

/**
 * Generates a cryptographically secure 32-byte challenge
 */
export function generatePasskeyChallenge(): Uint8Array {
  const challenge = new Uint8Array(32);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(challenge);
  } else {
    for (let i = 0; i < 32; i += 1) {
      challenge[i] = Math.floor(Math.random() * 256);
    }
  }
  return challenge;
}

/**
 * Convert ArrayBuffer / Uint8Array to Base64URL string
 */
export function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i += 1) {
    const val = bytes[i];
    if (val !== undefined) {
      binary += String.fromCharCode(val);
    }
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Register a new Passkey device for user
 */
export async function registerPasskey(
  userEmail: string,
  userId: string,
): Promise<{ credentialId: string; rawId: string }> {
  if (!isPasskeySupported()) {
    throw new Error(
      'Thiết bị này không hỗ trợ sinh trắc học (Passkey / WebAuthn).',
    );
  }

  const challengeBytes = generatePasskeyChallenge();
  const creationOptions: CredentialCreationOptions = {
    publicKey: {
      challenge: challengeBytes.buffer as BufferSource,
      rp: {
        name: 'VinhPhatERP',
        id: window.location.hostname,
      },
      user: {
        id: new TextEncoder().encode(userId),
        name: userEmail,
        displayName: userEmail.split('@')[0] || 'User',
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' }, // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60000,
      attestation: 'none',
    },
  };

  const credential = (await navigator.credentials.create(
    creationOptions,
  )) as PublicKeyCredential | null;

  if (!credential) {
    throw new Error('Đăng ký sinh trắc học bị hủy.');
  }

  const rawId = bufferToBase64Url(credential.rawId);
  const { error } = await supabase
    .from('profiles')
    .update({
      updated_at: new Date().toISOString(),
    } as Record<string, unknown>)
    .eq('id', userId);

  if (error) {
    console.error('[Passkey] Failed to save credential metadata:', error);
  }

  return {
    credentialId: credential.id,
    rawId,
  };
}

/**
 * Authenticate user using Passkey (Face ID / Touch ID / Windows Hello)
 */
export async function signInWithPasskey(): Promise<{
  credentialId: string;
  rawId: string;
}> {
  if (!isPasskeySupported()) {
    throw new Error(
      'Thiết bị này không hỗ trợ sinh trắc học (Passkey / WebAuthn).',
    );
  }

  const challengeBytes = generatePasskeyChallenge();
  const requestOptions: CredentialRequestOptions = {
    publicKey: {
      challenge: challengeBytes.buffer as BufferSource,
      rpId: window.location.hostname,
      userVerification: 'required',
      timeout: 60000,
    },
  };

  const credential = (await navigator.credentials.get(
    requestOptions,
  )) as PublicKeyCredential | null;

  if (!credential) {
    throw new Error('Xác thực sinh trắc học bị hủy.');
  }

  const rawId = bufferToBase64Url(credential.rawId);
  return {
    credentialId: credential.id,
    rawId,
  };
}

export function usePasskeyAuth() {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [passkeyError, setPasskeyError] = useState<string | null>(null);

  useEffect(() => {
    setIsSupported(isPasskeySupported());
  }, []);

  const handleRegister = useCallback(
    async (userEmail: string, userId: string) => {
      setPasskeyError(null);
      try {
        setIsAuthenticating(true);
        return await registerPasskey(userEmail, userId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setPasskeyError(msg);
        throw err;
      } finally {
        setIsAuthenticating(false);
      }
    },
    [],
  );

  const handleSignIn = useCallback(async () => {
    setPasskeyError(null);
    try {
      setIsAuthenticating(true);
      return await signInWithPasskey();
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
    isAuthenticating,
    passkeyError,
    registerPasskey: handleRegister,
    signInWithPasskey: handleSignIn,
  };
}
