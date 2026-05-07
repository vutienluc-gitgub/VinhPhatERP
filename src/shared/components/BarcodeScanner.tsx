import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

import { AdaptiveSheet } from './AdaptiveSheet';
import { Icon } from './Icon';

import '@/styles/barcode-scanner.css';

/* ── Constants ── */

const SCANNER_MESSAGES = {
  insecureContext:
    'Trình duyệt yêu cầu HTTPS để truy cập Camera. Trang này đang chạy trên HTTP nên không thể mở Camera. Bạn có thể chụp ảnh mã vạch bên dưới.',
  cameraNotFound:
    'Không tìm thấy camera trên thiết bị. Bạn có thể chụp ảnh mã vạch bên dưới.',
  cameraBlocked:
    'Quyền truy cập Camera bị từ chối. Vui lòng cho phép Camera trong cài đặt trình duyệt, hoặc chụp ảnh mã vạch bên dưới.',
  cameraGenericError:
    'Không thể khởi động Camera. Bạn có thể chụp ảnh mã vạch bên dưới.',
  scanFileError: 'Không tìm thấy mã vạch trong ảnh. Vui lòng thử lại.',
  scanFileProcessing: 'Đang xử lý ảnh...',
  captureLabel: 'Chụp / Chọn ảnh mã vạch',
  cameraHint: 'Hướng camera vào mã vạch trên nhãn thùng sợi.',
  continuousHint: 'Chế độ quét liên tục — tự động quét mã tiếp theo.',
  title: 'Quét Barcode',
  modeSingle: 'Quét 1 lần',
  modeContinuous: 'Quét liên tục',
  torchOn: 'Tắt đèn',
  torchOff: 'Bật đèn',
  switchCamera: 'Đổi cam',
  scannedPrefix: 'Đã quét:',
  scannedCountSuffix: 'mã đã quét',
} as const;

/** How long to pause scanning after a successful scan (continuous mode) */
const CONTINUOUS_PAUSE_MS = 1500;

type ScanMode = 'single' | 'continuous';

type BarcodeScannerProps = {
  open: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  /** Allow continuous scanning for batch workflows. Default: true */
  allowContinuous?: boolean;
  /** Default scan mode. Default: 'single' */
  defaultMode?: ScanMode;
};

/* ── Helpers ── */

/** Detect whether the page runs in a secure context (HTTPS / localhost) */
function isSecureContext(): boolean {
  if (typeof window === 'undefined') return false;
  if (typeof window.isSecureContext === 'boolean')
    return window.isSecureContext;
  const { protocol, hostname } = window.location;
  return (
    protocol === 'https:' ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1'
  );
}

/** Classify camera errors into user-friendly categories */
function classifyCameraError(err: unknown): string {
  const message = err instanceof Error ? err.name : String(err);

  if (
    message.includes('NotFoundError') ||
    message.includes('DevicesNotFound')
  ) {
    return SCANNER_MESSAGES.cameraNotFound;
  }
  if (
    message.includes('NotAllowedError') ||
    message.includes('PermissionDenied')
  ) {
    return SCANNER_MESSAGES.cameraBlocked;
  }
  return SCANNER_MESSAGES.cameraGenericError;
}

/* ── Viewfinder corners overlay ── */
function ScannerCorners() {
  return (
    <div className="scanner-corners">
      <div className="scanner-corner scanner-corner--tl" />
      <div className="scanner-corner scanner-corner--tr" />
      <div className="scanner-corner scanner-corner--bl" />
      <div className="scanner-corner scanner-corner--br" />
    </div>
  );
}

/* ── Main Component ── */

