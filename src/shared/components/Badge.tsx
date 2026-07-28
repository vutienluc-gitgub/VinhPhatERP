import { type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/shared/utils/cn';

import { Icon, type IconName } from './Icon';

const badgeVariants = cva(
  'inline-flex items-center justify-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold leading-tight whitespace-nowrap transition-colors',
  {
    variants: {
      variant: {
        success: 'bg-success-soft text-success',
        warning: 'bg-warning-soft text-warning',
        danger: 'bg-danger-soft text-danger',
        info: 'bg-info-soft text-info',
        gray: 'bg-surface-secondary text-muted',
        purple: 'bg-[rgba(155,89,182,0.12)] text-[#7d3c98]', // Có thể thay bằng token nếu đã định nghĩa
        primary: 'bg-brand-soft text-primary',
        default: 'bg-surface-secondary text-text',
      },
    },
    defaultVariants: {
      variant: 'gray',
    },
  },
);

export type BadgeVariant = NonNullable<
  VariantProps<typeof badgeVariants>['variant']
>;

type BaseProps = Omit<HTMLAttributes<HTMLSpanElement>, 'color'> &
  VariantProps<typeof badgeVariants>;

export type BadgeProps = BaseProps &
  (
    | {
        icon: IconName;
        showDot?: never;
        iconSize?: number;
      }
    | {
        showDot: true;
        icon?: never;
        iconSize?: never;
      }
    | {
        icon?: undefined;
        showDot?: false;
        iconSize?: never;
      }
  );

/**
 * A standardized Badge component for status tags and labels.
 * Designed with a type-safe discriminated union for icon/dot mutually exclusive rendering.
 */
export function Badge({
  children,
  variant,
  className,
  icon,
  iconSize = 14,
  showDot,
  ...rest
}: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, className }))} {...rest}>
      {icon && <Icon name={icon} size={iconSize} />}
      {showDot && (
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current shadow-[0_0_6px_currentColor]" />
      )}
      {children}
    </span>
  );
}

Badge.displayName = 'Badge';
