// Supabase Edge Functions Shared Module: webhook-security.ts
// Standard HMAC-SHA256 Signature Verification & Replay Protection

export interface WebhookVerifyOptions {
  rawBody: string;
  signatureHeader: string | null;
  timestampHeader: string | null;
  eventIdHeader: string | null;
  secret: string | null | undefined;
  toleranceSeconds?: number;
  nowMs?: number;
}

export interface WebhookVerifyResult {
  valid: boolean;
  errorCode?: string;
  message?: string;
  eventId?: string;
  timestamp?: number;
}

export class WebhookSecurity {
  public static readonly DEFAULT_TOLERANCE_SECONDS = 300; // ±5 minutes

  static timingSafeEqual(a: string, b: string): boolean {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    const aLen = a.length;
    const bLen = b.length;
    let result = aLen === bLen ? 0 : 1;
    const maxLen = Math.max(aLen, bLen);
    for (let i = 0; i < maxLen; i++) {
      const charA = i < aLen ? a.charCodeAt(i) : 0;
      const charB = i < bLen ? b.charCodeAt(i) : 0;
      result |= charA ^ charB;
    }
    return result === 0;
  }

  static async computeSignature(
    secret: string,
    timestamp: number | string,
    eventId: string,
    rawBody: string,
  ): Promise<string> {
    if (!secret) {
      throw new Error('Secret is missing');
    }
    const canonicalString = `${timestamp}.${eventId}.${rawBody}`;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(canonicalString);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      messageData,
    );

    return Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  static async verifyWebhook(
    options: WebhookVerifyOptions,
  ): Promise<WebhookVerifyResult> {
    const {
      rawBody,
      signatureHeader,
      timestampHeader,
      eventIdHeader,
      secret,
      toleranceSeconds = this.DEFAULT_TOLERANCE_SECONDS,
      nowMs = Date.now(),
    } = options;

    if (!secret || secret.trim() === '') {
      return {
        valid: false,
        errorCode: 'MISSING_SECRET',
        message: 'Fail Closed: WEBHOOK_SECRET unconfigured in environment',
      };
    }

    if (!signatureHeader) {
      return {
        valid: false,
        errorCode: 'MISSING_SIGNATURE',
        message: 'Missing x-webhook-signature header',
      };
    }

    if (!timestampHeader) {
      return {
        valid: false,
        errorCode: 'MISSING_TIMESTAMP',
        message: 'Missing x-webhook-timestamp header',
      };
    }

    if (!eventIdHeader) {
      return {
        valid: false,
        errorCode: 'MISSING_EVENT_ID',
        message: 'Missing x-webhook-id header',
      };
    }

    const parsedTimestampSeconds = Number(timestampHeader);
    if (Number.isNaN(parsedTimestampSeconds) || parsedTimestampSeconds <= 0) {
      return {
        valid: false,
        errorCode: 'EXPIRED_TIMESTAMP',
        message: 'Invalid timestamp header',
      };
    }

    const currentSeconds = Math.floor(nowMs / 1000);
    const diffSeconds = currentSeconds - parsedTimestampSeconds;

    if (diffSeconds > toleranceSeconds) {
      return {
        valid: false,
        errorCode: 'EXPIRED_TIMESTAMP',
        message: `Webhook timestamp expired (${diffSeconds}s ago)`,
        eventId: eventIdHeader,
        timestamp: parsedTimestampSeconds,
      };
    }

    if (diffSeconds < -toleranceSeconds) {
      return {
        valid: false,
        errorCode: 'FUTURE_TIMESTAMP',
        message: `Webhook timestamp is in the future (${Math.abs(diffSeconds)}s)`,
        eventId: eventIdHeader,
        timestamp: parsedTimestampSeconds,
      };
    }

    const expectedSignature = await this.computeSignature(
      secret,
      timestampHeader,
      eventIdHeader,
      rawBody,
    );

    const cleanReceivedSig = signatureHeader
      .replace(/^(v1=|sha256=)/i, '')
      .toLowerCase()
      .trim();
    const cleanExpectedSig = expectedSignature.toLowerCase().trim();

    if (!this.timingSafeEqual(cleanReceivedSig, cleanExpectedSig)) {
      return {
        valid: false,
        errorCode: 'SIGNATURE_MISMATCH',
        message: 'Invalid signature',
        eventId: eventIdHeader,
        timestamp: parsedTimestampSeconds,
      };
    }

    return {
      valid: true,
      eventId: eventIdHeader,
      timestamp: parsedTimestampSeconds,
    };
  }
}
