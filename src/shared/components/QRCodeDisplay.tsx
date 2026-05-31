import { QRCodeSVG } from 'qrcode.react';

type QRCodeDisplayProps = {
  /** Data encoded in the QR code */
  value: string;
  /** Size in pixels (default: 200) */
  size?: number;
  /** Optional label shown below the QR code */
  label?: string;
};

/**
 * Renders a QR code as SVG with optional label.
 * Used for lot traceability in yarn receipts.
 */
export function QRCodeDisplay({
  value,
  size = 200,
  label,
}: QRCodeDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <QRCodeSVG
        value={value}
        size={size}
        level="M"
        includeMargin
        style={{ borderRadius: 'var(--radius-sm)' }}
      />
      {label && (
        <span className="text-xs text-muted text-center max-w-[200px] truncate">
          {label}
        </span>
      )}
    </div>
  );
}
