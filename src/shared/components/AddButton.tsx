import { Icon } from './Icon';
import type { IconName } from './Icon';

interface AddButtonProps {
  onClick: () => void;
  label: string;
  icon?: IconName;
  disabled?: boolean;
}

export function AddButton({
  onClick,
  label,
  icon = 'Plus',
  disabled = false,
}: AddButtonProps) {
  return (
    <button
      type="button"
      className="btn-primary"
      style={{
        minHeight: 42,
        padding: '0 1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
      }}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon name={icon} size={18} />
      {label}
    </button>
  );
}
