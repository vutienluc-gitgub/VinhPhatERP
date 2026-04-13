interface ClearFilterButtonProps {
  onClick: () => void;
  label?: string;
}

import { Button } from './Button';

export function ClearFilterButton({
  onClick,
  label = 'Xóa lọc',
}: ClearFilterButtonProps) {
  return (
    <Button
      variant="secondary"
      leftIcon="X"
      className="text-danger border-danger/20"
      type="button"
      onClick={onClick}
    >
      {label}
    </Button>
  );
}
