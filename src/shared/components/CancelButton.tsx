interface CancelButtonProps {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
}

export function CancelButton({
  onClick,
  label = 'Huy',
  disabled = false,
}: CancelButtonProps) {
  return (
    <button
      type="button"
      className="btn-secondary"
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
