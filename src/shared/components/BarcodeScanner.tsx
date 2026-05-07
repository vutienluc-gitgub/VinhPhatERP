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
  const readerId = useRef(
    `reader-${Math.random().toString(36).substring(2, 9)}`,
  ).current;
  const isStartingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    if (!open) {
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(console.error);
        }
        scannerRef.current.clear();
        scannerRef.current = null;
      }
      return;
    }

    const startScanner = async () => {
      if (isStartingRef.current || scannerRef.current) return;
      isStartingRef.current = true;

      try {
        const html5QrCode = new Html5Qrcode(readerId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 100 },
          },
          (decodedText) => {
            if (scannerRef.current && scannerRef.current.isScanning) {
              scannerRef.current.stop().catch(console.error);
            }
            onScan(decodedText);
          },
          () => {
            // Ignore normal scanning errors
          },
        );
      } catch (err) {
        if (isMounted) {
          setError(
            'Lỗi Camera: Nếu bạn dùng iPhone qua mạng LAN (IP), Safari yêu cầu phải có HTTPS để mở Camera.',
          );
          console.error('Camera error:', err);
        }
      } finally {
        isStartingRef.current = false;
      }
    };

    // Đợi AdaptiveSheet render DOM xong (khoảng 300ms)
    const timeout = setTimeout(() => {
      if (isMounted) startScanner();
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(console.error);
        }
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    };
  }, [open, onScan, readerId]);

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
              id={readerId}
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
