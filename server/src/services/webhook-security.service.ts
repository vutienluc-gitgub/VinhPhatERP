import crypto from 'node:crypto';

export interface WebhookVerificationResult {
  success: boolean;
  error?: string;
}

export class WebhookSecurityService {
  private static readonly DEFAULT_REPLAY_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Generates an HMAC-SHA256 hex digest for a raw payload string.
   */
  static generateHmacSignature(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  /**
   * Verifies an incoming HMAC-SHA256 signature using constant-time comparison.
   */
  static verifyHmacSignature(
    rawBody: string,
    signature: string,
    secret: string,
  ): boolean {
    if (!signature || !secret || !rawBody) {
      return false;
    }

    const cleanSignature = signature.trim().replace(/^sha256=/, '');
    const expectedSignature = this.generateHmacSignature(rawBody, secret);

    const sigBuffer = Buffer.from(cleanSignature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (sigBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  }

  /**
   * Verifies that the webhook request timestamp is within the acceptable replay window.
   */
  static verifyTimestamp(
    timestampHeader?: string | number,
    windowMs: number = this.DEFAULT_REPLAY_WINDOW_MS,
    currentTime: Date = new Date(),
  ): { isValid: boolean; error?: string } {
    if (!timestampHeader) {
      return { isValid: false, error: 'MISSING_TIMESTAMP' };
    }

    const eventTime =
      typeof timestampHeader === 'number'
        ? timestampHeader
        : Number.parseInt(timestampHeader, 10);

    if (Number.isNaN(eventTime)) {
      return { isValid: false, error: 'INVALID_TIMESTAMP_FORMAT' };
    }

    const currentEpoch = currentTime.getTime();
    const eventEpoch = eventTime < 1e12 ? eventTime * 1000 : eventTime;

    const driftMs = Math.abs(currentEpoch - eventEpoch);

    if (driftMs > windowMs) {
      return {
        isValid: false,
        error: `TIMESTAMP_EXPIRED: drift is ${Math.round(driftMs / 1000)}s (allowed: ${Math.round(windowMs / 1000)}s)`,
      };
    }

    return { isValid: true };
  }

  /**
   * Full verification of an inbound webhook request (Signature + Timestamp).
   */
  static verifyInboundRequest(
    rawBody: string,
    signature?: string,
    timestamp?: string | number,
    configuredSecret: string = process.env.WEBHOOK_SECRET ?? '',
  ): WebhookVerificationResult {
    if (!configuredSecret) {
      return {
        success: false,
        error: 'SERVER_MISCONFIGURATION: WEBHOOK_SECRET is not set',
      };
    }

    if (!signature) {
      return {
        success: false,
        error: 'MISSING_SIGNATURE: x-webhook-signature header is required',
      };
    }

    if (timestamp) {
      const timestampCheck = this.verifyTimestamp(timestamp);
      if (!timestampCheck.isValid) {
        return { success: false, error: timestampCheck.error };
      }
    }

    const isSigValid = this.verifyHmacSignature(
      rawBody,
      signature,
      configuredSecret,
    );
    if (!isSigValid) {
      return {
        success: false,
        error: 'SIGNATURE_MISMATCH: HMAC signature does not match payload',
      };
    }

    return { success: true };
  }
}
