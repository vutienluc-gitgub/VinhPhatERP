import { LayoutNode, AbsoluteNode } from '@/shared/lib/label-engine/ast/types';
import {
  wrapText,
  measureTextWidth,
} from '@/shared/lib/label-engine/utils/text-layout';

// Helper to resolve '100%' or numbers
function resolveDimension(
  value: number | '100%' | undefined,
  parentDimension: number,
  defaultValue: number,
): number {
  if (value === '100%') return parentDimension;
  if (typeof value === 'number') return value;
  return defaultValue;
}

export function computeLayout(
  node: LayoutNode,
  containerX: number,
  containerY: number,
  containerWidth: number,
  containerHeight: number,
): AbsoluteNode[] {
  const result: AbsoluteNode[] = [];

  switch (node.type) {
    case 'text': {
      const font = `${node.fontBold ? 'bold ' : ''}${node.fontSize}px Arial, sans-serif`;
      const maxWidth = node.maxWidth || containerWidth;
      const lines = wrapText(node.text, maxWidth, font, node.maxLines);

      let currentY = containerY;
      const lineHeight = node.fontSize * 1.2; // Approximate line height

      for (const line of lines) {
        const textWidth = measureTextWidth(line, font);
        let x = containerX;

        if (node.align === 'center') {
          x = containerX + (containerWidth - textWidth) / 2;
        } else if (node.align === 'right') {
          x = containerX + containerWidth - textWidth;
        }

        result.push({
          type: 'absolute-text',
          text: line,
          x,
          y: currentY,
          width: textWidth,
          height: node.fontSize,
          fontSize: node.fontSize,
          fontBold: node.fontBold,
          align: node.align,
        });

        currentY += lineHeight;
      }
      break;
    }

    case 'qrcode': {
      result.push({
        type: 'absolute-qrcode',
        value: node.value,
        x: containerX,
        y: containerY,
        size: node.size,
      });
      break;
    }

    case 'rect': {
      const w = resolveDimension(node.width, containerWidth, containerWidth);
      const h = resolveDimension(node.height, containerHeight, containerHeight);
      result.push({
        type: 'absolute-rect',
        x: containerX,
        y: containerY,
        width: w,
        height: h,
        strokeWidth: node.strokeWidth,
        rx: node.rx,
        fill: node.fill,
        stroke: node.stroke,
      });
      break;
    }

    case 'column': {
      const padding = node.padding || 0;
      const gap = node.gap || 0;
      const w = resolveDimension(node.width, containerWidth, containerWidth);
      const h = resolveDimension(node.height, containerHeight, containerHeight);

      if (node.fill || node.stroke) {
        result.push({
          type: 'absolute-rect',
          x: containerX,
          y: containerY,
          width: w,
          height: h,
          fill: node.fill,
          stroke: node.stroke,
          strokeWidth: node.strokeWidth,
          rx: node.rx,
        });
      }

      let currentY = containerY + padding;
      const innerX = containerX + padding;
      const innerW = w - padding * 2;

      for (const child of node.children) {
        // We need to know the height of the child to increment currentY.
        // For text, it's (lines * fontSize * 1.2).
        // For QR, it's size.
        // This is a simplistic layout engine, so we'll compute it by doing a dry run or estimating.
        let childHeight = 0;
        if (child.type === 'qrcode') childHeight = child.size;
        else if (child.type === 'rect')
          childHeight = resolveDimension(child.height, h, 0);
        else if (child.type === 'text') {
          const font = `${child.fontBold ? 'bold ' : ''}${child.fontSize}px Arial, sans-serif`;
          const lines = wrapText(
            child.text,
            child.maxWidth || innerW,
            font,
            child.maxLines,
          );
          childHeight = lines.length * child.fontSize * 1.2;
        } else if (child.type === 'row' || child.type === 'column') {
          // We don't support deep nested dynamic height perfectly yet without a 2-pass layout,
          // but we can just resolve its height if it's explicitly set.
          childHeight = resolveDimension(child.height, h, 0);
        }

        const childNodes = computeLayout(
          child,
          innerX,
          currentY,
          innerW,
          childHeight,
        );
        result.push(...childNodes);

        currentY += childHeight + gap;
      }
      break;
    }

    case 'row': {
      const padding = node.padding || 0;
      const gap = node.gap || 0;
      const w = resolveDimension(node.width, containerWidth, containerWidth);
      const h = resolveDimension(node.height, containerHeight, containerHeight);

      if (node.fill || node.stroke) {
        result.push({
          type: 'absolute-rect',
          x: containerX,
          y: containerY,
          width: w,
          height: h,
          fill: node.fill,
          stroke: node.stroke,
          strokeWidth: node.strokeWidth,
          rx: node.rx,
        });
      }

      let currentX = containerX + padding;
      const innerY = containerY + padding;
      const innerH = h - padding * 2;

      for (const child of node.children) {
        let childWidth = 0;
        if (child.type === 'qrcode') childWidth = child.size;
        else if (child.type === 'rect')
          childWidth = resolveDimension(child.width, w, 0);
        else if (child.type === 'text') {
          const font = `${child.fontBold ? 'bold ' : ''}${child.fontSize}px Arial, sans-serif`;
          const lines = wrapText(
            child.text,
            child.maxWidth || w,
            font,
            child.maxLines,
          );
          // Width is the max line width
          let maxW = 0;
          for (const l of lines) {
            const lw = measureTextWidth(l, font);
            if (lw > maxW) maxW = lw;
          }
          childWidth = maxW;
        } else if (child.type === 'row' || child.type === 'column') {
          childWidth = resolveDimension(child.width, w, 0);
        }

        const childNodes = computeLayout(
          child,
          currentX,
          innerY,
          childWidth,
          innerH,
        );
        result.push(...childNodes);

        currentX += childWidth + gap;
      }
      break;
    }
  }

  return result;
}
