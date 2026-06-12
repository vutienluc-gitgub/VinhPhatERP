import { useRef, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

import { Button } from '@/shared/components';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { QRCodeDisplay } from '@/shared/components/QRCodeDisplay';
import { buildQRPayload } from '@/shared/lib/identifier.service';
import { openPrintWindow } from '@/shared/lib/print-template.engine';
import { SAMPLE_TAG_CSS } from '@/shared/lib/print-template.css';
import type { FabricCatalog } from '@/features/fabric-catalog/types';

/* ── Constants ── */

const LABELS = {
  title: 'In Tem Mẫu Vải',
  composition: 'Thành phần',
  specs: 'Quy cách (chuẩn)',
  unit: 'Đơn vị',
  print: 'In Tem',
  download: 'Tải Ảnh',
  close: 'Đóng',
  scanHint: 'Quét mã để xem chi tiết trên ERP',
  printTitlePrefix: 'Tem Mẫu - ',
  downloadPrefix: 'Tem_Mau_',
  downloadError: 'Lỗi khi tải ảnh tem mẫu.',
  noValue: '—',
} as const;

/* ── Canvas drawing config ── */

const TAG_WIDTH = 400;
const TAG_PADDING = 32;
const QR_SIZE = 150;
const FONT_FAMILY = 'Arial, sans-serif';
const CANVAS_SCALE = 2;

/** Canvas color palette — mirrors design tokens for offline rendering */
const CANVAS_COLORS = {
  background: '#ffffff',
  border: '#e2e8f0',
  textPrimary: '#1a202c',
  textAccent: '#2563eb',
  textMuted: '#475569',
  textHint: '#94a3b8',
  detailBg: '#f8fafc',
} as const;

/* ── Helpers ── */

/** Formats width/gsm specs into a single display string. Returns null if no specs. */
function formatSpecs(
  widthCm: number | null | undefined,
  gsm: number | null | undefined,
): string | null {
  if (!widthCm && !gsm) return null;
  const widthStr = widthCm ? `${widthCm}cm` : '';
  const gsmStr = gsm ? `${gsm}gsm` : '';
  const sep = widthStr && gsmStr ? ' - ' : '';
  return `${widthStr}${sep}${gsmStr}`;
}

/**
 * Draws the sample tag onto a canvas and returns it.
 * Uses native Canvas API — no html2canvas dependency.
 */
function drawTagToCanvas(
  catalog: FabricCatalog,
  qrCanvasEl: HTMLCanvasElement | null,
): HTMLCanvasElement | null {
  if (!qrCanvasEl) return null;

  const w = TAG_WIDTH * CANVAS_SCALE;
  const pad = TAG_PADDING * CANVAS_SCALE;
  const contentW = w - pad * 2;

  // Pre-calculate text lines
  const detailLines: string[] = [
    `${LABELS.composition}: ${catalog.composition || LABELS.noValue}`,
  ];
  const specsStr = formatSpecs(catalog.target_width_cm, catalog.target_gsm);
  if (specsStr) {
    detailLines.push(`${LABELS.specs}: ${specsStr}`);
  }
  detailLines.push(`${LABELS.unit}: ${catalog.unit}`);

  // Layout dimensions
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

  // Background
  ctx.fillStyle = CANVAS_COLORS.background;
  ctx.fillRect(0, 0, w, totalH);

  // Border
  ctx.strokeStyle = CANVAS_COLORS.border;
  ctx.lineWidth = 2 * CANVAS_SCALE;
  ctx.roundRect(4, 4, w - 8, totalH - 8, 12 * CANVAS_SCALE);
  ctx.stroke();

  let y = pad;

  // Name
  ctx.fillStyle = CANVAS_COLORS.textPrimary;
  ctx.font = `bold ${18 * CANVAS_SCALE}px ${FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.fillText(catalog.name, w / 2, y + 18 * CANVAS_SCALE, contentW);
  y += nameH;

  // Code
  ctx.fillStyle = CANVAS_COLORS.textAccent;
  ctx.font = `600 ${15 * CANVAS_SCALE}px ${FONT_FAMILY}`;
  ctx.fillText(catalog.code, w / 2, y + 15 * CANVAS_SCALE, contentW);
  y += codeH + gapAfterCode;

  // Detail block background
  const detailX = pad;
  const detailW = contentW;
  ctx.fillStyle = CANVAS_COLORS.detailBg;
  ctx.beginPath();
  ctx.roundRect(detailX, y, detailW, detailBlockH, 8 * CANVAS_SCALE);
  ctx.fill();

  // Detail text
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

  // QR Code — draw from the existing canvas element
  const qrDrawSize = QR_SIZE * CANVAS_SCALE;
  const qrX = (w - qrDrawSize) / 2;
  ctx.drawImage(qrCanvasEl, qrX, y, qrDrawSize, qrDrawSize);
  y += qrDrawSize + gapAfterQr;

  // Scan hint
  ctx.fillStyle = CANVAS_COLORS.textHint;
  ctx.font = `${10 * CANVAS_SCALE}px ${FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.fillText(LABELS.scanHint, w / 2, y + 10 * CANVAS_SCALE, contentW);

  return canvas;
}

/* ── Component ── */

type FabricSampleQRModalProps = {
  catalog: FabricCatalog;
  onClose: () => void;
};

export function FabricSampleQRModal({
  catalog,
  onClose,
}: FabricSampleQRModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);
  const qrWrapperRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handlePrint = () => {
    openPrintWindow(printAreaRef.current, {
      title: `${LABELS.printTitlePrefix}${catalog.code}`,
      css: SAMPLE_TAG_CSS,
    });
  };

  const handleDownload = useCallback(async () => {
    try {
      setIsDownloading(true);

      const qrCanvasEl = qrWrapperRef.current?.querySelector('canvas');
      const tagCanvas = drawTagToCanvas(catalog, qrCanvasEl ?? null);

      if (!tagCanvas) {
        toast.error(LABELS.downloadError);
        return;
      }

      const dataUrl = tagCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${LABELS.downloadPrefix}${catalog.code}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      toast.error(LABELS.downloadError);
      console.error('[DownloadImageError]', err);
    } finally {
      setIsDownloading(false);
    }
  }, [catalog]);

  const qrData = buildQRPayload('fabric_catalog', catalog.slug || catalog.id, {
    code: catalog.code,
    name: catalog.name,
  });

  const specsDisplay = formatSpecs(catalog.target_width_cm, catalog.target_gsm);

  return (
    <AdaptiveSheet
      open={true}
      onClose={onClose}
      title={`${LABELS.title} — ${catalog.code}`}
      maxWidth={400}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            {LABELS.close}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={handleDownload}
              leftIcon="Download"
              isLoading={isDownloading}
            >
              {LABELS.download}
            </Button>
            <Button
              variant="primary"
              type="button"
              onClick={handlePrint}
              leftIcon="Printer"
            >
              {LABELS.print}
            </Button>
          </div>
        </>
      }
    >
      <div ref={printAreaRef} className="flex flex-col items-center">
        {!catalog.is_public && (
          <div className="w-full mb-4 p-3 bg-warning-50 text-warning-900 border border-warning-200 rounded-md text-sm text-center">
            ⚠️ Mẫu vải này <b>chưa được bật Công khai</b>. Khách hàng quét mã QR
            sẽ không xem được.
          </div>
        )}
        <div className="sample-tag w-full p-4 border border-border rounded-lg bg-white shadow-sm flex flex-col items-center">
          <div className="text-lg font-bold tag-header">{catalog.name}</div>
          <div className="text-primary font-semibold text-base mb-3 tag-code">
            {catalog.code}
          </div>

          <div className="w-full text-left bg-surface/50 p-3 rounded-md mb-4 flex flex-col gap-1">
            <div className="text-sm tag-detail">
              <span className="text-muted mr-1">{LABELS.composition}:</span>
              <span className="font-medium">
                {catalog.composition || LABELS.noValue}
              </span>
            </div>
            {specsDisplay && (
              <div className="text-sm tag-detail">
                <span className="text-muted mr-1">{LABELS.specs}:</span>
                <span className="font-medium">{specsDisplay}</span>
              </div>
            )}
            <div className="text-sm tag-detail">
              <span className="text-muted mr-1">{LABELS.unit}:</span>
              <span className="font-medium">{catalog.unit}</span>
            </div>
          </div>

          <div
            ref={qrWrapperRef}
            className="qr-wrapper flex justify-center p-2 bg-white rounded"
          >
            <QRCodeDisplay value={qrData} size={QR_SIZE} />
          </div>
          <div className="text-[10px] text-muted mt-2">{LABELS.scanHint}</div>
        </div>
      </div>
    </AdaptiveSheet>
  );
}
