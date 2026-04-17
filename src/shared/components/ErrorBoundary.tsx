import { Component, type ErrorInfo, type PropsWithChildren } from 'react';

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

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center gap-4">
          <h2 className="m-0 text-xl">Đã xảy ra lỗi</h2>
          <p className="text-[var(--text-muted,#666)] max-w-[420px] leading-relaxed">
            Ứng dụng gặp lỗi không mong muốn. Bạn có thể thử tải lại trang hoặc
            quay về trang chủ.
          </p>
          {this.state.error && (
            <pre className="text-[0.8rem] bg-[var(--surface-strong,#f4f4f4)] py-3 px-4 rounded-md max-w-full overflow-auto text-[#c0392b]">
              {this.state.error.message}
            </pre>
          )}
          <div className="flex gap-3">
            <button
              className="secondary-button"
              type="button"
              onClick={this.handleReset}
            >
              Thử lại
            </button>
            <button
              className="primary-button"
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
