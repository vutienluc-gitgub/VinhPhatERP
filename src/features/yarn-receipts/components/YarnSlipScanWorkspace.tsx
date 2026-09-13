import { useMemo, useState } from 'react';

import { useYarnCatalogOptions } from '@/application/inventory';
import { useYarnSlipDirectTransaction } from '@/features/yarn-receipts/hooks/useYarnSlipDirectTransaction';
import { useYarnSlipScan } from '@/features/yarn-receipts/hooks/useYarnSlipScan';
import {
  mapScanResultToFormValues,
  matchYarnCatalog,
} from '@/features/yarn-receipts/utils/yarn-slip-prefill';
import { SCAN_WORKSPACE_LABELS } from '@/features/yarn-receipts/yarn-slip-scan.constants';
import type { YarnReceiptsFormValues } from '@/schema/yarn-receipt.schema';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { Icon } from '@/shared/components/Icon';

import { ScanAuditDetails } from './scan/ScanAuditDetails';
import { ScanDocumentViewer } from './scan/ScanDocumentViewer';
import { ScanProcessingView } from './scan/ScanProcessingView';
import { ScanUploadDropzone } from './scan/ScanUploadDropzone';
import { ScanWorkspaceFooter } from './scan/ScanWorkspaceFooter';

export interface YarnSlipScanWorkspaceProps {
  open: boolean;
  onClose: () => void;
  onApply: (prefilledValues: Partial<YarnReceiptsFormValues>) => void;
}

