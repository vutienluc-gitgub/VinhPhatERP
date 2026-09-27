import { useCallback } from 'react';

import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { Icon } from '@/shared/components/Icon';
import { APP_SHELL_LABELS, QUICK_ACTIONS } from '@/shared/constants/layout';
import { HAPTIC_PATTERNS, triggerHapticFeedback } from '@/shared/lib/haptics';

type QuickActionsSheetProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (path: string) => void;
};

/** Danh sách tác vụ tạo mới nhanh, mở từ nút "+" trên Floating Dock. */
export function QuickActionsSheet({
  open,
  onClose,
  onSelect,
}: QuickActionsSheetProps) {
  const handleSelect = useCallback(
    (path: string) => () => {
      triggerHapticFeedback(HAPTIC_PATTERNS.SELECTION);
      onClose();
      onSelect(path);
    },
    [onClose, onSelect],
  );

  return (
    <AdaptiveSheet
      open={open}
      onClose={onClose}
      title={APP_SHELL_LABELS.QUICK_CREATE}
      size="sm"
    >
      <ul className="flex flex-col gap-1 p-1">
        {QUICK_ACTIONS.map((action) => (
          <li key={action.path}>
            <button
              type="button"
              className="quick-create-row"
              onClick={handleSelect(action.path)}
            >
              <span className="quick-create-row-icon">
                <Icon name={action.icon} size={20} strokeWidth={1.7} />
              </span>
              <span className="quick-create-row-label">{action.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </AdaptiveSheet>
  );
}
