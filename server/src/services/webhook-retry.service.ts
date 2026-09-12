export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitterRatio?: number; // 0.0 (no jitter) to 1.0 (full jitter)
}

export interface RetryEvaluation {
  shouldRetry: boolean;
  nextAttempt: number;
  delayMs: number;
  nextRetryAt?: Date;
  reason?: string;
}

export class WebhookRetryService {
  private static readonly DEFAULT_MAX_ATTEMPTS = 5;
  private static readonly DEFAULT_BASE_DELAY_MS = 1000;
  private static readonly DEFAULT_MAX_DELAY_MS = 30000;
  private static readonly DEFAULT_JITTER_RATIO = 1.0;

  /**
   * Calculates exponential delay with full jitter:
   * rawExp = baseDelayMs * 2^(attempt - 1) capped at maxDelayMs
   * delay = rawExp * (1 - jitterRatio) + random(0, rawExp * jitterRatio)
   */
  static calculateBackoffDelayMs(
    attempt: number,
    options: RetryOptions = {},
    randomSource: () => number = Math.random,
  ): number {
    const base = options.baseDelayMs ?? this.DEFAULT_BASE_DELAY_MS;
    const maxDelay = options.maxDelayMs ?? this.DEFAULT_MAX_DELAY_MS;
    const jitterRatio = options.jitterRatio ?? this.DEFAULT_JITTER_RATIO;

    const safeAttempt = Math.max(1, attempt);
    const exponentialFactor = Math.pow(2, safeAttempt - 1);
    const rawDelay = Math.min(maxDelay, base * exponentialFactor);

    if (jitterRatio <= 0) {
      return Math.round(rawDelay);
    }

    const deterministicPart = rawDelay * (1 - jitterRatio);
    const randomPart = rawDelay * jitterRatio * randomSource();

    return Math.round(deterministicPart + randomPart);
  }

  /**
   * Distinguishes between retryable transient errors (500, 502, 504, 429, timeout)
   * and permanent non-retryable errors (400, 401, 403, signature mismatch).
   */
  static isTransientError(error: unknown): boolean {
    const message = (
      error instanceof Error ? error.message : String(error)
    ).toLowerCase();

    // Permanent errors
    if (
      message.includes('signature_mismatch') ||
      message.includes('invalid_signature') ||
      message.includes('unauthorized') ||
      message.includes('forbidden') ||
      message.includes('validation_error') ||
      message.includes('schema validation') ||
      message.includes('400 bad request') ||
      message.includes('401') ||
      message.includes('403') ||
      message.includes('not found') ||
      message.includes('404')
    ) {
      return false;
    }

    // Transient errors
    if (
      message.includes('timeout') ||
      message.includes('etimedout') ||
      message.includes('econnrefused') ||
      message.includes('econnreset') ||
      message.includes('network') ||
      message.includes('rate limit') ||
      message.includes('429') ||
      message.includes('500') ||
      message.includes('502') ||
      message.includes('503') ||
      message.includes('504') ||
      message.includes('gateway') ||
      message.includes('overloaded')
    ) {
      return true;
    }

    return true; // Default to retry for unknown errors
  }

  /**
   * Determines whether an event should be retried and computes the next retry timestamp.
   */
  static evaluateRetry(
    attempt: number,
    error: unknown,
    options: RetryOptions = {},
    currentTime: Date = new Date(),
  ): RetryEvaluation {
    const maxAttempts = options.maxAttempts ?? this.DEFAULT_MAX_ATTEMPTS;

    if (!this.isTransientError(error)) {
      return {
        shouldRetry: false,
        nextAttempt: attempt,
        delayMs: 0,
        reason: 'Error classified as permanent / non-retryable',
      };
    }

    if (attempt >= maxAttempts) {
      return {
        shouldRetry: false,
        nextAttempt: attempt,
        delayMs: 0,
        reason: `Maximum retry attempts (${maxAttempts}) exhausted`,
      };
    }

    const nextAttempt = attempt + 1;
    const delayMs = this.calculateBackoffDelayMs(nextAttempt, options);
    const nextRetryAt = new Date(currentTime.getTime() + delayMs);

    return {
      shouldRetry: true,
      nextAttempt,
      delayMs,
      nextRetryAt,
    };
  }
}
