import { Button } from './Button';
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
    <Button
      variant="primary"
      disabled={disabled}
      onClick={onClick}
      leftIcon={icon}
      className="px-5"
    >
      {label}
    </Button>
  );
}
