import { AbsoluteNode } from '@/shared/lib/label-engine/ast/types';

// Defaults to 203 DPI (8 dots per mm)
export function renderZPL(
  nodes: AbsoluteNode[],
  widthMm: number,
  heightMm: number,
  dpi: number = 203,
): string {
  // Our AST uses an arbitrary pixel coordinate system defined by the template (e.g. 800x400 for 80x40mm)
  // Which is 10 dots/mm.
  // We need to scale AST coordinates to Printer Dots (e.g. 203 DPI = 8 dots/mm)
  // scaleX = (widthMm * dotsPerMm) / astWidth (We'll assume ast width is max X or just use a fixed scale if we can deduce astWidth).
  // Actually, we can just calculate dots/mm:
  const dotsPerMm = dpi / 25.4;
  const printerWidthDots = Math.round(widthMm * dotsPerMm);
  const printerHeightDots = Math.round(heightMm * dotsPerMm);

  // We assume the AST was built with 10 units = 1mm (as 800/80 = 10)
  const astUnitsPerMm = 10;
  const scale = dotsPerMm / astUnitsPerMm;

  let zpl = `^XA\n^PW${printerWidthDots}\n^LL${printerHeightDots}\n`;

  for (const node of nodes) {
    const x = Math.round(node.x * scale);
    const y = Math.round(node.y * scale);

    let nodeWidth = 0;
    let nodeHeight = 0;
    if (node.type === 'absolute-text' || node.type === 'absolute-rect') {
      nodeWidth = node.width;
      nodeHeight = node.height;
    } else if (node.type === 'absolute-qrcode') {
      nodeWidth = node.size;
      nodeHeight = node.size;
    }

    const w = Math.round(nodeWidth * scale);
    const h = Math.round(nodeHeight * scale);

    switch (node.type) {
      case 'absolute-text': {
        const fontSizeDots = Math.round(node.fontSize * scale);
        zpl += `^FO${x},${y}^A0N,${fontSizeDots},${Math.round(fontSizeDots * 0.7)}^FD${node.text}^FS\n`;
        break;
      }

      case 'absolute-qrcode': {
        // ZPL QR Code sizing is tricky (1-10 scale factor).
        // A scale of 4 is usually ~1 inch at 203 dpi.
        // We'll estimate based on target width.
        const targetSizeDots = Math.round(node.size * scale);
        // Base QR size is around 30x30 dots for typical payload.
        let qrScale = Math.max(1, Math.round(targetSizeDots / 33));
        if (qrScale > 10) qrScale = 10;

        // ZPL expects Field Origin at top left, but QR origin might behave differently on some printers.
        zpl += `^FO${x},${y}^BQN,2,${qrScale}^FDQA,${node.value}^FS\n`;
        break;
      }

      case 'absolute-rect': {
        const strokeWidthDots = Math.max(
          1,
          Math.round((node.strokeWidth || 1) * scale),
        );
        // ^GB width, height, thickness
        zpl += `^FO${x},${y}^GB${w},${h},${strokeWidthDots}^FS\n`;
        break;
      }
    }
  }

  zpl += `^XZ`;
  return zpl;
}
