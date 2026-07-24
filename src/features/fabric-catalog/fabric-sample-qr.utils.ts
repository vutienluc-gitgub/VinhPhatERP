import type { FabricCatalog } from '@/features/fabric-catalog/types';

export const LABELS_PRINT = {
  composition: 'Thành phần',
  specs: 'Quy cách (chuẩn)',
  unit: 'Đơn vị',
  scanHint: 'Quét mã để xem chi tiết trên ERP',
  noValue: '—',
} as const;

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (let n = 0; n < words.length; n++) {
    const testLine = currentLine + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      lines.push(currentLine.trim());
      currentLine = words[n] + ' ';
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine.trim());
  return lines;
}

/**
 * @deprecated Use mapCatalogToFabricLabel in @/features/fabric-catalog/label/mapper instead.
 */
export function buildFabricLabelSpecs(
  catalog: Pick<
    FabricCatalog,
    'code' | 'name' | 'composition' | 'target_width_cm' | 'target_gsm'
  >,
) {
  const specsParts = [];
  if (catalog.composition) specsParts.push(catalog.composition);
  if (catalog.target_width_cm) specsParts.push(`${catalog.target_width_cm}cm`);
  if (catalog.target_gsm) specsParts.push(`${catalog.target_gsm} GSM`);
  const specs = specsParts.join(' • ');

  return {
    code: catalog.code || 'N/A',
    name: catalog.name || 'N/A',
    specs,
    footer: 'Scan for Details',
  };
}

/**
 * @deprecated Use Label Engine via LabelRegistry instead. Kept for fallback purposes.
 */
export function drawTagToCanvas(
  catalog: FabricCatalog,
  qrCanvasEl: HTMLCanvasElement | null,
): HTMLCanvasElement | null {
  if (!qrCanvasEl) return null;

  const w = 800;
  const h = 400;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  // Border
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(8, 8, w - 16, h - 16, 16);
  ctx.stroke();

  // Draw QR Code
  const qrSize = 250;
  const qrX = 15;
  const qrY = 75;
  ctx.drawImage(qrCanvasEl, qrX, qrY, qrSize, qrSize);

  // Right side coordinates
  const rightX = 295;
  const rightW = w - rightX - 25;

  const labelData = buildFabricLabelSpecs(catalog);

  // Draw Code
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 38px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(labelData.code, rightX, 70);

  // Draw Name (up to 2 lines)
  ctx.fillStyle = '#333333';
  ctx.font = '24px Arial, sans-serif';

  const nameLines = wrapText(ctx, labelData.name, rightW);
  let nameY = 120;
  const lineH = 32;
  const maxLines = 2;
  for (let i = 0; i < Math.min(nameLines.length, maxLines); i++) {
    let lineText = nameLines[i] || '';
    if (i === maxLines - 1 && nameLines.length > maxLines) {
      lineText += '...';
    }
    ctx.fillText(lineText, rightX, nameY);
    nameY += lineH;
  }

  // Draw Specs
  if (labelData.specs) {
    ctx.fillStyle = '#444444';
    ctx.font = '20px Arial, sans-serif';
    ctx.fillText(labelData.specs, rightX, nameY + 5);
  }

  // Draw Scan For Details
  ctx.fillStyle = '#666666';
  ctx.font = 'bold 18px Arial, sans-serif';
  ctx.fillText(labelData.footer, rightX, 305);

  return canvas;
}
