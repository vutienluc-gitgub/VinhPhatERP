import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { APP_SHELL_LABELS, QUICK_ACTIONS } from '@/shared/constants/layout';
import { UI_LABELS } from '@/shared/constants/ui.constants';
import { Button } from '@/shared/components/Button';
import { Icon } from '@/shared/components/Icon';

type QuickCreateModalProps = {
  actionPath: string | null;
  onClose: () => void;
};

export function QuickCreateModal({
  actionPath,
  onClose,
}: QuickCreateModalProps) {
  const action = QUICK_ACTIONS.find((a) => a.path === actionPath);

  if (!action) return null;

  return (
    <AdaptiveSheet
      open={!!actionPath}
      onClose={onClose}
      title={`${APP_SHELL_LABELS.QUICK_CREATE_TITLE_PREFIX} ${action.label}`}
      size="md"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="secondary" onClick={onClose}>
            {UI_LABELS.CANCEL}
          </Button>
          <Button variant="primary" onClick={onClose} leftIcon="Save">
            {UI_LABELS.SAVE}
          </Button>
        </div>
      }
    >
      <div className="p-6 flex flex-col items-center justify-center text-center gap-4 min-h-[300px]">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center">
          <Icon name={action.icon} size={32} />
        </div>
        <div>
          <h3 className="text-lg font-bold mb-2">
            {APP_SHELL_LABELS.QUICK_CREATE_DEV_TITLE}
          </h3>
          <p className="text-muted text-sm max-w-sm">
            {APP_SHELL_LABELS.QUICK_CREATE_DEV_DESC.replace(
              '{action}',
              action.label,
            )}
          </p>
        </div>
      </div>
    </AdaptiveSheet>
  );
}
