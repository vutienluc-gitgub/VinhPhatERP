export type LogLevel = 'info' | 'warn' | 'error';

export interface LogContext {
  correlationId?: string;
  requestId?: string;
  eventId?: string;
  source?: string;
  durationMs?: number;
  [key: string]: unknown;
}

export class WebhookLogger {
  /**
   * Sanitizes strings by masking PII, passwords, tokens, and monetary values.
   */
  static maskPiiString(input: string): string {
    if (!input || typeof input !== 'string') return '';

    return (
      input
        // 1. Mask Bearer / Token values
        .replace(/(Bearer\s+)[A-Za-z0-9._-]+/gi, '$1***')
        // 2. Mask passwords and secret assignments in URLs or queries
        .replace(/(password|secret|key|token)=([^&\s]+)/gi, '$1=***')
        // 3. Mask explicit monetary values (e.g. 50.000.000đ, 1.250.000 VND, $5,000)
        .replace(
          /(\d{1,3}[.,]\d{3}[.,]\d{3}[.,]\d{3}|\d{1,3}[.,]\d{3}[.,]\d{3}|\d{1,3}[.,]\d{3})\s*(đ|VND|vnđ|USD|\$)/gi,
          '***',
        )
        // 4. Mask Vietnamese phone numbers (e.g., 0912345678, +84912345678)
        .replace(/(\+?84|0)(3|5|7|8|9)\d{8}/g, (phone) => {
          const start = phone.slice(0, 4);
          const end = phone.slice(-3);
          return `${start}***${end}`;
        })
    );
  }

  /**
   * Recursively masks sensitive fields in structured objects.
   */
  static sanitizePayload(data: unknown): unknown {
    if (data === null || data === undefined) return data;

    if (typeof data === 'string') {
      return this.maskPiiString(data);
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizePayload(item));
    }

    if (typeof data === 'object') {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(
        data as Record<string, unknown>,
      )) {
        const lowerKey = key.toLowerCase();
        if (
          lowerKey.includes('password') ||
          lowerKey.includes('secret') ||
          lowerKey.includes('token') ||
          lowerKey.includes('private') ||
          lowerKey.includes('api-key') ||
          lowerKey.includes('apikey') ||
          lowerKey.includes('api_key')
        ) {
          sanitized[key] = '***';
        } else {
          sanitized[key] = this.sanitizePayload(value);
        }
      }
      return sanitized;
    }

    return data;
  }

  /**
   * Formats a structured log record with correlation metadata.
   */
  static formatLog(
    level: LogLevel,
    message: string,
    context: LogContext = {},
  ): string {
    const timestamp = new Date().toISOString();
    const sanitizedContext = this.sanitizePayload(context) as LogContext;
    const sanitizedMessage = this.maskPiiString(message);

    const logRecord = {
      timestamp,
      level: level.toUpperCase(),
      message: sanitizedMessage,
      ...sanitizedContext,
    };

    return JSON.stringify(logRecord);
  }

  static info(message: string, context: LogContext = {}): void {
    // eslint-disable-next-line no-console
    console.log(this.formatLog('info', message, context));
  }

  static warn(message: string, context: LogContext = {}): void {
    // eslint-disable-next-line no-console
    console.warn(this.formatLog('warn', message, context));
  }

  static error(
    message: string,
    error?: unknown,
    context: LogContext = {},
  ): void {
    const errorDetails = error
      ? {
          error_name: error instanceof Error ? error.name : 'UnknownError',
          error_message: this.maskPiiString(
            error instanceof Error ? error.message : String(error),
          ),
          error_stack: error instanceof Error ? error.stack : undefined,
        }
      : {};

    // eslint-disable-next-line no-console
    console.error(
      this.formatLog('error', message, { ...context, ...errorDetails }),
    );
  }
}
