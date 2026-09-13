import { SCAN_WORKSPACE_LABELS } from '@/features/yarn-receipts/yarn-slip-scan.constants';
import { Button } from '@/shared/components/Button';

export interface ScanWorkspaceFooterProps {
  isSubmitting: boolean;
  hasErrors: boolean;
  onRescan: () => void;
  onEditInForm: () => void;
  onSaveDraft: () => void;
  onConfirmDirect: () => void;
}

export function ScanWorkspaceFooter({
  isSubmitting,
  hasErrors,
  onRescan,
  onEditInForm,
  onSaveDraft,
  onConfirmDirect,
}: ScanWorkspaceFooterProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 pt-3 border-t border-default">
      <Button
        variant="outline"
        type="button"
        leftIcon="RefreshCw"
        onClick={onRescan}
        disabled={isSubmitting}
      >
        {SCAN_WORKSPACE_LABELS.BTN_RESCAN}
      </Button>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <Button
          variant="outline"
          type="button"
          leftIcon="Edit3"
          onClick={onEditInForm}
          disabled={isSubmitting}
        >
          {SCAN_WORKSPACE_LABELS.BTN_EDIT_IN_FORM}
        </Button>

        <Button
          variant="outline"
          type="button"
          leftIcon="FileText"
          onClick={onSaveDraft}
          disabled={isSubmitting}
        >
          {SCAN_WORKSPACE_LABELS.BTN_SAVE_DRAFT_DIRECT}
        </Button>

        <Button
          variant="primary"
          type="button"
          leftIcon="CheckCircle"
          onClick={onConfirmDirect}
          disabled={isSubmitting || hasErrors}
        >
          {SCAN_WORKSPACE_LABELS.BTN_CONFIRM_DIRECT}
        </Button>
      </div>
    </div>
  );
}
