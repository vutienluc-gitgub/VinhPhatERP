import { SCAN_WORKSPACE_LABELS } from '@/features/yarn-receipts/yarn-slip-scan.constants';
import { Icon } from '@/shared/components/Icon';

export interface ScanWorkspaceBannerProps {
  statusVariant: 'error' | 'warning' | 'passed';
  jobId: string;
  activeTab: 'image' | 'data';
  onTabChange: (tab: 'image' | 'data') => void;
}

export function ScanWorkspaceBanner({
  statusVariant,
  jobId,
  activeTab,
  onTabChange,
}: ScanWorkspaceBannerProps) {
  return (
    <>
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
          Job ID: {jobId.slice(0, 8)}
        </span>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="flex md:hidden border-b border-default">
        <button
          type="button"
          onClick={() => onTabChange('data')}
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
          onClick={() => onTabChange('image')}
          className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'image'
              ? 'border-[var(--primary)] text-[var(--primary)]'
              : 'border-transparent text-muted'
          }`}
        >
          {SCAN_WORKSPACE_LABELS.TAB_DOCUMENT_IMAGE}
        </button>
      </div>
    </>
  );
}
