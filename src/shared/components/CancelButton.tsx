interface CancelButtonProps {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

import { Button } from './Button';

export function CancelButton({
  onClick,
  label = 'Hủy',
  disabled = false,
  className,
}: CancelButtonProps) {
  return (
    <Button
      variant="secondary"
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={className}
    >
      {label}
    </Button>
  );
}
