import { LayoutNode } from '@/shared/lib/label-engine/ast/types';

/**
 * Base template definition using AST Architecture.
 */
export interface LabelTemplate<TData = unknown> {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  widthPx: number; // e.g. 800
  heightPx: number; // e.g. 400
  buildLayout: (data: TData) => LayoutNode;
}
