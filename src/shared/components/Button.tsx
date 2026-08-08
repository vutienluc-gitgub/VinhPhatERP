import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot, Slottable } from '@radix-ui/react-slot';

import { cn } from '@/shared/utils/cn';

import { Icon } from './Icon';
import type { IconName } from './Icon';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-bold transition-all duration-200 active:scale-[0.98] aria-disabled:pointer-events-none aria-disabled:opacity-50 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 select-none',
  {
    variants: {
      variant: {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        success: 'btn-success',
        warning: 'btn-warning',
        danger: 'btn-danger',
        info: 'btn-info',
        outline:
          'border border-border bg-transparent text-text active:bg-primary/[0.06]',
        ghost:
          'bg-transparent text-muted-foreground active:text-foreground active:bg-surface-subtle',
      },
      size: {
        sm: 'px-4 py-2 text-xs rounded-sm min-h-[36px] gap-1.5',
        md: 'px-5 py-3 text-sm rounded-sm min-h-[44px] gap-2',
        lg: 'px-6 py-3.5 text-base rounded-sm min-h-[52px] gap-2.5',
        icon: 'p-2.5 rounded-sm aspect-square min-h-[44px] min-w-[44px]',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  },
);

export interface ButtonProps
  extends
    ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Displays a spinner and disables the button. */
  isLoading?: boolean;
  /** Lucide icon name to display on the left. */
  leftIcon?: IconName;
  /** Lucide icon name to display on the right. */
  rightIcon?: IconName;
  /** Use Radix Slot pattern to merge props onto a child component (e.g. Link). */
  asChild?: boolean;
}

/* ── Static maps hoisted outside render to avoid re-creation ── */

/** Icon sizes follow icon-system rules: Small=16, Default=20 */
const ICON_SIZE: Record<NonNullable<ButtonProps['size']>, number> = {
  sm: 16,
  md: 20,
  lg: 20,
  icon: 20,
};

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
    const iconSize = ICON_SIZE[size || 'md'];
    const isDisabled = isLoading || disabled;

    return (
      <Component
        ref={ref}
        type={asChild ? undefined : type}
        disabled={asChild ? undefined : isDisabled}
        aria-disabled={isDisabled}
        aria-busy={isLoading}
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        {...props}
      >
        {isLoading ? (
          <div
            className={cn(
              'animate-spin rounded-full border-2 border-current border-t-transparent',
              size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4',
            )}
            aria-hidden="true"
          />
        ) : (
          leftIcon && <Icon name={leftIcon} size={iconSize} />
        )}

        <Slottable>{children}</Slottable>

        {!isLoading && rightIcon && <Icon name={rightIcon} size={iconSize} />}
      </Component>
    );
  },
);

Button.displayName = 'Button';
