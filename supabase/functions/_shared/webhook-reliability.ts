// Supabase Edge Functions Shared Module: webhook-reliability.ts
// P1 Reliability: Structured Correlation Logging, PII Masking, Exponential Backoff & Schema Validation

export interface LogContext {
  correlationId?: string;
  requestId?: string;
  eventId?: string;
  source?: string;
  durationMs?: number;
  [key: string]: unknown;
}

export class WebhookReliability {
  static maskPii(input: string): string {
    if (!input || typeof input !== 'string') return '';
    return input
      .replace(/(Bearer\s+)[A-Za-z0-9._-]+/gi, '$1***')
      .replace(/(password|secret|key|token)=([^&\s]+)/gi, '$1=***')
      .replace(
        /(\d{1,3}[.,]\d{3}[.,]\d{3}[.,]\d{3}|\d{1,3}[.,]\d{3}[.,]\d{3}|\d{1,3}[.,]\d{3})\s*(đ|VND|vnđ|USD|\$)/gi,
        '***',
      )
      .replace(/(\+?84|0)(3|5|7|8|9)\d{8}/g, (phone) => {
        const start = phone.slice(0, 4);
        const end = phone.slice(-3);
        return `${start}***${end}`;
      });
  }

  static calculateBackoffDelayMs(
    attempt: number,
    baseMs = 1000,
    maxMs = 30000,
  ): number {
    const safeAttempt = Math.max(1, attempt);
    const maxExp = Math.min(maxMs, baseMs * Math.pow(2, safeAttempt - 1));
    return Math.floor(Math.random() * maxExp);
  }

  static logInfo(message: string, context: LogContext = {}): void {
    const record = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: this.maskPii(message),
      ...context,
    };
    console.log(JSON.stringify(record));
  }

  static logWarn(message: string, context: LogContext = {}): void {
    const record = {
      timestamp: new Date().toISOString(),
      level: 'WARN',
      message: this.maskPii(message),
      ...context,
    };
    console.warn(JSON.stringify(record));
  }

  static logError(
    message: string,
    error?: unknown,
    context: LogContext = {},
  ): void {
    const record = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message: this.maskPii(message),
      error: error instanceof Error ? error.message : String(error),
      ...context,
    };
    console.error(JSON.stringify(record));
  }
}
