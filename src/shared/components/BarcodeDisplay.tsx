import { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';

type BarcodeDisplayProps = {
  /** Data encoded in the barcode */
  value: string;
  /** Width of a single bar (default: 2) */
  width?: number;
  /** Height of the barcode (default: 80) */
  height?: number;
  /** Optional format (default: CODE128) */
  format?: string;
  /** Display value text below barcode (default: true) */
  displayValue?: boolean;
};

/**
 * Renders a barcode as SVG.
 * Used for lot traceability in warehouse.
 */
export function BarcodeDisplay({
  value,
  width = 2,
  height = 80,
  format = 'CODE128',
  displayValue = true,
}: BarcodeDisplayProps) {
  const barcodeRef = useRef<SVGSVGElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (barcodeRef.current && value) {
      try {
        setError(null);
        JsBarcode(barcodeRef.current, value, {
          format,
          width,
          height,
          displayValue,
          background: 'transparent',
          lineColor: 'currentColor',
          margin: 0,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
      }
    }
  }, [value, width, height, format, displayValue]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-2 border border-danger/30 text-danger rounded-md bg-danger/10 text-xs text-center max-w-[200px] break-words">
        Mã vạch không hợp lệ
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <svg ref={barcodeRef} className="max-w-full" />
    </div>
  );
}
