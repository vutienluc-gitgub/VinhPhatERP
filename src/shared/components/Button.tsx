import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { Slot } from '@radix-ui/react-slot';

import { Icon } from './Icon';
import type { IconName } from './Icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Semantic variants matching the project's design system.
   * Maps to CSS classes in data-ui.css (btn-primary, btn-secondary, etc.)
   */
  variant?:
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'ghost'
    | 'danger'
    | 'success'
    | 'warning'
    | 'info';
  /**
   * Unified size system.
   * - sm: compact, 36px min (use sparingly — below 44px touch target)
   * - md: default, 44px min (touch-friendly baseline)
   * - lg: prominent CTA, 52px min
   * - icon: square icon-only, 44px min
   */
  size?: 'sm' | 'md' | 'lg' | 'icon';
  /** Displays a spinner and disables the button. */
  isLoading?: boolean;
  /** Lucide icon name to display on the left. */
  leftIcon?: IconName;
  /** Lucide icon name to display on the right. */
  rightIcon?: IconName;
  /** Expand to full width of container. */
  fullWidth?: boolean;
  /** Use Radix Slot pattern to merge props onto a child component (e.g. Link). */
  asChild?: boolean;
}

/* ── Static maps hoisted outside render to avoid re-creation ── */

const VARIANT_CLASSES: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  success: 'btn-success',
  warning: 'btn-warning',
  danger: 'btn-danger',
  info: 'btn-info',
  outline:
    'border border-border bg-transparent text-text active:bg-primary/[0.06]',
  ghost:
    'bg-transparent text-muted active:text-foreground active:bg-surface-subtle',
};

const SIZE_CLASSES: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-sm min-h-[36px] gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-lg min-h-[44px] gap-2',
  lg: 'px-6 py-3.5 text-base rounded-lg min-h-[52px] gap-2.5',
  icon: 'p-2.5 rounded-lg aspect-square min-h-[44px] min-w-[44px]',
};

/** Icon sizes follow icon-system rules: Small=16, Default=20 */
const ICON_SIZE: Record<NonNullable<ButtonProps['size']>, number> = {
  sm: 16,
  md: 20,
  lg: 20,
  icon: 20,
};

const BASE_STYLES =
  'inline-flex items-center justify-center font-bold transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 select-none';

/**
 * Premium Button component following the project's design system.
 *
 * Features:
 *   - Semantic variants: primary, secondary, success, warning, info, danger, outline, ghost.
 *   - Radix Slot pattern (asChild) for seamless router Link integration.
 *   - Gap-based spacing for consistent icon/spinner alignment.
 *   - Touch-friendly: md/lg/icon ≥ 44px. sm = 36px (use sparingly).
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      asChild = false,
      children,
      disabled,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const Component = asChild ? Slot : 'button';
    const iconSize = ICON_SIZE[size];

    return (
      <Component
        ref={ref}
        type={asChild ? undefined : type}
        disabled={isLoading || disabled}
        className={clsx(
          BASE_STYLES,
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <div
            className={clsx(
              'animate-spin rounded-full border-2 border-current border-t-transparent',
              size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4',
            )}
            aria-hidden="true"
          />
        ) : (
          leftIcon && <Icon name={leftIcon} size={iconSize} />
        )}

        {children}

        {!isLoading && rightIcon && <Icon name={rightIcon} size={iconSize} />}
      </Component>
    );
  },
);

Button.displayName = 'Button';