export function YarnSlipScanWorkspace({
  open,
  onClose,
  onApply,
}: YarnSlipScanWorkspaceProps) {
  const [breakdownByPackages, setBreakdownByPackages] = useState(false);
  const { data: yarnCatalogs = [] } = useYarnCatalogOptions();
  const { isSubmitting, createDraftReceipt, confirmDirectReceipt } =
    useYarnSlipDirectTransaction();

  const {
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
  } = useYarnSlipScan();

  const catalogMatch = useMemo(() => {
    if (
      !scanResponse?.suggested_receipt.yarn_type ||
      yarnCatalogs.length === 0
    ) {
      return null;
    }
    return matchYarnCatalog(
      scanResponse.suggested_receipt.yarn_type,
      yarnCatalogs,
    );
  }, [scanResponse?.suggested_receipt.yarn_type, yarnCatalogs]);

  const hasErrors =
    (scanResponse?.extraction.math_discrepancies.length ?? 0) > 0 ||
    Boolean(scanResponse?.duplicate_guard.isDuplicate);
  const hasWarnings =
    Boolean(scanResponse?.supplier_match.ambiguous) ||
    Boolean(scanResponse?.extraction.needs_manual_review);

  const statusVariant = hasErrors
    ? 'error'
    : hasWarnings
      ? 'warning'
      : 'passed';

  function getPrefillValues(): Partial<YarnReceiptsFormValues> | null {
    if (!scanResponse) return null;
    return mapScanResultToFormValues(scanResponse, {
      catalogs: yarnCatalogs,
      breakdownByPackages,
    });
  }

  function handleEditInForm() {
    const prefillValues = getPrefillValues();
    if (!prefillValues) return;

    if (hasErrors) {
      const confirmed = window.confirm(
        SCAN_WORKSPACE_LABELS.CONFIRM_APPLY_WITH_ERRORS,
      );
      if (!confirmed) return;
    }

    onApply(prefillValues);
    resetScan();
    onClose();
  }

  async function handleSaveDraft() {
    const prefillValues = getPrefillValues();
    if (!prefillValues) return;

    try {
      await createDraftReceipt(prefillValues);
      resetScan();
      onClose();
    } catch (_err) {
      // Error notifications handled by toast in hook
    }
  }

  async function handleConfirmDirect() {
    const prefillValues = getPrefillValues();
    if (!prefillValues) return;

    if (hasErrors) {
      const confirmed = window.confirm(
        SCAN_WORKSPACE_LABELS.CONFIRM_APPLY_WITH_ERRORS,
      );
      if (!confirmed) return;
    }

    const proceed = window.confirm(SCAN_WORKSPACE_LABELS.CONFIRM_DIRECT_PROMPT);
    if (!proceed) return;

    try {
      await confirmDirectReceipt(prefillValues);
      resetScan();
      onClose();
    } catch (_err) {
      // Error notifications handled by toast in hook
    }
  }

  return (
    <AdaptiveSheet
      open={open}
      onClose={() => {
        resetScan();
        onClose();
      }}
      title={SCAN_WORKSPACE_LABELS.MODAL_TITLE}
      size="2xl"
    >
      <div className="flex flex-col h-full space-y-4">
        {/* Screen 1: Upload / Camera Input */}
        {!previewUrl && !isScanning && (
          <ScanUploadDropzone
            error={error}
            onFileSelect={(file) => void handleFileSelect(file)}
          />
        )}

        {/* Screen 2: Scanning Progress */}
        {isScanning && <ScanProcessingView scanStage={scanStage} />}

        {/* Screen 3: Side-by-Side Audit Workspace */}
        {!isScanning && scanResponse && (
          <div className="flex flex-col space-y-4">
            {/* Status Banner */}
            <div
              className={`p-3.5 rounded-lg border flex items-center justify-between gap-3 text-sm ${
                statusVariant === 'error'
                  ? 'bg-danger-soft border-danger text-danger'
                  : statusVariant === 'warning'
                    ? 'bg-warning-soft border-warning text-warning'
                    : 'bg-success-soft border-success text-success'
              }`}
            >
              <div className="flex items-center gap-2 font-medium">
                <Icon
                  name={
                    statusVariant === 'error'
                      ? 'AlertCircle'
                      : statusVariant === 'warning'
                        ? 'AlertTriangle'
                        : 'CheckCircle'
                  }
                  size={18}
                />
                <span>
                  {statusVariant === 'error'
                    ? SCAN_WORKSPACE_LABELS.STATUS_ERROR
                    : statusVariant === 'warning'
                      ? SCAN_WORKSPACE_LABELS.STATUS_WARNING
                      : SCAN_WORKSPACE_LABELS.STATUS_PASSED}
                </span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-surface/80 text-foreground font-mono">
                Job ID: {scanResponse.job_id.slice(0, 8)}
              </span>
            </div>

            {/* Mobile Tab Switcher */}
            <div className="flex md:hidden border-b border-default">
              <button
                type="button"
                onClick={() => setActiveTab('data')}
                className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'data'
                    ? 'border-[var(--primary)] text-[var(--primary)]'
                    : 'border-transparent text-muted'
                }`}
              >
                {SCAN_WORKSPACE_LABELS.TAB_AUDITED_DATA}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('image')}
                className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'image'
                    ? 'border-[var(--primary)] text-[var(--primary)]'
                    : 'border-transparent text-muted'
                }`}
              >
                {SCAN_WORKSPACE_LABELS.TAB_DOCUMENT_IMAGE}
              </button>
            </div>

            {/* 2-Column Grid on Desktop, Tabbed on Mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <ScanDocumentViewer
                previewUrl={previewUrl}
                zoomLevel={zoomLevel}
                onZoomIn={zoomIn}
                onZoomOut={zoomOut}
                onResetZoom={resetZoom}
                visible={activeTab === 'image'}
              />

              <ScanAuditDetails
                scanResponse={scanResponse}
                visible={activeTab === 'data'}
                catalogMatch={catalogMatch}
                breakdownByPackages={breakdownByPackages}
                onToggleBreakdown={setBreakdownByPackages}
              />
            </div>

            <ScanWorkspaceFooter
              isSubmitting={isSubmitting}
              hasErrors={hasErrors}
              onRescan={resetScan}
              onEditInForm={handleEditInForm}
              onSaveDraft={() => void handleSaveDraft()}
              onConfirmDirect={() => void handleConfirmDirect()}
            />
          </div>
        )}
      </div>
    </AdaptiveSheet>
  );
}
