import { Component, type ErrorInfo, type PropsWithChildren } from 'react';

import { logger } from '@/shared/utils/logger';

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<
  PropsWithChildren,
  ErrorBoundaryState
> {
  constructor(props: PropsWithChildren) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    const isChunkLoadError =
      error.name === 'ChunkLoadError' ||
      error.message.includes('Failed to fetch dynamically imported module') ||
      error.message.includes('Importing a module script failed') ||
      error.message.includes('is not a valid JavaScript MIME type');

    if (isChunkLoadError) {
      const lastReload = sessionStorage.getItem('erp_chunk_error_reload');
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        sessionStorage.setItem('erp_chunk_error_reload', now.toString());
        window.location.reload();
        return;
      }
    }

    logger.error('Global React Error', error, {
      module: 'ErrorBoundary',
      componentStack: info.componentStack,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  override render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center gap-4">
          <h2 className="m-0 text-xl">Đã xảy ra lỗi</h2>
          <p className="text-[var(--text-muted,#666)] max-w-[420px] leading-relaxed">
            Ứng dụng gặp lỗi không mong muốn. Bạn có thể thử tải lại trang hoặc
            quay về trang chủ.
          </p>
          {this.state.error && (
            <pre className="text-[0.8rem] bg-[var(--surface-strong,#f4f4f4)] py-3 px-4 rounded-md max-w-full overflow-auto text-[var(--color-danger,#ef4444)]">
              {this.state.error.message}
            </pre>
          )}
          <div className="flex gap-3 mt-2">
            <button
              className="btn btn-outline"
              type="button"
              onClick={this.handleReset}
            >
              Thử lại
            </button>
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => {
                window.location.href = '/';
              }}
            >
              Về trang chủ
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
