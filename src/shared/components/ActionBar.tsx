import { Icon } from './Icon';
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
  return (
    <div className="flex justify-end gap-1">
      {actions.map((action, idx) => (
        <button
          key={idx}
          type="button"
          className={`btn-icon${action.variant === 'danger' ? ' danger' : ''}`}
          title={action.title}
          disabled={action.disabled}
          onClick={action.onClick}
        >
          <Icon name={action.icon} size={16} />
        </button>
      ))}
    </div>
  );
}
