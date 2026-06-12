import type { FabricCatalog } from '@/features/fabric-catalog/types';

export const LABELS_PRINT = {
  composition: 'Thành phần',
  specs: 'Quy cách (chuẩn)',
  unit: 'Đơn vị',
  scanHint: 'Quét mã để xem chi tiết trên ERP',
  noValue: '—',
} as const;

const TAG_WIDTH = 400;
const TAG_PADDING = 32;
const QR_SIZE = 150;
const FONT_FAMILY = 'Arial, sans-serif';
const CANVAS_SCALE = 2;

const CANVAS_COLORS = {
  background: '#ffffff',
  border: '#e2e8f0',
  textPrimary: '#1a202c',
  textAccent: '#2563eb',
  textMuted: '#475569',
  textHint: '#94a3b8',
  detailBg: '#f8fafc',
} as const;

export function formatSpecs(
  widthCm: number | null | undefined,
  gsm: number | null | undefined,
): string | null {
  if (!widthCm && !gsm) return null;
  const widthStr = widthCm ? `${widthCm}cm` : '';
  const gsmStr = gsm ? `${gsm}gsm` : '';
  const sep = widthStr && gsmStr ? ' - ' : '';
  return `${widthStr}${sep}${gsmStr}`;
}

export function drawTagToCanvas(
  catalog: FabricCatalog,
  qrCanvasEl: HTMLCanvasElement | null,
): HTMLCanvasElement | null {
  if (!qrCanvasEl) return null;

  const w = TAG_WIDTH * CANVAS_SCALE;
  const pad = TAG_PADDING * CANVAS_SCALE;
  const contentW = w - pad * 2;

  const detailLines: string[] = [
    `${LABELS_PRINT.composition}: ${catalog.composition || LABELS_PRINT.noValue}`,
  ];
  const specsStr = formatSpecs(catalog.target_width_cm, catalog.target_gsm);
  if (specsStr) {
    detailLines.push(`${LABELS_PRINT.specs}: ${specsStr}`);
  }
  detailLines.push(`${LABELS_PRINT.unit}: ${catalog.unit}`);

  const nameH = 28 * CANVAS_SCALE;
  const codeH = 22 * CANVAS_SCALE;
  const gapAfterCode = 16 * CANVAS_SCALE;
  const detailLineH = 20 * CANVAS_SCALE;
  const detailBlockPad = 12 * CANVAS_SCALE;
  const detailBlockH = detailBlockPad * 2 + detailLines.length * detailLineH;
  const gapAfterDetail = 16 * CANVAS_SCALE;
  const qrH = QR_SIZE * CANVAS_SCALE;
  const hintH = 16 * CANVAS_SCALE;
  const bottomPad = 12 * CANVAS_SCALE;
  const gapAfterQr = 8 * CANVAS_SCALE;

  const totalH =
    pad +
    nameH +
    codeH +
    gapAfterCode +
    detailBlockH +
    gapAfterDetail +
    qrH +
    gapAfterQr +
    hintH +
    bottomPad +
    pad;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = totalH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = CANVAS_COLORS.background;
  ctx.fillRect(0, 0, w, totalH);

  ctx.strokeStyle = CANVAS_COLORS.border;
  ctx.lineWidth = 2 * CANVAS_SCALE;
  ctx.roundRect(4, 4, w - 8, totalH - 8, 12 * CANVAS_SCALE);
  ctx.stroke();

  let y = pad;

  ctx.fillStyle = CANVAS_COLORS.textPrimary;
  ctx.font = `bold ${18 * CANVAS_SCALE}px ${FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.fillText(catalog.name, w / 2, y + 18 * CANVAS_SCALE, contentW);
  y += nameH;

  ctx.fillStyle = CANVAS_COLORS.textAccent;
  ctx.font = `600 ${15 * CANVAS_SCALE}px ${FONT_FAMILY}`;
  ctx.fillText(catalog.code, w / 2, y + 15 * CANVAS_SCALE, contentW);
  y += codeH + gapAfterCode;

  const detailX = pad;
  const detailW = contentW;
  ctx.fillStyle = CANVAS_COLORS.detailBg;
  ctx.beginPath();
  ctx.roundRect(detailX, y, detailW, detailBlockH, 8 * CANVAS_SCALE);
  ctx.fill();

  ctx.fillStyle = CANVAS_COLORS.textMuted;
  ctx.font = `${13 * CANVAS_SCALE}px ${FONT_FAMILY}`;
  ctx.textAlign = 'left';
  let detailY = y + detailBlockPad + 13 * CANVAS_SCALE;
  for (const line of detailLines) {
    ctx.fillText(
      line,
      detailX + detailBlockPad,
      detailY,
      detailW - detailBlockPad * 2,
    );
    detailY += detailLineH;
  }
  y += detailBlockH + gapAfterDetail;

  const qrDrawSize = QR_SIZE * CANVAS_SCALE;
  const qrX = (w - qrDrawSize) / 2;
  ctx.drawImage(qrCanvasEl, qrX, y, qrDrawSize, qrDrawSize);
  y += qrDrawSize + gapAfterQr;

  ctx.fillStyle = CANVAS_COLORS.textHint;
  ctx.font = `${10 * CANVAS_SCALE}px ${FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.fillText(LABELS_PRINT.scanHint, w / 2, y + 10 * CANVAS_SCALE, contentW);

  return canvas;
}
