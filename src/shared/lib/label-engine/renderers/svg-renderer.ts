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
    switch (node.type) {
      case 'absolute-text': {
        const weight = node.fontBold ? 'bold' : 'normal';
        // Y in AST is Top-Left, SVG text Y is baseline. Shift by font size (approx 80-90%).
        const baselineY = node.y + node.fontSize * 0.9;

        // Alignment handling
        let anchor = 'start';
        if (node.align === 'center') anchor = 'middle';
        else if (node.align === 'right') anchor = 'end';

        content += `  <text x="${node.x}" y="${baselineY}" text-anchor="${anchor}" style="font: ${weight} ${node.fontSize}px Arial, sans-serif; fill: #000;">${escapeHtml(node.text)}</text>\n`;
        break;
      }

      case 'absolute-rect': {
        const fill = node.fill || 'none';
        const stroke = node.stroke || 'none';
        const strokeWidth = node.strokeWidth || 0;
        const rx = node.rx || 0;
        content += `  <rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" rx="${rx}" />\n`;
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
