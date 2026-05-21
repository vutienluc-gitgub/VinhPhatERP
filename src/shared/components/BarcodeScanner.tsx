import {
  useBarcodeScanner,
  checkSecureContext,
  SCANNER_MESSAGES,
} from '@/shared/hooks/useBarcodeScanner';
import type { ScanMode } from '@/shared/hooks/useBarcodeScanner';

import { AdaptiveSheet } from './AdaptiveSheet';
import { Button } from './Button';
import { Icon } from './Icon';

import '@/styles/barcode-scanner.css';

/* ── Props ── */

type BarcodeScannerProps = {
  open: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  /** Allow continuous scanning for batch workflows. Default: true */
  allowContinuous?: boolean;
  /** Default scan mode. Default: 'single' */
  defaultMode?: ScanMode;
};

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

/* ── Main Component (Presentational) ── */

export function BarcodeScanner({
  open,
  onClose,
  onScan,
  allowContinuous = true,
  defaultMode = 'single',
}: BarcodeScannerProps) {
  const scanner = useBarcodeScanner({ onScan, open, defaultMode });
  const insecure = !checkSecureContext();

  return (
    <AdaptiveSheet
      open={open}
      onClose={onClose}
      title={SCANNER_MESSAGES.title}
      maxWidth={420}
    >
      <div className="scanner-container">
        {/* HTTPS warning */}
        {insecure && (
          <div className="scanner-error">
            {SCANNER_MESSAGES.insecureContext}
          </div>
        )}

        {/* Mode toggle */}
        {!insecure &&
          allowContinuous &&
          !scanner.error &&
          scanner.cameraState === 'active' && (
            <div className="scanner-mode-toggle">
              <Button
                variant={scanner.scanMode === 'single' ? 'primary' : 'ghost'}
                className="flex-1"
                onClick={() => scanner.setScanMode('single')}
              >
                {SCANNER_MESSAGES.modeSingle}
              </Button>
              <Button
                variant={
                  scanner.scanMode === 'continuous' ? 'primary' : 'ghost'
                }
                className="flex-1"
                onClick={() => scanner.setScanMode('continuous')}
              >
                {SCANNER_MESSAGES.modeContinuous}
              </Button>
            </div>
          )}

        {/* Error */}
        {scanner.error && <div className="scanner-error">{scanner.error}</div>}

        {/* Idle: "Tap to start" button */}
        {!insecure && !scanner.error && scanner.cameraState === 'idle' && (
          <Button
            variant="primary"
            size="lg"
            className="mx-auto mt-4 px-8 py-4 flex-col gap-2 h-auto"
            onClick={scanner.startCamera}
            leftIcon="Camera"
          >
            <span>{SCANNER_MESSAGES.tapToStart}</span>
          </Button>
        )}

        {/* Starting: spinner */}
        {!insecure && scanner.cameraState === 'starting' && (
          <div className="scanner-starting">
            <div className="scanner-spinner" />
            <span>{SCANNER_MESSAGES.startingCamera}</span>
          </div>
        )}

        {/* Active: viewfinder */}
        {!insecure && !scanner.error && scanner.cameraState === 'active' && (
          <>
            <div className="scanner-viewfinder">
              <div id={scanner.readerId} />
              <ScannerCorners />
            </div>

            {/* Toolbar: Torch + Camera switch */}
            {scanner.cameraReady && (
              <div className="scanner-toolbar">
                {scanner.torchSupported && (
                  <Button
                    variant={scanner.torchOn ? 'primary' : 'outline'}
                    onClick={scanner.toggleTorch}
                    leftIcon="Zap"
                  >
                    {scanner.torchOn
                      ? SCANNER_MESSAGES.torchOn
                      : SCANNER_MESSAGES.torchOff}
                  </Button>
                )}
                {scanner.cameras.length > 1 && (
                  <Button
                    variant="outline"
                    onClick={scanner.switchCamera}
                    leftIcon="SwitchCamera"
                  >
                    {SCANNER_MESSAGES.switchCamera}
                  </Button>
                )}
              </div>
            )}

            {/* Hint */}
            <p className="scanner-hint">
              {scanner.scanMode === 'continuous'
                ? SCANNER_MESSAGES.continuousHint
                : SCANNER_MESSAGES.cameraHint}
            </p>
          </>
        )}

        {/* Hidden reader div when camera is not active */}
        {scanner.cameraState !== 'active' && (
          <div id={scanner.readerId} className="hidden" />
        )}

        {/* Scan feedback */}
        {scanner.lastScanned && (
          <div className="scanner-feedback">
            <div
              className="scanner-last-scan"
              key={scanner.lastScanned + scanner.scanCount}
            >
              <Icon name="check-circle" size={16} />
              <span>
                {SCANNER_MESSAGES.scannedPrefix} {scanner.lastScanned}
              </span>
            </div>
            {scanner.scanCount > 1 && (
              <p className="scanner-scan-count">
                {scanner.scanCount} {SCANNER_MESSAGES.scannedCountSuffix}
              </p>
            )}
          </div>
        )}

        {/* Hidden element for file scanner */}
        <div id={`${scanner.readerId}-file`} className="hidden" />

        {/* File-based fallback */}
        <div className="scanner-file-fallback">
          <input
            ref={scanner.fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={scanner.handleFileSelect}
            className="hidden"
            id={`${scanner.readerId}-file-input`}
          />
          <Button
            variant="outline"
            disabled={scanner.isFileProcessing}
            onClick={() => scanner.fileInputRef.current?.click()}
            className="w-full mt-4"
            leftIcon="Image"
          >
            {scanner.isFileProcessing
              ? SCANNER_MESSAGES.scanFileProcessing
              : SCANNER_MESSAGES.captureLabel}
          </Button>
        </div>
      </div>
    </AdaptiveSheet>
  );
}
