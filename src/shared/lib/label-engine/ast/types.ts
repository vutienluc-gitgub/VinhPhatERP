// 1. Layout Node Types (Input to Layout Engine)
export type TextLayoutNode = {
  type: 'text';
  text: string;
  fontSize: number;
  fontBold?: boolean;
  maxWidth?: number; // For wrapping
  maxLines?: number;
  align?: 'left' | 'center' | 'right'; // Defaults to left
};

export type QrLayoutNode = {
  type: 'qrcode';
  value: string;
  size: number;
};

export type RectLayoutNode = {
  type: 'rect';
  width: number | '100%'; // '100%' means full width of parent
  height: number | '100%'; // '100%' means full height of parent
  strokeWidth?: number;
  rx?: number;
  fill?: string;
  stroke?: string;
};

// Simplified Flexbox Containers
export type ColumnLayoutNode = {
  type: 'column';
  gap?: number;
  padding?: number;
  children: LayoutNode[];
  width?: number | '100%';
  height?: number | '100%';
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  rx?: number;
};

export type RowLayoutNode = {
  type: 'row';
  gap?: number;
  padding?: number;
  alignItems?: 'flex-start' | 'center' | 'flex-end'; // Defaults to flex-start
  children: LayoutNode[];
  width?: number | '100%';
  height?: number | '100%';
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  rx?: number;
};

export type LayoutNode =
  | TextLayoutNode
  | QrLayoutNode
  | RectLayoutNode
  | ColumnLayoutNode
  | RowLayoutNode;

// 2. Absolute Node Types (Output from Layout Engine, Input to Renderers)
export type AbsoluteTextNode = {
  type: 'absolute-text';
  text: string;
  x: number;
  y: number; // Top-Left Y coordinate
  width: number;
  height: number;
  fontSize: number;
  fontBold?: boolean;
  align?: 'left' | 'center' | 'right';
};

export type AbsoluteQrNode = {
  type: 'absolute-qrcode';
  value: string;
  x: number;
  y: number;
  size: number;
};

export type AbsoluteRectNode = {
  type: 'absolute-rect';
  x: number;
  y: number;
  width: number;
  height: number;
  strokeWidth?: number;
  rx?: number;
  fill?: string;
  stroke?: string;
};

export type AbsoluteNode = AbsoluteTextNode | AbsoluteQrNode | AbsoluteRectNode;
