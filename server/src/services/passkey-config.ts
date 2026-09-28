export interface WebAuthnConfig {
  rpName: string;
  rpID: string;
  expectedOrigins: string[];
}

export function getWebAuthnConfig(): WebAuthnConfig {
  const rpName = 'Dệt May Vĩnh Phát ERP';
  const rpID =
    process.env.WEBAUTHN_RP_ID ||
    (process.env.NODE_ENV === 'production'
      ? 'quantri.detmayvinhphat.com'
      : 'localhost');

  const defaultOrigins = [
    'https://quantri.detmayvinhphat.com',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];

  if (process.env.ALLOWED_ORIGINS) {
    const extra = process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
    defaultOrigins.push(...extra);
  }

  const expectedOrigins = Array.from(new Set(defaultOrigins));

  return { rpName, rpID, expectedOrigins };
}
