import React from 'react';

/**
 * Base template definition.
 */
export interface LabelTemplate<TData = unknown> {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  renderSVG: (data: TData) => Promise<string> | string;
  renderHTML?: (data: TData) => React.ReactNode;
}
