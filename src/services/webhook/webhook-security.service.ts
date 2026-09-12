import { z } from 'zod';

export type WebhookSecurityErrorCode =
  | 'MISSING_SECRET'
  | 'MISSING_SIGNATURE'
  | 'MISSING_TIMESTAMP'
  | 'MISSING_EVENT_ID'
  | 'EXPIRED_TIMESTAMP'
  | 'FUTURE_TIMESTAMP'
  | 'SIGNATURE_MISMATCH';

export interface WebhookVerifyOptions {
  rawBody: string;
  signatureHeader: string | null | undefined;
  timestampHeader: string | null | undefined;
  eventIdHeader: string | null | undefined;
  secret: string | null | undefined;
  toleranceSeconds?: number;
  nowMs?: number;
}

export interface WebhookVerifyResult {
  valid: boolean;
  errorCode?: WebhookSecurityErrorCode;
  message?: string;
  eventId?: string;
  timestamp?: number;
}

/**
 * Standard Webhook Envelope Schema
 */
export const InboundWebhookEnvelopeSchema = z.object({
  event_id: z.string().min(1, 'event_id is required'),
  event_type: z.string().min(1, 'event_type is required'),
  timestamp: z.union([z.number(), z.string()]),
  data: z.record(z.unknown()),
  tenant_id: z.string().uuid().optional(),
});

export type InboundWebhookEnvelope = z.infer<
  typeof InboundWebhookEnvelopeSchema
>;

export class WebhookSecurityService {
  public static readonly DEFAULT_TOLERANCE_SECONDS = 300; // ±5 minutes

  /**
   * Constant-time comparison between two hex strings to prevent timing attacks.
   */
  static timingSafeEqual(a: string, b: string): boolean {
    if (typeof a !== 'string' || typeof b !== 'string') {
      return false;
    }

    const aLen = a.length;
    const bLen = b.length;
    let result = aLen === bLen ? 0 : 1;

    // Use max length to ensure constant time execution regardless of match
    const maxLen = Math.max(aLen, bLen);
    for (let i = 0; i < maxLen; i++) {
      const charA = i < aLen ? a.charCodeAt(i) : 0;
      const charB = i < bLen ? b.charCodeAt(i) : 0;
      result |= charA ^ charB;
    }

    return result === 0;
  }

  /**
   * Computes HMAC-SHA256 signature for canonical webhook payload.
   * Standard format: `${timestamp}.${eventId}.${rawBody}`
   */
  static async computeSignature(
    secret: string,
    timestamp: number | string,
    eventId: string,
    rawBody: string,
  ): Promise<string> {
    if (!secret) {
      throw new Error(
        'Cannot compute webhook signature: secret is missing or empty',
      );
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

    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    return signatureArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Verifies inbound webhook signature, timestamp window, and event identity.
   * Fails closed if secret or headers are missing.
   */
  static async verifyWebhookSignature(
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

    // 1. Fail closed if secret is not configured in environment
    if (!secret || secret.trim() === '') {
      return {
        valid: false,
        errorCode: 'MISSING_SECRET',
        message: 'Fail Closed: WEBHOOK_SECRET is missing or empty',
      };
    }

    // 2. Validate required headers
    if (!signatureHeader || signatureHeader.trim() === '') {
      return {
        valid: false,
        errorCode: 'MISSING_SIGNATURE',
        message: 'Missing x-webhook-signature header',
      };
    }

    if (!timestampHeader || timestampHeader.trim() === '') {
      return {
        valid: false,
        errorCode: 'MISSING_TIMESTAMP',
        message: 'Missing x-webhook-timestamp header',
      };
    }

    if (!eventIdHeader || eventIdHeader.trim() === '') {
      return {
        valid: false,
        errorCode: 'MISSING_EVENT_ID',
        message: 'Missing x-webhook-id header',
      };
    }

    // 3. Parse and validate timestamp window (replay protection)
    const parsedTimestampSeconds = Number(timestampHeader);
    if (Number.isNaN(parsedTimestampSeconds) || parsedTimestampSeconds <= 0) {
      return {
        valid: false,
        errorCode: 'EXPIRED_TIMESTAMP',
        message: 'Invalid timestamp format in header',
      };
    }

    const currentSeconds = Math.floor(nowMs / 1000);
    const diffSeconds = currentSeconds - parsedTimestampSeconds;

    if (diffSeconds > toleranceSeconds) {
      return {
        valid: false,
        errorCode: 'EXPIRED_TIMESTAMP',
        message: `Webhook timestamp expired: sent ${diffSeconds}s ago (max tolerance: ${toleranceSeconds}s)`,
        eventId: eventIdHeader,
        timestamp: parsedTimestampSeconds,
      };
    }

    if (diffSeconds < -toleranceSeconds) {
      return {
        valid: false,
        errorCode: 'FUTURE_TIMESTAMP',
        message: `Webhook timestamp is in the future by ${Math.abs(diffSeconds)}s (max tolerance: ${toleranceSeconds}s)`,
        eventId: eventIdHeader,
        timestamp: parsedTimestampSeconds,
      };
    }

    // 4. Compute expected HMAC-SHA256 signature
    const expectedSignature = await this.computeSignature(
      secret,
      timestampHeader,
      eventIdHeader,
      rawBody,
    );

    // Normalize signatures (support `v1=` or `sha256=` prefixes if present)
    const cleanReceivedSig = signatureHeader
      .replace(/^(v1=|sha256=)/i, '')
      .toLowerCase()
      .trim();
    const cleanExpectedSig = expectedSignature.toLowerCase().trim();

    // 5. Constant-time signature comparison
    const isMatch = this.timingSafeEqual(cleanReceivedSig, cleanExpectedSig);

    if (!isMatch) {
      return {
        valid: false,
        errorCode: 'SIGNATURE_MISMATCH',
        message: 'Invalid webhook signature',
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

  /**
   * Validates inbound webhook JSON payload against a Zod schema.
   */
  static validatePayload<T>(
    payload: unknown,
    schema: z.ZodSchema<T>,
  ): { success: true; data: T } | { success: false; errorMessage: string } {
    const parseResult = schema.safeParse(payload);
    if (!parseResult.success) {
      const issueDetails = parseResult.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ');
      return {
        success: false,
        errorMessage: `Payload schema validation failed: ${issueDetails}`,
      };
    }
    return {
      success: true,
      data: parseResult.data,
    };
  }
}
