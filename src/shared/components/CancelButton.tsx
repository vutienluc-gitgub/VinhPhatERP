interface CancelButtonProps {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
}

import { Button } from './Button';

export function CancelButton({
  onClick,
  label = 'Hủy',
  disabled = false,
}: CancelButtonProps) {
  return (
    <Button
      variant="secondary"
      type="button"
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}
