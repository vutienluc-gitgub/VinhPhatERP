import { Icon } from './Icon';

interface ClearFilterButtonProps {
  onClick: () => void;
  label?: string;
}

export function ClearFilterButton({
  onClick,
  label = 'Xóa lọc',
}: ClearFilterButtonProps) {
  return (
    <button
      type="button"
      className="btn-secondary text-danger border-danger/20 flex items-center gap-2"
      onClick={onClick}
    >
      <Icon name="X" size={14} />
      {label}
    </button>
  );
}
