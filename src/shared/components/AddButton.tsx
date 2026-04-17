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
      className="btn-primary min-h-[42px] px-5 flex items-center gap-1.5"
      disabled={disabled}
      onClick={onClick}
    >
      <Icon name={icon} size={18} />
      {label}
    </button>
  );
}
