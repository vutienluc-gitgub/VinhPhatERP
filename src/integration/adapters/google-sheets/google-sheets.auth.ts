/**
 * Google Sheets Authentication -- Service Account JWT
 *
 * Creates JWT token from Service Account credentials to call Google API v4.
 * Server-side only (Supabase Edge Function / Deno runtime).
 *
 * Flow:
 *   1. Build JWT with Google Sheets scope
 *   2. Sign with Service Account private key (RS256)
 *   3. Exchange JWT for access token via Google OAuth2 token endpoint
 *   4. Return short-lived access token
 */

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

/**
 * Convert PEM-encoded private key to CryptoKey for signing.
 */
async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pemContents = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');

  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  return crypto.subtle.importKey(
    'pkcs8',
    binaryDer.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

/**
 * Base64url encode (no padding).
 */
function base64url(data: Uint8Array): string {
  let binary = '';
  for (const byte of data) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Get a short-lived Google API access token via Service Account JWT assertion.
 *
 * @param serviceAccountEmail - The Service Account email address
 * @param privateKey - PEM-encoded private key string
 * @returns Access token string (valid for ~1 hour)
 */
export async function getGoogleAccessToken(
  serviceAccountEmail: string,
  privateKey: string,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600;

  // JWT Header
  const header = { alg: 'RS256', typ: 'JWT' };

  // JWT Claims
  const claims = {
    iss: serviceAccountEmail,
    scope: SHEETS_SCOPE,
    aud: GOOGLE_TOKEN_URL,
    iat: now,
    exp: expiry,
  };

  const encoder = new TextEncoder();
  const headerB64 = base64url(encoder.encode(JSON.stringify(header)));
  const claimsB64 = base64url(encoder.encode(JSON.stringify(claims)));
  const unsignedToken = `${headerB64}.${claimsB64}`;

  // Sign
  const key = await importPrivateKey(privateKey);
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    encoder.encode(unsignedToken),
  );
  const signatureB64 = base64url(new Uint8Array(signature));
  const jwt = `${unsignedToken}.${signatureB64}`;

  // Exchange JWT for access token
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Google OAuth2 token exchange failed (${response.status}): ${errorText}`,
    );
  }

  const tokenData = (await response.json()) as { access_token: string };
  return tokenData.access_token;
}
