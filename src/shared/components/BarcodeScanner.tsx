import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

import { AdaptiveSheet } from './AdaptiveSheet';

type BarcodeScannerProps = {
  open: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
};

export function BarcodeScanner({ open, onClose, onScan }: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!open) {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
        scannerRef.current = null;
      }
      return;
    }

    const startScanner = async () => {
      try {
        const html5QrCode = new Html5Qrcode('reader');
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' }, // Use back camera
          {
            fps: 10,
            qrbox: { width: 250, height: 100 }, // Rectangle better for 1D barcodes
          },
          (decodedText) => {
            if (scannerRef.current) {
              scannerRef.current.stop().catch(console.error);
            }
            onScan(decodedText);
          },
          () => {
            // Ignore normal scanning errors (no barcode found in current frame)
          },
        );
      } catch (err) {
        setError('Không thể mở camera. Vui lòng cấp quyền truy cập camera.');
        console.error(err);
      }
    };

    // Small delay to ensure the DOM element 'reader' exists after AdaptiveSheet mounts it
    const timeout = setTimeout(() => {
      startScanner();
    }, 100);

    return () => {
      clearTimeout(timeout);
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [open, onScan]);

  return (
    <AdaptiveSheet
      open={open}
      onClose={onClose}
      title="Quét Barcode bằng Camera"
      maxWidth={400}
    >
      <div className="p-4 flex flex-col items-center">
        {error ? (
          <div className="text-danger text-center p-4">{error}</div>
        ) : (
          <>
            <div
              id="reader"
              className="w-full max-w-[350px] aspect-square rounded-lg overflow-hidden shadow-sm border border-border"
            />
            <p className="text-muted text-sm mt-4 text-center">
              Hướng camera vào mã vạch trên nhãn thùng sợi.
            </p>
          </>
        )}
      </div>
    </AdaptiveSheet>
  );
}
