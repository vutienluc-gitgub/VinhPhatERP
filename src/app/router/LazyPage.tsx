import { Suspense, Component } from 'react';
import type { ReactNode } from 'react';

class ChunkErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  override state = { hasError: false };

  static getDerivedStateFromError(error: unknown) {
    const errorString = error instanceof Error ? error.message : String(error);
    const isChunkError =
      error instanceof Error &&
      (errorString.includes('dynamically imported') ||
        errorString.includes('Failed to fetch') ||
        errorString.includes('text/html') ||
        errorString.includes('valid JavaScript') ||
        errorString.includes('valid JavaScript MIME type') ||
        errorString.includes('Importing a module script failed') ||
        errorString.includes('importing a module script failed') ||
        errorString.includes('Load failed') ||
        errorString.includes('load failed') ||
        error.name === 'ChunkLoadError');

    return { hasError: isChunkError };
  }

  override componentDidCatch() {
    if (this.state.hasError) {
      const reloadKey = 'erp-chunk-reload';
      if (!sessionStorage.getItem(reloadKey)) {
        sessionStorage.setItem(reloadKey, '1');
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('v', Date.now().toString());
        window.location.href = currentUrl.toString();
      }
    }
  }

  override render() {
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
