// 1. Layout Node Types (Input to Layout Engine)

export type FlexAlign = 'flex-start' | 'center' | 'flex-end';
export type FlexJustify = FlexAlign | 'space-between' | 'space-evenly';

export type BaseLayoutNode = {
  flex?: number;
  margin?: number;
};

export type TextLayoutNode = BaseLayoutNode & {
  type: 'text';
  text: string;
  fontSize: number;
  fontBold?: boolean;
  maxWidth?: number; // For wrapping
  maxLines?: number;
  align?: 'left' | 'center' | 'right'; // Horizontal text alignment
};

export type QrLayoutNode = BaseLayoutNode & {
  type: 'qrcode';
  value: string;
  size: number;
};

export type RectLayoutNode = BaseLayoutNode & {
  type: 'rect';
  width: number | '100%'; // '100%' means full width of parent
  height: number | '100%'; // '100%' means full height of parent
  strokeWidth?: number;
  rx?: number;
  fill?: string;
  stroke?: string;
};

// Simplified Flexbox Containers
export type FlexContainerProps = BaseLayoutNode & {
  gap?: number;
  padding?: number;
  justify?: FlexJustify;
  align?: FlexAlign;
  children: LayoutNode[];
  width?: number | '100%';
  height?: number | '100%';
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  rx?: number;
  debug?: boolean; // Visual debug outline
};

export type ColumnLayoutNode = FlexContainerProps & {
  type: 'column';
};

export type RowLayoutNode = FlexContainerProps & {
  type: 'row';
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
  baselineY: number; // Exact baseline Y coordinate for perfect alignment
  width: number;
  height: number;
  fontSize: number;
  fontBold?: boolean;
  align?: 'left' | 'center' | 'right';
  debug?: boolean;
};

export type AbsoluteQrNode = {
  type: 'absolute-qrcode';
  value: string;
  x: number;
  y: number;
  size: number;
  debug?: boolean;
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
  debug?: boolean; // Outline container in red if true
};

export type AbsoluteNode = AbsoluteTextNode | AbsoluteQrNode | AbsoluteRectNode;
