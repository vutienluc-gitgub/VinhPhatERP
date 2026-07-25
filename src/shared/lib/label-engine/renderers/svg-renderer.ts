import { AbsoluteNode } from '@/shared/lib/label-engine/ast/types';
import { generateQRCodeSvg } from '@/shared/lib/label-engine/generators/qrcode';

export async function renderSVG(
  nodes: AbsoluteNode[],
  widthPx: number,
  heightPx: number,
): Promise<string> {
  let content = '';

  const escapeHtml = (unsafe: string) => {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  for (const node of nodes) {
    if (node.debug) {
      if (node.type === 'absolute-text') {
        content += `  <rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" fill="rgba(255,0,0,0.05)" stroke="red" stroke-width="1" stroke-dasharray="2,2" />\n`;
        content += `  <line x1="${node.x}" y1="${node.baselineY}" x2="${node.x + node.width}" y2="${node.baselineY}" stroke="blue" stroke-width="1" />\n`;
      } else if (node.type === 'absolute-qrcode') {
        content += `  <rect x="${node.x}" y="${node.y}" width="${node.size}" height="${node.size}" fill="rgba(255,0,0,0.05)" stroke="red" stroke-width="1" stroke-dasharray="2,2" />\n`;
      } else if (node.type === 'absolute-rect') {
        content += `  <rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" fill="none" stroke="red" stroke-width="1" stroke-dasharray="2,2" />\n`;
      }
    }

    switch (node.type) {
      case 'absolute-text': {
        const weight = node.fontBold ? 'bold' : 'normal';
        // X is already calculated as the top-left boundary of the text block by layout-engine
        content += `  <text x="${node.x}" y="${node.baselineY}" text-anchor="start" style="font: ${weight} ${node.fontSize}px Arial, sans-serif; fill: #000;">${escapeHtml(node.text)}</text>\n`;
        break;
      }

      case 'absolute-rect': {
        const fill = node.fill && node.fill !== 'none' ? node.fill : 'none';
        const stroke =
          node.stroke && node.stroke !== 'none' ? node.stroke : 'none';
        const strokeWidth = node.strokeWidth || 0;
        const rx = node.rx || 0;
        if (fill !== 'none' || stroke !== 'none') {
          content += `  <rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" rx="${rx}" />\n`;
        }
        break;
      }

      case 'absolute-qrcode': {
        const qrSvgStr = await generateQRCodeSvg(node.value, node.size);
        const placed = qrSvgStr.replace(
          '<svg ',
          `<svg x="${node.x}" y="${node.y}" `,
        );
        content += placed + '\n';
        break;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${widthPx}" height="${heightPx}" viewBox="0 0 ${widthPx} ${heightPx}">\n${content}</svg>`;
}
