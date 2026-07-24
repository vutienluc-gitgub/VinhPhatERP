import { renderZPL } from '@/shared/lib/label-engine/renderers/zpl-renderer';
import { renderSVG } from '@/shared/lib/label-engine/renderers/svg-renderer';

import { LabelRegistry } from './registry';
import { computeLayout } from './layout-engine';

export class LabelEngine {
  static exportZPL(templateId: string, data: unknown, dpi?: number): string {
    const tpl = LabelRegistry.get(templateId);
    const layoutTree = tpl.buildLayout(data);
    const absoluteNodes = computeLayout(
      layoutTree,
      0,
      0,
      tpl.widthPx,
      tpl.heightPx,
    );
    return renderZPL(absoluteNodes, tpl.widthMm, tpl.heightMm, dpi);
  }

  static async exportSVG(templateId: string, data: unknown): Promise<string> {
    const tpl = LabelRegistry.get(templateId);
    const layoutTree = tpl.buildLayout(data);
    const absoluteNodes = computeLayout(
      layoutTree,
      0,
      0,
      tpl.widthPx,
      tpl.heightPx,
    );
    return await renderSVG(absoluteNodes, tpl.widthPx, tpl.heightPx);
  }
}
