import React, { Component, ReactNode } from 'react';

import { logger } from '@/shared/utils/logger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ModuleErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Module Error', error, {
      module: 'ModuleErrorBoundary',
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-200 bg-red-50 text-red-800 rounded-md">
          <p className="font-semibold mb-2">Không thể tải module.</p>
          <button
            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
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
