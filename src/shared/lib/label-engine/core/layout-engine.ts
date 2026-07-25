import { LayoutNode, AbsoluteNode } from '@/shared/lib/label-engine/ast/types';
import {
  wrapText,
  measureText,
} from '@/shared/lib/label-engine/utils/text-layout';

function resolveDim(
  val: number | '100%' | undefined,
  parentDim: number,
  def: number,
) {
  if (val === '100%') return parentDim;
  if (typeof val === 'number') return val;
  return def;
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

      const metrics = measureText(lines[0] || 'M', font);
      const lineHeight = metrics.lineHeight;

      let currentY = containerY;

      for (const line of lines) {
        const lineMetrics = measureText(line, font);
        let x = containerX;

        if (node.align === 'center') {
          x = containerX + (containerWidth - lineMetrics.width) / 2;
        } else if (node.align === 'right') {
          x = containerX + containerWidth - lineMetrics.width;
        }

        // baselineY represents the exact baseline for SVG/HTML rendering
        const baselineY = currentY + lineMetrics.ascent;

        result.push({
          type: 'absolute-text',
          text: line,
          x,
          y: currentY,
          baselineY,
          width: lineMetrics.width,
          height: lineMetrics.height,
          fontSize: node.fontSize,
          fontBold: node.fontBold,
          align: node.align,
          debug: 'debug' in node ? (node as { debug?: boolean }).debug : false,
        });

        currentY += lineHeight;
      }
      break;
    }

    case 'qrcode': {
      result.push({
        type: 'absolute-qrcode',
        value: node.value,
        x: containerX + (containerWidth - node.size) / 2, // Default center in cell
        y: containerY + (containerHeight - node.size) / 2,
        size: node.size,
        debug: 'debug' in node ? (node as { debug?: boolean }).debug : false,
      });
      break;
    }

    case 'rect': {
      const w = resolveDim(node.width, containerWidth, containerWidth);
      const h = resolveDim(node.height, containerHeight, containerHeight);
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
        debug: 'debug' in node ? (node as { debug?: boolean }).debug : false,
      });
      break;
    }

    case 'column':
    case 'row': {
      const isCol = node.type === 'column';
      const gap = node.gap || 0;
      const padding = node.padding || 0;
      const margin = node.margin || 0;

      const w = resolveDim(node.width, containerWidth, containerWidth);
      const h = resolveDim(node.height, containerHeight, containerHeight);

      if (node.fill || node.stroke || node.debug) {
        result.push({
          type: 'absolute-rect',
          x: containerX + margin,
          y: containerY + margin,
          width: w - margin * 2,
          height: h - margin * 2,
          fill: node.fill,
          stroke: node.stroke,
          strokeWidth: node.strokeWidth,
          rx: node.rx,
          debug: node.debug,
        });
      }

      const innerX = containerX + margin + padding;
      const innerY = containerY + margin + padding;
      const innerW = w - margin * 2 - padding * 2;
      const innerH = h - margin * 2 - padding * 2;

      let totalFlex = 0;
      let usedMainSpace = 0;
      const childSizes: { main: number; cross: number }[] = [];

      // PASS 1: Intrinsic Measurement
      for (const child of node.children) {
        if (child.flex) {
          totalFlex += child.flex;
          childSizes.push({ main: 0, cross: 0 });
        } else {
          let main = 0;
          let cross = 0;
          if (child.type === 'rect') {
            main = resolveDim(
              isCol ? child.height : child.width,
              isCol ? innerH : innerW,
              0,
            );
            cross = resolveDim(
              isCol ? child.width : child.height,
              isCol ? innerW : innerH,
              0,
            );
          } else if (child.type === 'qrcode') {
            main = child.size;
            cross = child.size;
          } else if (child.type === 'text') {
            const font = `${child.fontBold ? 'bold ' : ''}${child.fontSize}px Arial, sans-serif`;
            const lines = wrapText(
              child.text,
              child.maxWidth || (isCol ? innerW : innerW),
              font,
              child.maxLines,
            );
            let maxW = 0;
            for (const l of lines) {
              const lm = measureText(l, font);
              if (lm.width > maxW) maxW = lm.width;
            }
            const metrics = measureText(lines[0] || 'M', font);
            const totalH = lines.length * metrics.lineHeight;
            main = isCol ? totalH : maxW;
            cross = isCol ? maxW : totalH;
          } else {
            main = resolveDim(
              isCol ? child.height : child.width,
              isCol ? innerH : innerW,
              0,
            );
            cross = resolveDim(
              isCol ? child.width : child.height,
              isCol ? innerW : innerH,
              0,
            );
          }
          childSizes.push({ main, cross });
          usedMainSpace += main;
        }
      }

      const totalGaps = Math.max(0, node.children.length - 1) * gap;
      usedMainSpace += totalGaps;
      const availableMainSpace = Math.max(
        0,
        (isCol ? innerH : innerW) - usedMainSpace,
      );

      // PASS 2: Layout & Alignment
      let currentMain = isCol ? innerY : innerX;

      if (totalFlex === 0 && availableMainSpace > 0) {
        if (node.justify === 'center') {
          currentMain += availableMainSpace / 2;
        } else if (node.justify === 'flex-end') {
          currentMain += availableMainSpace;
        } else if (node.justify === 'space-evenly') {
          currentMain += availableMainSpace / (node.children.length + 1);
        }
      }

      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i]!;
        let mainSize = childSizes[i]!.main;
        const crossSize = childSizes[i]!.cross;

        if (child.flex) {
          mainSize = (child.flex / totalFlex) * availableMainSpace;
        }

        const crossSpace = (isCol ? innerW : innerH) - crossSize;
        let crossPos = isCol ? innerX : innerY;

        if (node.align === 'center') {
          crossPos += crossSpace / 2;
        } else if (node.align === 'flex-end') {
          crossPos += crossSpace;
        }

        const childX = isCol ? crossPos : currentMain;
        const childY = isCol ? currentMain : crossPos;

        const isContainer =
          child.type === 'row' ||
          child.type === 'column' ||
          child.type === 'text';
        const childW = isCol ? (isContainer ? innerW : crossSize) : mainSize;
        const childH = isCol ? mainSize : isContainer ? innerH : crossSize;

        const childNodes = computeLayout(child, childX, childY, childW, childH);
        result.push(...childNodes);

        let step = mainSize;
        if (i < node.children.length - 1) {
          step += gap;
          if (totalFlex === 0 && node.justify === 'space-between') {
            step += availableMainSpace / (node.children.length - 1);
          }
        }
        if (totalFlex === 0 && node.justify === 'space-evenly') {
          step += availableMainSpace / (node.children.length + 1);
        }

        currentMain += step;
      }
      break;
    }
  }

  return result;
}
