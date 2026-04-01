import { Suspense, Component } from 'react'
import type { ReactNode } from 'react'

class ChunkErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }

  static getDerivedStateFromError(error: unknown) {
    const isChunkError =
      error instanceof Error &&
      (error.message.includes('dynamically imported') ||
        error.message.includes('Failed to fetch') ||
        error.name === 'ChunkLoadError')
    return { hasError: isChunkError }
  }

  componentDidCatch() {
    if (this.state.hasError) {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      return <div className="table-empty">Đang tải lại...</div>
    }
    return this.props.children
  }
}

export function LazyPage({ children }: { children: ReactNode }) {
  return (
    <ChunkErrorBoundary>
      <Suspense fallback={<div className="table-empty">Đang tải...</div>}>{children}</Suspense>
    </ChunkErrorBoundary>
  )
}
