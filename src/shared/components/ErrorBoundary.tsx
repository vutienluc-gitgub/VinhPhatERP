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
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            padding: '2rem',
            textAlign: 'center',
            gap: '1rem',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '1.25rem',
            }}
          >
            Đã xảy ra lỗi
          </h2>
          <p
            style={{
              color: 'var(--text-muted, #666)',
              maxWidth: 420,
              lineHeight: 1.5,
            }}
          >
            Ứng dụng gặp lỗi không mong muốn. Bạn có thể thử tải lại trang hoặc
            quay về trang chủ.
          </p>
          {this.state.error && (
            <pre
              style={{
                fontSize: '0.8rem',
                background: 'var(--surface-strong, #f4f4f4)',
                padding: '0.75rem 1rem',
                borderRadius: '6px',
                maxWidth: '100%',
                overflow: 'auto',
                color: '#c0392b',
              }}
            >
              {this.state.error.message}
            </pre>
          )}
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
            }}
          >
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
