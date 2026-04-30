/* eslint-disable no-console */
import * as Sentry from '@sentry/react';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  module?: string;
  action?: string;
  [key: string]: unknown;
}

class StandardLogger {
  private isProduction = import.meta.env.MODE === 'production';

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext,
  ) {
    const timestamp = new Date().toISOString();
    const modulePrefix = context?.module ? `[${context.module}]` : '';
    const actionPrefix = context?.action ? `[${context.action}]` : '';
    return `${timestamp} ${level.toUpperCase()} ${modulePrefix}${actionPrefix} ${message}`;
  }

  info(message: string, context?: LogContext) {
    if (!this.isProduction) {
      console.info(this.formatMessage('info', message, context), context || '');
    }
  }

  warn(message: string, context?: LogContext) {
    if (!this.isProduction) {
      console.warn(this.formatMessage('warn', message, context), context || '');
    } else {
      Sentry.captureMessage(message, {
        level: 'warning',
        extra: context,
      });
    }
  }

  error(message: string, error?: unknown, context?: LogContext) {
    if (!this.isProduction) {
      console.error(
        this.formatMessage('error', message, context),
        error,
        context || '',
      );
    } else {
      Sentry.captureException(
        error instanceof Error ? error : new Error(String(error || message)),
        {
          extra: {
            ...context,
            originalMessage: message,
          },
        },
      );
    }
  }

  debug(message: string, context?: LogContext) {
    if (!this.isProduction) {
      console.debug(
        this.formatMessage('debug', message, context),
        context || '',
      );
    }
  }
}

export const logger = new StandardLogger();
