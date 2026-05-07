import { ActionMenu } from './ActionMenu';
import type { IconName } from './Icon';

export interface ActionConfig {
  icon: IconName;
  onClick: () => void;
  title?: string;
  disabled?: boolean;
  variant?: 'default' | 'danger';
}

interface ActionBarProps {
  actions: ActionConfig[];
}

const ICON_LABEL_MAP: Partial<Record<IconName, string>> = {
  Edit3: 'Sửa',
  Pencil: 'Sửa',
  Trash2: 'Xóa',
  Eye: 'Xem chi tiết',
  Copy: 'Sao chép',
  Download: 'Tải xuống',
  Send: 'Gửi',
  CheckCircle: 'Xác nhận',
  XCircle: 'Hủy',
  MoreHorizontal: 'Thao tác',
};

export function ActionBar({ actions }: ActionBarProps) {
  if (!actions || actions.length === 0) return null;

  const items = actions.map((action) => ({
    label: action.title || ICON_LABEL_MAP[action.icon] || 'Thao tác',
    icon: action.icon,
    onClick: action.onClick,
    danger: action.variant === 'danger',
    disabled: action.disabled,
  }));

  return (
    <div className="flex justify-end">
      <ActionMenu items={items} />
    </div>
  );
}
