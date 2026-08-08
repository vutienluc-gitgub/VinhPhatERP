import { Button } from '@/shared/components/Button';
import { Icon } from '@/shared/components/Icon';
import type { IconName } from '@/shared/components/Icon';

interface FABProps {
  icon?: IconName;
  onClick: () => void;
  label?: string; // Dùng cho màn hình desktop nếu cần text
  className?: string;
  disabled?: boolean;
}

export function FAB({
  icon = 'Plus',
  onClick,
  label,
  className = '',
  disabled = false,
}: FABProps) {
  return (
    <Button
      variant="primary"
      onClick={onClick}
      disabled={disabled}
      className={`fixed z-40 flex items-center justify-center w-14 h-14 text-inverse-foreground transition-all duration-200 rounded-full shadow-lg hover:scale-105 active:scale-95 right-4 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      // Tính toán bottom: padding Bottom Tab Bar (khoảng 60px) + 16px khoảng cách = bottom-20 (80px)
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 80px)' }}
      title={label}
      aria-label={label || 'Action'}
    >
      <Icon name={icon} size={24} strokeWidth={2} />
    </Button>
  );
}
