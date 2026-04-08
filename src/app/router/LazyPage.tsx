import { Suspense, Component } from 'react';
import type { ReactNode } from 'react';

class ChunkErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError(error: unknown) {
    const errorString = error instanceof Error ? error.message : String(error);
    const isChunkError =
      error instanceof Error &&
      (errorString.includes('dynamically imported') ||
        errorString.includes('Failed to fetch') ||
        errorString.includes('text/html') ||
        errorString.includes('valid JavaScript') ||
        errorString.includes('valid JavaScript MIME type') ||
        error.name === 'ChunkLoadError');

    return { hasError: isChunkError };
  }

  componentDidCatch() {
    if (this.state.hasError) {
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      return <div className="table-empty">Đang tải lại...</div>;
    }
    return this.props.children;
  }
}

export function LazyPage({ children }: { children: ReactNode }) {
  return (
    <ChunkErrorBoundary>
      <Suspense fallback={<div className="table-empty">Đang tải...</div>}>
        {children}
      </Suspense>
    </ChunkErrorBoundary>
  );
}
