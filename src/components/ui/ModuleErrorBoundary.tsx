import React, { Component, ReactNode } from 'react';

import { logger } from '@/shared/utils/logger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ModuleErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Module Error', error, {
      module: 'ModuleErrorBoundary',
      componentStack: errorInfo.componentStack,
    });
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-danger bg-red-50 text-danger rounded-md">
          <p className="font-semibold mb-2">Không thể tải module.</p>
          <button
            className="px-3 py-1 bg-danger-soft text-inverse-foreground rounded text-sm hover:bg-danger-soft"
            onClick={() => this.setState({ hasError: false })}
          >
            Thử lại
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
