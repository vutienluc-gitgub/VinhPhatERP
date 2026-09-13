/**
 * Custom Hook for Yarn Slip OCR Scanning Flow
 * Manages document upload, image preview, progress simulation, and BFF API interaction.
 */

import { useState, useCallback, useEffect, useRef } from 'react';

import type { YarnSlipScanResponse } from '@/api/yarn-receipts.api';
import { scanYarnSlip } from '@/api/yarn-receipts.api';
import { SCAN_WORKSPACE_LABELS } from '@/features/yarn-receipts/yarn-slip-scan.constants';

export interface UseYarnSlipScanReturn {
  selectedFile: File | null;
  previewUrl: string | null;
  isScanning: boolean;
  scanStage: number;
  scanResponse: YarnSlipScanResponse | null;
  error: string | null;
  zoomLevel: number;
  activeTab: 'image' | 'data';
  setActiveTab: (tab: 'image' | 'data') => void;
  handleFileSelect: (file: File) => Promise<void>;
  resetScan: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
}

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

export function useYarnSlipScan(
  onScanComplete?: (response: YarnSlipScanResponse) => void,
): UseYarnSlipScanReturn {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStage, setScanStage] = useState(0);
  const [scanResponse, setScanResponse] = useState<YarnSlipScanResponse | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeTab, setActiveTab] = useState<'image' | 'data'>('data');

  const previewUrlRef = useRef<string | null>(null);
  const stageTimerRef = useRef<NodeJS.Timeout[]>([]);

  const clearTimers = useCallback(() => {
    stageTimerRef.current.forEach((timer) => clearTimeout(timer));
    stageTimerRef.current = [];
  }, []);

  const resetScan = useCallback(() => {
    clearTimers();
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsScanning(false);
    setScanStage(0);
    setScanResponse(null);
    setError(null);
    setZoomLevel(1);
    setActiveTab('data');
  }, [clearTimers]);

  useEffect(() => {
    return () => {
      clearTimers();
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, [clearTimers]);

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
        setError(SCAN_WORKSPACE_LABELS.ERR_UNSUPPORTED_MIME);
        return;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError(SCAN_WORKSPACE_LABELS.ERR_MAX_SIZE_EXCEEDED);
        return;
      }

      resetScan();
      setSelectedFile(file);

      const objectUrl = URL.createObjectURL(file);
      previewUrlRef.current = objectUrl;
      setPreviewUrl(objectUrl);
      setIsScanning(true);
      setError(null);
      setScanStage(1);

      // Staged visual progress indicator
      stageTimerRef.current.push(
        setTimeout(() => setScanStage(2), 600),
        setTimeout(() => setScanStage(3), 1500),
        setTimeout(() => setScanStage(4), 2800),
      );

      try {
        const response = await scanYarnSlip(file);
        setScanResponse(response);
        setIsScanning(false);
        setScanStage(4);
        onScanComplete?.(response);
      } catch (err) {
        clearTimers();
        setIsScanning(false);
        setScanStage(0);
        const message =
          err instanceof Error
            ? err.message
            : SCAN_WORKSPACE_LABELS.ERR_UNKNOWN_SCAN;
        setError(message);
      }
    },
    [resetScan, clearTimers, onScanComplete],
  );

  const zoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3.0));
  }, []);

  const zoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  }, []);

  const resetZoom = useCallback(() => {
    setZoomLevel(1);
  }, []);

  return {
    selectedFile,
    previewUrl,
    isScanning,
    scanStage,
    scanResponse,
    error,
    zoomLevel,
    activeTab,
    setActiveTab,
    handleFileSelect,
    resetScan,
    zoomIn,
    zoomOut,
    resetZoom,
  };
}
