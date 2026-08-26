import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

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
  tapToStart: 'Bấm để mở Camera',
  startingCamera: 'Đang khởi động Camera...',
} as const;

export { SCANNER_MESSAGES };

/** How long to pause scanning after a successful scan (continuous mode) */
const CONTINUOUS_PAUSE_MS = 1500;

/** Default scan config — extracted to avoid magic-number duplication */
const DEFAULT_SCAN_CONFIG = { fps: 10, qrbox: { width: 250, height: 100 } };

export type ScanMode = 'single' | 'continuous';

export type CameraState = 'idle' | 'starting' | 'active';

type CameraDevice = { id: string; label: string };

/* ── Helpers ── */

/** Detect whether the page runs in a secure context (HTTPS / localhost) */
export function checkSecureContext(): boolean {
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
  const errName = err instanceof Error ? err.name : 'UnknownError';
  const errMsg = err instanceof Error ? err.message : String(err);
  const detail = `${errName}: ${errMsg}`;

  if (detail.includes('NotFoundError') || detail.includes('DevicesNotFound')) {
    return `${SCANNER_MESSAGES.cameraNotFound} (${detail})`;
  }
  if (
    detail.includes('NotAllowedError') ||
    detail.includes('PermissionDenied')
  ) {
    return SCANNER_MESSAGES.cameraBlocked;
  }
  return `${SCANNER_MESSAGES.cameraGenericError} (${detail})`;
}

/**
 * Stop a scanner instance safely, awaiting the async stop before clearing.
 * Returns only after the scanner is fully stopped and cleared.
 */
async function cleanupScannerAsync(scanner: Html5Qrcode | null): Promise<void> {
  if (!scanner) return;
  try {
    if (scanner.isScanning) {
      await scanner.stop();
    }
  } catch {
    /* already stopped or mid-transition — safe to ignore */
  }
  try {
    scanner.clear();
  } catch {
    /* DOM element already removed — safe to ignore */
  }
}

/** No-op callback for html5-qrcode error frames */
const NOOP_CALLBACK = () => {
  /* ignore "no barcode found" frames */
};

/* ── Hook ── */

type UseBarcodeScanner = {
  onScan: (barcode: string) => void;
  open: boolean;
  defaultMode?: ScanMode;
};

