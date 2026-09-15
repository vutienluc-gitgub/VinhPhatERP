/**
 * Domain Service: Push Error Classifier
 * Evaluates remote push gateway (APNs / FCM) errors to determine token revocation.
 * Non-negotiable safety: Never revoke valid device tokens on server-side config/network errors.
 */

export interface RemotePushError {
  statusCode: number;
  body?: string;
  reason?: string;
  message?: string;
}

export type PushErrorClassification =
  | 'REVOKE_TOKEN'
  | 'RETAIN_TOKEN_TRANSIENT'
  | 'RETAIN_TOKEN_CONFIG_ERROR';

export class PushErrorClassifier {
  /**
   * Extracts the granular reason string from Apple / Google response body
   */
  static extractReason(body?: string): string {
    if (!body) return '';
    try {
      if (body.startsWith('{')) {
        const parsed = JSON.parse(body) as { reason?: string; error?: string };
        return parsed.reason || parsed.error || '';
      }
    } catch {
      // Return raw string if not JSON
    }
    return body;
  }

  /**
   * Classifies whether a token must be revoked or retained
   */
  static classify(error: RemotePushError): PushErrorClassification {
    const { statusCode } = error;
    const reason = error.reason || this.extractReason(error.body);

    // 1. Explicit token death signals from Apple APNs / Google FCM
    if (statusCode === 410 || statusCode === 404) {
      return 'REVOKE_TOKEN';
    }

    if (
      statusCode === 400 &&
      (reason === 'BadDeviceToken' ||
        reason === 'Unregistered' ||
        reason === 'DeviceTokenNotForTopic')
    ) {
      return 'REVOKE_TOKEN';
    }

    // 2. Server configuration / VAPID / topic errors — DO NOT REVOKE
    if (
      statusCode === 400 ||
      statusCode === 401 ||
      statusCode === 403 ||
      reason === 'BadJwtToken' ||
      reason === 'MissingTopic' ||
      reason === 'PayloadTooLarge'
    ) {
      return 'RETAIN_TOKEN_CONFIG_ERROR';
    }

    // 3. Transient network / gateway server errors
    return 'RETAIN_TOKEN_TRANSIENT';
  }

  /**
   * Convenience guard
   */
  static shouldRevokeToken(error: RemotePushError): boolean {
    return this.classify(error) === 'REVOKE_TOKEN';
  }
}