export function BarcodeScanner({
  open,
  onClose,
  onScan,
  allowContinuous = true,
  defaultMode = 'single',
}: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isFileProcessing, setIsFileProcessing] = useState(false);
  const [scanMode, setScanMode] = useState<ScanMode>(defaultMode);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>(
    [],
  );
  const [activeCameraIndex, setActiveCameraIndex] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerId = useRef(
    `reader-${Math.random().toString(36).substring(2, 9)}`,
  ).current;
  const isStartingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pauseRef = useRef(false);
  const scanModeRef = useRef(scanMode);

  // Keep ref in sync with state
  useEffect(() => {
    scanModeRef.current = scanMode;
  }, [scanMode]);

  /* ── Handle decoded barcode ── */
  const handleDecoded = useCallback(
    (decodedText: string) => {
      if (pauseRef.current) return;

      setLastScanned(decodedText);
      setScanCount((c) => c + 1);

      // Haptic feedback on supported devices
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }

      if (scanModeRef.current === 'single') {
        // Single mode: stop scanner + report
        if (scannerRef.current?.isScanning) {
          scannerRef.current.stop().catch(() => {
            /* already stopped */
          });
        }
        onScan(decodedText);
      } else {
        // Continuous mode: report immediately, pause briefly to avoid duplicates
        onScan(decodedText);
        pauseRef.current = true;
        setTimeout(() => {
          pauseRef.current = false;
        }, CONTINUOUS_PAUSE_MS);
      }
    },
    [onScan],
  );

  /* ── File-based scanning ── */
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsFileProcessing(true);
      try {
        const fileScanner = new Html5Qrcode(`${readerId}-file`);
        const decodedText = await fileScanner.scanFile(file, false);
        fileScanner.clear();
        setLastScanned(decodedText);
        setScanCount((c) => c + 1);
        onScan(decodedText);
      } catch {
        setError(SCANNER_MESSAGES.scanFileError);
      } finally {
        setIsFileProcessing(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [onScan, readerId],
  );

  /* ── Torch toggle ── */
  const toggleTorch = useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner?.isScanning) return;

    const newTorch = !torchOn;
    try {
      await scanner.applyVideoConstraints({
        // @ts-expect-error — torch is a valid constraint on supported devices but missing from lib types
        advanced: [{ torch: newTorch }],
      });
      setTorchOn(newTorch);
    } catch {
      // Torch not supported or failed silently
    }
  }, [torchOn]);

  /* ── Detect torch capability ── */
  const checkTorchSupport = useCallback(() => {
    const scanner = scannerRef.current;
    if (!scanner?.isScanning) return;

    try {
      const capabilities = scanner.getRunningTrackCameraCapabilities();
      const torchFeature = capabilities.torchFeature();
      setTorchSupported(torchFeature.isSupported());
    } catch {
      setTorchSupported(false);
    }
  }, []);

  /* ── Camera switch ── */
  const switchCamera = useCallback(async () => {
    if (cameras.length < 2) return;

    const nextIndex = (activeCameraIndex + 1) % cameras.length;
    const nextCamera = cameras[nextIndex];
    if (!nextCamera) return;

    const scanner = scannerRef.current;
    if (!scanner) return;

    try {
      setCameraReady(false);
      if (scanner.isScanning) {
        await scanner.stop();
      }

      await scanner.start(
        nextCamera.id,
        { fps: 10, qrbox: { width: 250, height: 100 } },
        handleDecoded,
        () => {
          /* ignore */
        },
      );

      setActiveCameraIndex(nextIndex);
      setCameraReady(true);
      setTorchOn(false);
      checkTorchSupport();
    } catch (err) {
      setError(classifyCameraError(err));
    }
  }, [cameras, activeCameraIndex, handleDecoded, checkTorchSupport]);

  /* ── Main scanner lifecycle ── */
  useEffect(() => {
    let isMounted = true;

    if (!open) {
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(() => {
            /* cleanup */
          });
        }
        scannerRef.current.clear();
        scannerRef.current = null;
      }
      // Reset all state
      setError(null);
      setIsFileProcessing(false);
      setTorchOn(false);
      setTorchSupported(false);
      setLastScanned(null);
      setScanCount(0);
      setCameras([]);
      setActiveCameraIndex(0);
      setCameraReady(false);
      pauseRef.current = false;
      return;
    }

    if (!isSecureContext()) {
      setError(SCANNER_MESSAGES.insecureContext);
      return;
    }

    const startScanner = async () => {
      if (isStartingRef.current || scannerRef.current) return;
      isStartingRef.current = true;

      try {
        // Enumerate cameras
        const detectedCameras = await Html5Qrcode.getCameras();
        if (isMounted) {
          setCameras(detectedCameras);
        }

        const html5QrCode = new Html5Qrcode(readerId);
        scannerRef.current = html5QrCode;

        const scanConfig = { fps: 10, qrbox: { width: 250, height: 100 } };
        const noopCallback = () => {
          /* ignore */
        };

        // Try ideal environment facing first
        try {
          await html5QrCode.start(
            { facingMode: { ideal: 'environment' } },
            scanConfig,
            (decodedText) => {
              if (isMounted) handleDecoded(decodedText);
            },
            noopCallback,
          );
        } catch {
          // Fallback: use first enumerated camera
          try {
            if (html5QrCode.isScanning) await html5QrCode.stop();
          } catch {
            /* already stopped */
          }

          const firstCamera = detectedCameras[0];
          if (!firstCamera) {
            throw new DOMException('No cameras found', 'NotFoundError');
          }

          await html5QrCode.start(
            firstCamera.id,
            scanConfig,
            (decodedText) => {
              if (isMounted) handleDecoded(decodedText);
            },
            noopCallback,
          );
        }

        if (isMounted) {
          setCameraReady(true);
          // Delay torch detection to let stream stabilize
          setTimeout(() => {
            if (isMounted) {
              try {
                const caps = html5QrCode.getRunningTrackCameraCapabilities();
                const torch = caps.torchFeature();
                setTorchSupported(torch.isSupported());
              } catch {
                setTorchSupported(false);
              }
            }
          }, 500);
        }
      } catch (err) {
        if (isMounted) {
          setError(classifyCameraError(err));
        }
      } finally {
        isStartingRef.current = false;
      }
    };

    // Wait for AdaptiveSheet DOM to render
    const timeout = setTimeout(() => {
      if (isMounted) startScanner();
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(() => {
            /* cleanup */
          });
        }
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    };
  }, [open, readerId, handleDecoded]);

  /* ── Render ── */
  return (
    <AdaptiveSheet
      open={open}
      onClose={onClose}
      title={SCANNER_MESSAGES.title}
      maxWidth={420}
    >
      <div className="scanner-container">
        {/* Mode toggle */}
        {allowContinuous && !error && (
          <div className="scanner-mode-toggle">
            <button
              type="button"
              className={`scanner-mode-btn${scanMode === 'single' ? ' is-active' : ''}`}
              onClick={() => setScanMode('single')}
            >
              {SCANNER_MESSAGES.modeSingle}
            </button>
            <button
              type="button"
              className={`scanner-mode-btn${scanMode === 'continuous' ? ' is-active' : ''}`}
              onClick={() => setScanMode('continuous')}
            >
              {SCANNER_MESSAGES.modeContinuous}
            </button>
          </div>
        )}

        {/* Camera viewfinder */}
        {error ? (
          <div className="scanner-error">{error}</div>
        ) : (
          <>
            <div className="scanner-viewfinder">
              <div id={readerId} />
              <ScannerCorners />
            </div>

            {/* Toolbar: Torch + Camera switch */}
            {cameraReady && (
              <div className="scanner-toolbar">
                {torchSupported && (
                  <button
                    type="button"
                    className={`scanner-toolbar-btn${torchOn ? ' is-active' : ''}`}
                    onClick={toggleTorch}
                  >
                    <Icon name="flashlight" size={16} />
                    {torchOn
                      ? SCANNER_MESSAGES.torchOn
                      : SCANNER_MESSAGES.torchOff}
                  </button>
                )}
                {cameras.length > 1 && (
                  <button
                    type="button"
                    className="scanner-toolbar-btn"
                    onClick={switchCamera}
                  >
                    <Icon name="switch-camera" size={16} />
                    {SCANNER_MESSAGES.switchCamera}
                  </button>
                )}
              </div>
            )}

            {/* Hint */}
            <p className="scanner-hint">
              {scanMode === 'continuous'
                ? SCANNER_MESSAGES.continuousHint
                : SCANNER_MESSAGES.cameraHint}
            </p>
          </>
        )}

        {/* Scan feedback */}
        {lastScanned && (
          <div className="scanner-feedback">
            <div className="scanner-last-scan" key={lastScanned + scanCount}>
              <Icon name="check-circle" size={16} />
              <span>
                {SCANNER_MESSAGES.scannedPrefix} {lastScanned}
              </span>
            </div>
            {scanCount > 1 && (
              <p className="scanner-scan-count">
                {scanCount} {SCANNER_MESSAGES.scannedCountSuffix}
              </p>
            )}
          </div>
        )}

        {/* Hidden element for file scanner */}
        <div id={`${readerId}-file`} className="hidden" />

        {/* File-based fallback */}
        <div className="scanner-file-fallback">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
            id={`${readerId}-file-input`}
          />
          <button
            type="button"
            disabled={isFileProcessing}
            onClick={() => fileInputRef.current?.click()}
            className="scanner-file-btn"
          >
            <Icon name="image" size={18} />
            {isFileProcessing
              ? SCANNER_MESSAGES.scanFileProcessing
              : SCANNER_MESSAGES.captureLabel}
          </button>
        </div>
      </div>
    </AdaptiveSheet>
  );
}
