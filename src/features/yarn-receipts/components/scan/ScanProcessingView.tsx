import { SCAN_WORKSPACE_LABELS } from '@/features/yarn-receipts/yarn-slip-scan.constants';
import { Icon } from '@/shared/components/Icon';

export interface ScanProcessingViewProps {
  scanStage: number;
}

export function ScanProcessingView({ scanStage }: ScanProcessingViewProps) {
  return (
    <div className="py-16 text-center space-y-6 max-w-md mx-auto">
      <div className="relative w-16 h-16 mx-auto">
        <div className="w-16 h-16 border-4 border-default border-t-[var(--primary)] rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-[var(--primary)]">
          <Icon name="Scan" size={22} />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">
          {SCAN_WORKSPACE_LABELS.PROCESSING_HEADING}
        </h3>
        <p className="text-xs text-muted min-h-[1.5rem]">
          {scanStage === 1 && SCAN_WORKSPACE_LABELS.STAGE_UPLOAD}
          {scanStage === 2 && SCAN_WORKSPACE_LABELS.STAGE_GATE_0}
          {scanStage === 3 && SCAN_WORKSPACE_LABELS.STAGE_EXTRACTION}
          {scanStage >= 4 && SCAN_WORKSPACE_LABELS.STAGE_AUDIT}
        </p>
      </div>

      {/* Progress steps bar */}
      <div className="grid grid-cols-4 gap-2 pt-2">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`h-1.5 rounded-full transition-colors ${
              step <= scanStage ? 'bg-[var(--primary)]' : 'bg-surface-secondary'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
