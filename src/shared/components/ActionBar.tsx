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

export function ActionBar({ actions }: ActionBarProps) {
  if (!actions || actions.length === 0) return null;

  const items = actions.map((action) => ({
    label: action.title || 'Thao tác',
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
