import {
  useBarcodeScanner,
  checkSecureContext,
  SCANNER_MESSAGES,
} from '@/shared/hooks/useBarcodeScanner';
import type { ScanMode } from '@/shared/hooks/useBarcodeScanner';

import { AdaptiveSheet } from './AdaptiveSheet';
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
              <button
                type="button"
                className={`scanner-mode-btn${scanner.scanMode === 'single' ? ' is-active' : ''}`}
                onClick={() => scanner.setScanMode('single')}
              >
                {SCANNER_MESSAGES.modeSingle}
              </button>
              <button
                type="button"
                className={`scanner-mode-btn${scanner.scanMode === 'continuous' ? ' is-active' : ''}`}
                onClick={() => scanner.setScanMode('continuous')}
              >
                {SCANNER_MESSAGES.modeContinuous}
              </button>
            </div>
          )}

        {/* Error */}
        {scanner.error && <div className="scanner-error">{scanner.error}</div>}

        {/* Idle: "Tap to start" button */}
        {!insecure && !scanner.error && scanner.cameraState === 'idle' && (
          <button
            type="button"
            className="scanner-start-btn"
            onClick={scanner.startCamera}
          >
            <Icon name="camera" size={28} />
            <span>{SCANNER_MESSAGES.tapToStart}</span>
          </button>
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
                  <button
                    type="button"
                    className={`scanner-toolbar-btn${scanner.torchOn ? ' is-active' : ''}`}
                    onClick={scanner.toggleTorch}
                  >
                    <Icon name="flashlight" size={16} />
                    {scanner.torchOn
                      ? SCANNER_MESSAGES.torchOn
                      : SCANNER_MESSAGES.torchOff}
                  </button>
                )}
                {scanner.cameras.length > 1 && (
                  <button
                    type="button"
                    className="scanner-toolbar-btn"
                    onClick={scanner.switchCamera}
                  >
                    <Icon name="switch-camera" size={16} />
                    {SCANNER_MESSAGES.switchCamera}
                  </button>
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
          <button
            type="button"
            disabled={scanner.isFileProcessing}
            onClick={() => scanner.fileInputRef.current?.click()}
            className="scanner-file-btn"
          >
            <Icon name="image" size={18} />
            {scanner.isFileProcessing
              ? SCANNER_MESSAGES.scanFileProcessing
              : SCANNER_MESSAGES.captureLabel}
          </button>
        </div>
      </div>
    </AdaptiveSheet>
  );
}
