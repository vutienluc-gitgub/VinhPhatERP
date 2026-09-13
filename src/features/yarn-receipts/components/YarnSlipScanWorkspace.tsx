import { useEffect, useMemo, useState } from 'react';

import { useYarnCatalogOptions } from '@/application/inventory';
import {
  findPoItemPrice,
  useLatestYarnPrice,
  useSupplierOpenPOs,
} from '@/features/yarn-receipts/hooks/useLatestYarnPrice';
import { useYarnSlipDirectTransaction } from '@/features/yarn-receipts/hooks/useYarnSlipDirectTransaction';
import { useYarnSlipScan } from '@/features/yarn-receipts/hooks/useYarnSlipScan';
import {
  mapScanResultToFormValues,
  matchYarnCatalog,
} from '@/features/yarn-receipts/utils/yarn-slip-prefill';
import { SCAN_WORKSPACE_LABELS } from '@/features/yarn-receipts/yarn-slip-scan.constants';
import type { YarnReceiptsFormValues } from '@/schema/yarn-receipt.schema';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';

import { ScanAuditDetails } from './scan/ScanAuditDetails';
import { ScanDocumentViewer } from './scan/ScanDocumentViewer';
import { ScanProcessingView } from './scan/ScanProcessingView';
import { ScanUploadDropzone } from './scan/ScanUploadDropzone';
import { ScanWorkspaceBanner } from './scan/ScanWorkspaceBanner';
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
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [selectedPoId, setSelectedPoId] = useState<string>('');
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

  const supplierId = scanResponse?.supplier_match.matchedSupplierId;
  const yarnCatalogId = catalogMatch?.matchedCatalogId;

  const { data: latestPrice, isLoading: isLoadingPrice } = useLatestYarnPrice({
    yarnCatalogId,
    supplierId,
  });

  const { data: openPos = [] } = useSupplierOpenPOs(supplierId);

  useEffect(() => {
    if (latestPrice && latestPrice.unitPrice > 0 && unitPrice === 0) {
      setUnitPrice(latestPrice.unitPrice);
    }
  }, [latestPrice, unitPrice]);

  const handleSelectPo = (poId: string) => {
    setSelectedPoId(poId);
    if (!poId) return;
    const chosenPo = openPos.find((p) => p.id === poId);
    const poPrice = findPoItemPrice(chosenPo, yarnCatalogId);
    if (poPrice && poPrice > 0) {
      setUnitPrice(poPrice);
    }
  };

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
    const mapped = mapScanResultToFormValues(scanResponse, {
      catalogs: yarnCatalogs,
      breakdownByPackages,
    });
    const chosenPo = openPos.find((p) => p.id === selectedPoId);
    const poNote = chosenPo ? `Theo đơn mua ${chosenPo.poCode}` : null;
    const mergedNotes = [mapped.notes, poNote].filter(Boolean).join(' - ');

    return {
      ...mapped,
      notes: mergedNotes || mapped.notes,
      items: (mapped.items || []).map((it) => ({
        ...it,
        unitPrice: unitPrice > 0 ? unitPrice : it.unitPrice,
      })),
    };
  }

  function handleResetAndClose() {
    setUnitPrice(0);
    setSelectedPoId('');
    resetScan();
    onClose();
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
    handleResetAndClose();
  }

  async function handleSaveDraft() {
    const prefillValues = getPrefillValues();
    if (!prefillValues) return;

    try {
      await createDraftReceipt(prefillValues, scanResponse?.job_id);
      handleResetAndClose();
    } catch (_err) {
      // Handled by hook toast
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
      await confirmDirectReceipt(prefillValues, scanResponse?.job_id);
      handleResetAndClose();
    } catch (_err) {
      // Handled by hook toast
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
            <ScanWorkspaceBanner
              statusVariant={statusVariant}
              jobId={scanResponse.job_id}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

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
                unitPrice={unitPrice}
                onPriceChange={setUnitPrice}
                selectedPoId={selectedPoId}
                onSelectPo={handleSelectPo}
                openPos={openPos}
                latestPrice={latestPrice}
                isLoadingPrice={isLoadingPrice}
              />
            </div>

            <ScanWorkspaceFooter
              isSubmitting={isSubmitting}
              hasErrors={hasErrors}
              onRescan={handleResetAndClose}
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
