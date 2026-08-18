import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

import { logger } from '@/shared/utils/logger';

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_RETRIES = 2;
const RETRY_LABEL = 'Thu lai';
const HOME_LABEL = 'Trang chu';
const ERROR_TITLE = 'Module khong the tai';
const ERROR_DESCRIPTION =
  'Da xay ra loi khi tai module nay. Vui long thu lai hoac quay ve trang chu.';

// ─── Props & State ───────────────────────────────────────────────────────────

interface ModuleErrorBoundaryProps {
  /** Human-readable feature name, displayed in fallback */
  featureName: string;
  /** Child components to render when no error */
  children: ReactNode;
}

interface ModuleErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * ModuleErrorBoundary — Feature-level error boundary with retry budget.
 *
 * Wraps each lazy-loaded feature module. When a chunk fails to load:
 *   1. Catches the error, logs it via structured logger
 *   2. Shows a user-friendly fallback UI with retry button (up to MAX_RETRIES)
 *   3. After exhausting retries, offers navigation to home
 *
 * Uses semantic design tokens for consistent theming.
 */
export class ModuleErrorBoundary extends Component<
  ModuleErrorBoundaryProps,
  ModuleErrorBoundaryState
> {
  override state: ModuleErrorBoundaryState = {
    hasError: false,
    error: null,
    retryCount: 0,
  };

  static getDerivedStateFromError(
    error: unknown,
  ): Partial<ModuleErrorBoundaryState> {
    return {
      hasError: true,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error(
      `[ModuleErrorBoundary] ${this.props.featureName} crashed:`,
      error,
      {
        module: 'ModuleErrorBoundary',
        action: this.props.featureName,
        stack: info.componentStack ?? undefined,
      },
    );
  }

  private handleRetry = (): void => {
    this.setState((prev) => ({
      hasError: false,
      error: null,
      retryCount: prev.retryCount + 1,
    }));
  };

  private handleGoHome = (): void => {
    window.location.href = '/';
  };

  override render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const canRetry = this.state.retryCount < MAX_RETRIES;

    return (
      <div
        role="alert"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '300px',
          padding: '2rem',
          textAlign: 'center',
          gap: '1rem',
        }}
      >
        <h2
          className="text-foreground"
          style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}
        >
          {ERROR_TITLE}
        </h2>

        <p className="text-muted" style={{ maxWidth: '400px', margin: 0 }}>
          {ERROR_DESCRIPTION}
        </p>

        <p className="text-muted" style={{ fontSize: '0.75rem', margin: 0 }}>
          Module: {this.props.featureName}
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          {canRetry ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={this.handleRetry}
            >
              {RETRY_LABEL} ({MAX_RETRIES - this.state.retryCount})
            </button>
          ) : null}

          <button
            type="button"
            className="btn btn-outline"
            onClick={this.handleGoHome}
          >
            {HOME_LABEL}
          </button>
        </div>
      </div>
    );
  }
}
