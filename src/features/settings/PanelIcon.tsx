import { Icon, type IconName } from '@/shared/components/Icon';
import { cn } from '@/shared/utils/cn';

export type PanelIconVariant =
  | 'primary'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'purple'
  | 'pink';

interface PanelIconProps {
  name: IconName;
  /** Semantic color variant */
  variant?: PanelIconVariant;
  size?: number;
  className?: string;
}

const VARIANT_CLASSES: Record<PanelIconVariant, string> = {
  primary: 'bg-primary/10 text-primary',
  info: 'bg-info-soft/10 text-info',
  success: 'bg-success-soft/10 text-success',
  warning: 'bg-warning-soft/10 text-warning',
  danger: 'bg-danger-soft/10 text-danger',
  purple: 'bg-purple-500/10 text-purple-600',
  pink: 'bg-pink-500/10 text-pink-600',
};

/**
 * PanelIcon — Icon badge wrapper dùng trong header của mỗi settings panel.
 * Đảm bảo đồng bộ 100% về kích thước, bo góc và màu sắc Design Tokens.
 *
 * @example
 * <PanelIcon name="Printer" variant="primary" />
 */
export function PanelIcon({
  name,
  variant = 'info',
  size = 20,
  className,
}: PanelIconProps) {
  return (
    <div
      className={cn(
        'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      <Icon name={name} size={size} strokeWidth={1.5} />
    </div>
  );
}
