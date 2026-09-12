export interface RetryOptions {
  baseDelayMs: number;
  maxDelayMs: number;
  maxAttempts: number;
  jitterRatio?: number; // 0 to 1, default 1.0 (Full Jitter)
}

export interface RetryEvaluation {
  shouldRetry: boolean;
  nextAttempt: number;
  delayMs: number;
  nextRetryAt: Date | null;
  reason: string;
}

export class WebhookRetryService {
  public static readonly DEFAULT_OPTIONS: RetryOptions = {
    baseDelayMs: 1000, // 1 second
    maxDelayMs: 30000, // 30 seconds
    maxAttempts: 5,
    jitterRatio: 1.0, // Full Jitter
  };

  /**
   * Evaluates whether an error is transient (network/timeout/5xx) and should be retried.
   */
  static isTransientError(error: unknown): boolean {
    if (!error) return false;

    const message = (
      error instanceof Error ? error.message : String(error)
    ).toLowerCase();

    // 1. Permanent rejection keywords
    const permanentKeywords = [
      'signature_mismatch',
      'invalid signature',
      'expired_timestamp',
      'future_timestamp',
      'missing_secret',
      'missing_signature',
      'schema validation error',
      '400',
      '401',
      '403',
      '404',
      'unauthorized',
      'forbidden',
      'not found',
    ];

    if (permanentKeywords.some((kw) => message.includes(kw))) {
      return false;
    }

    // 2. Transient / Network / 5xx error keywords
    const transientKeywords = [
      'timeout',
      'timedout',
      'etimedout',
      'econnreset',
      'econnrefused',
      'network',
      'fetch failed',
      'rate limit',
      '429',
      '500',
      '502',
      '503',
      '504',
      'internal server error',
      'bad gateway',
      'service unavailable',
      'gateway timeout',
      'deadlock detected',
      'lock_not_available',
    ];

    return transientKeywords.some((kw) => message.includes(kw));
  }

  /**
   * Computes exponential backoff with Full Jitter.
   * Full Jitter formula: random_between(0, min(maxDelay, baseDelay * 2^(attempt - 1)))
   */
  static calculateBackoffDelayMs(
    attempt: number,
    options: Partial<RetryOptions> = {},
    randomSource = Math.random,
  ): number {
    const opts: RetryOptions = { ...this.DEFAULT_OPTIONS, ...options };
    const safeAttempt = Math.max(1, attempt);

    // Exponential calculation: base * 2^(attempt - 1)
    const exponentialMultiplier = Math.pow(2, safeAttempt - 1);
    const maxExponentialDelay = Math.min(
      opts.maxDelayMs,
      opts.baseDelayMs * exponentialMultiplier,
    );

    // Apply Full Jitter: random between [0, maxExponentialDelay]
    const jitterFactor = opts.jitterRatio ?? 1.0;
    const randomFraction = randomSource();

    // If jitterRatio is 1.0, full jitter is random * maxExponentialDelay
    // If jitterRatio < 1.0, blend between deterministic and random
    const deterministicPortion = maxExponentialDelay * (1 - jitterFactor);
    const jitteredPortion = maxExponentialDelay * jitterFactor * randomFraction;

    return Math.floor(deterministicPortion + jitteredPortion);
  }

  /**
   * Evaluates retry eligibility and calculates the next execution timestamp.
   */
  static evaluateRetry(
    currentAttempt: number,
    error: unknown,
    options: Partial<RetryOptions> = {},
    now = new Date(),
  ): RetryEvaluation {
    const opts: RetryOptions = { ...this.DEFAULT_OPTIONS, ...options };

    if (currentAttempt >= opts.maxAttempts) {
      return {
        shouldRetry: false,
        nextAttempt: currentAttempt,
        delayMs: 0,
        nextRetryAt: null,
        reason: `Maximum retry attempts exhausted (${currentAttempt}/${opts.maxAttempts})`,
      };
    }

    const isTransient = this.isTransientError(error);
    if (!isTransient) {
      return {
        shouldRetry: false,
        nextAttempt: currentAttempt,
        delayMs: 0,
        nextRetryAt: null,
        reason: 'Error classified as permanent / non-retryable',
      };
    }

    const nextAttempt = currentAttempt + 1;
    const delayMs = this.calculateBackoffDelayMs(nextAttempt, opts);
    const nextRetryAt = new Date(now.getTime() + delayMs);

    return {
      shouldRetry: true,
      nextAttempt,
      delayMs,
      nextRetryAt,
      reason: `Transient failure detected. Backoff delay: ${delayMs}ms`,
    };
  }
}
