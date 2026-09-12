import type { ReconciliationReport } from '@/integration/sync';
import { Button, Icon } from '@/shared/components';
import { SYNC_MONITOR_LABELS } from '@/features/settings/sync-monitor.constants';
import { formatDateTime } from '@/features/settings/sync-monitor.utils';

interface ReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ReconciliationReport | null;
}

export function ReconciliationModal({
  isOpen,
  onClose,
  report,
}: ReconciliationModalProps) {
  if (!isOpen || !report) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="panel-card max-w-2xl w-full shadow-2xl overflow-hidden animate-scale-up">
        <div className="card-header-area bg-surface-secondary/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-info-soft/20 text-info flex items-center justify-center shrink-0">
                <Icon name="RotateCcw" size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground m-0">
                  {SYNC_MONITOR_LABELS.RECONCILE_MODAL_TITLE}
                </h3>
                <p className="text-xs text-muted m-0">
                  {SYNC_MONITOR_LABELS.RECONCILE_MODAL_SUBTITLE}
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              type="button"
              onClick={onClose}
              className="p-1.5 h-auto text-muted hover:text-foreground"
            >
              <Icon name="X" size={16} />
            </Button>
          </div>
        </div>

        <div className="p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-secondary border border-border/40 text-xs">
            <span className="text-muted">
              {SYNC_MONITOR_LABELS.RECONCILE_EXEC_TIME}
            </span>
            <span className="font-mono font-semibold text-foreground">
              {formatDateTime(report.scannedAt)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Shipments Summary */}
            <div className="p-4 rounded-xl border border-border/60 bg-surface flex flex-col gap-3">
              <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                <Icon name="FileText" size={16} className="text-primary" />
                <span className="font-bold text-sm text-foreground">
                  {SYNC_MONITOR_LABELS.ENTITY_SHIPMENT}
                </span>
              </div>
              <div className="flex flex-col gap-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted">
                    {SYNC_MONITOR_LABELS.RECONCILE_SCANNED}:
                  </span>
                  <span className="font-bold text-foreground">
                    {report.shipments.scanned}
                  </span>
                </div>
                <div className="flex justify-between text-success">
                  <span>{SYNC_MONITOR_LABELS.RECONCILE_MISSING_FIXED}:</span>
                  <span className="font-bold">
                    {report.shipments.missingFixed}
                  </span>
                </div>
                <div className="flex justify-between text-warning">
                  <span>{SYNC_MONITOR_LABELS.RECONCILE_STALE_UPDATED}:</span>
                  <span className="font-bold">
                    {report.shipments.staleUpdated}
                  </span>
                </div>
                <div className="flex justify-between text-danger">
                  <span>{SYNC_MONITOR_LABELS.RECONCILE_ORPHAN_DETECTED}:</span>
                  <span className="font-bold">
                    {report.shipments.orphanDetected}
                  </span>
                </div>
              </div>
            </div>

            {/* Orders Summary */}
            <div className="p-4 rounded-xl border border-border/60 bg-surface flex flex-col gap-3">
              <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                <Icon name="Clock" size={16} className="text-info" />
                <span className="font-bold text-sm text-foreground">
                  {SYNC_MONITOR_LABELS.ENTITY_ORDER}
                </span>
              </div>
              <div className="flex flex-col gap-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted">
                    {SYNC_MONITOR_LABELS.RECONCILE_SCANNED}:
                  </span>
                  <span className="font-bold text-foreground">
                    {report.orders.scanned}
                  </span>
                </div>
                <div className="flex justify-between text-success">
                  <span>{SYNC_MONITOR_LABELS.RECONCILE_MISSING_FIXED}:</span>
                  <span className="font-bold">
                    {report.orders.missingFixed}
                  </span>
                </div>
                <div className="flex justify-between text-warning">
                  <span>{SYNC_MONITOR_LABELS.RECONCILE_STALE_UPDATED}:</span>
                  <span className="font-bold">
                    {report.orders.staleUpdated}
                  </span>
                </div>
                <div className="flex justify-between text-danger">
                  <span>{SYNC_MONITOR_LABELS.RECONCILE_ORPHAN_DETECTED}:</span>
                  <span className="font-bold">
                    {report.orders.orphanDetected}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-success-soft/20 border border-success/30 flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">
              {SYNC_MONITOR_LABELS.RECONCILE_TOTAL_JOBS}
            </span>
            <span className="text-xl font-extrabold text-success">
              {report.totalJobsCreated}
            </span>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="secondary" type="button" onClick={onClose}>
              {SYNC_MONITOR_LABELS.RECONCILE_CLOSE}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