export function useBarcodeScanner({
  onScan,
  open,
  defaultMode = 'single',
}: UseBarcodeScanner) {
  const [error, setError] = useState<string | null>(null);
  const [isFileProcessing, setIsFileProcessing] = useState(false);
  const [scanMode, setScanMode] = useState<ScanMode>(defaultMode);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [activeCameraIndex, setActiveCameraIndex] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraState, setCameraState] = useState<CameraState>('idle');

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const setScannerRef = useCallback((instance: Html5Qrcode | null) => {
    scannerRef.current = instance;
  }, []);
  const readerId = useRef(
    `reader-${Math.random().toString(36).substring(2, 9)}`,
  ).current;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pauseRef = useRef(false);
  const scanModeRef = useRef(scanMode);
  const isMountedRef = useRef(true);

  /**
   * Serialisation lock — prevents overlapping start/stop transitions
   * which cause "Cannot transition to a new state, already under transition".
   */
  const transitionLockRef = useRef<Promise<void>>(Promise.resolve());

  /**
   * Enqueue a callback that will run only after any in-flight transition
   * has finished. Returns the promise so callers can await the result.
   */
  const enqueueTransition = useCallback(
    (fn: () => Promise<void>): Promise<void> => {
      const next = transitionLockRef.current.then(fn, fn);
      transitionLockRef.current = next;
      return next;
    },
    [],
  );

  useEffect(() => {
    scanModeRef.current = scanMode;
  }, [scanMode]);

  /* ── Handle decoded barcode ── */
  const handleDecoded = useCallback(
    (decodedText: string) => {
      if (pauseRef.current) return;

      setLastScanned(decodedText);
      setScanCount((c) => c + 1);

      if (navigator.vibrate) {
        navigator.vibrate(100);
      }

      if (scanModeRef.current === 'single') {
        // Fire-and-forget stop — guarded by transition lock is not needed
        // because we are inside a scan callback, not starting a new scan.
        if (scannerRef.current?.isScanning) {
          scannerRef.current.stop().catch(() => {
            /* already stopped */
          });
        }
        onScan(decodedText);
      } else {
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
      // Torch toggle failed — device may not support it
    }
  }, [torchOn]);

  /* ── Detect torch capability ── */
  const detectTorch = useCallback((scanner: Html5Qrcode) => {
    try {
      const caps = scanner.getRunningTrackCameraCapabilities();
      const torch = caps.torchFeature();
      setTorchSupported(torch.isSupported());
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

    await enqueueTransition(async () => {
      try {
        setCameraReady(false);
        if (scanner.isScanning) {
          await scanner.stop();
        }

        await scanner.start(
          nextCamera.id,
          DEFAULT_SCAN_CONFIG,
          handleDecoded,
          NOOP_CALLBACK,
        );

        if (isMountedRef.current) {
          setActiveCameraIndex(nextIndex);
          setCameraReady(true);
          setTorchOn(false);
          detectTorch(scanner);
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(classifyCameraError(err));
        }
      }
    });
  }, [
    cameras,
    activeCameraIndex,
    handleDecoded,
    detectTorch,
    enqueueTransition,
  ]);

  /* ── Start camera (called from user tap — preserves user gesture for iOS) ── */
  const startCamera = useCallback(async () => {
    if (scannerRef.current?.isScanning) return;

    await enqueueTransition(async () => {
      // Double-check after acquiring the lock
      if (scannerRef.current?.isScanning) return;

      setError(null);
      setCameraState('starting');

      try {
        // Step 1: Request permission via getUserMedia in direct user gesture context.
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        // Stop raw stream — html5-qrcode will open its own.
        stream.getTracks().forEach((track) => track.stop());

        // Step 2: Enumerate cameras (permission already granted)
        const detectedCameras = await Html5Qrcode.getCameras();
        if (isMountedRef.current) {
          setCameras(detectedCameras);
        }

        // Step 3: Wait a tick for the reader DOM element to be visible
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (!isMountedRef.current) return;

        const html5QrCode = new Html5Qrcode(readerId);
        setScannerRef(html5QrCode);

        // Try environment camera, fallback to first enumerated
        let cameraStarted = false;
        try {
          await html5QrCode.start(
            { facingMode: { ideal: 'environment' } },
            DEFAULT_SCAN_CONFIG,
            (decodedText) => {
              if (isMountedRef.current) handleDecoded(decodedText);
            },
            NOOP_CALLBACK,
          );
          cameraStarted = true;
        } catch {
          // Fallback: use first enumerated camera by device ID
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
            DEFAULT_SCAN_CONFIG,
            (decodedText) => {
              if (isMountedRef.current) handleDecoded(decodedText);
            },
            NOOP_CALLBACK,
          );
          cameraStarted = true;
        }

        if (isMountedRef.current && cameraStarted) {
          setCameraReady(true);
          setCameraState('active');
          // Delay torch detection to let video stream stabilize
          setTimeout(() => {
            if (isMountedRef.current && scannerRef.current) {
              detectTorch(scannerRef.current);
            }
          }, 500);
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(classifyCameraError(err));
          setCameraState('idle');
        }
      }
    });
  }, [readerId, handleDecoded, detectTorch, enqueueTransition, setScannerRef]);

  /* ── Reset all state ── */
  const resetState = useCallback(() => {
    setError(null);
    setIsFileProcessing(false);
    setTorchOn(false);
    setTorchSupported(false);
    setLastScanned(null);
    setScanCount(0);
    setCameras([]);
    setActiveCameraIndex(0);
    setCameraReady(false);
    setCameraState('idle');
    pauseRef.current = false;
  }, []);

  /* ── Cleanup when sheet closes ── */
  useEffect(() => {
    isMountedRef.current = true;

    if (!open) {
      isMountedRef.current = false;
      // Enqueue cleanup so it waits for any in-flight transition to finish
      const scannerInstance = scannerRef.current;
      scannerRef.current = null;
      enqueueTransition(async () => {
        await cleanupScannerAsync(scannerInstance);
      });
      resetState();
    }

    return () => {
      isMountedRef.current = false;
      const scannerInstance = scannerRef.current;
      scannerRef.current = null;
      enqueueTransition(async () => {
        await cleanupScannerAsync(scannerInstance);
      });
    };
  }, [open, resetState, enqueueTransition]);

  return {
    // State
    error,
    isFileProcessing,
    scanMode,
    torchOn,
    torchSupported,
    lastScanned,
    scanCount,
    cameras,
    cameraReady,
    cameraState,
    readerId,
    fileInputRef,
    // Setters
    setScanMode,
    setError,
    // Actions
    startCamera,
    switchCamera,
    toggleTorch,
    handleFileSelect,
  };
}
