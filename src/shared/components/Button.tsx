import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { Slot } from '@radix-ui/react-slot';

import { Icon } from './Icon';
import type { IconName } from './Icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Semantic variants matching the project's design system.
   * Standardized with gradients and shadows in data-ui.css.
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
   * Unified size system. Min-height 44px for md/icon (touch-friendly).
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

/**
 * Premium Button component following the project's design system.
 * Optimized for mobile-first interactions and consistent premium aesthetics.
 * Features:
 *   - Semantic variants: primary, secondary, success, warning, info, danger.
 *   - Pro-level Slot pattern (asChild) for seamless router integration.
 *   - Clean positioning: justify-center + gap-based spacing.
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

    // Base styles: Standardized font-weight across all sizes to prevent jumpy layout
    const baseStyles =
      'inline-flex items-center justify-center font-bold transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 select-none overflow-hidden';

    // Semantic Variants mapping to data-ui.css
    const variants = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      success: 'btn-success',
      warning: 'btn-warning',
      danger: 'btn-danger',
      info: 'btn-info',
      outline:
        'border-1.5 border-border bg-transparent text-text hover:border-primary hover:text-primary hover:bg-primary/[0.04]',
      ghost:
        'bg-transparent text-muted hover:text-foreground hover:bg-surface-subtle',
    };

    // Standardized Size system: gap-based spacing prevents icon/spinner misalignment
    const sizes = {
      sm: 'px-3 py-1.5 text-xs rounded-sm min-h-[32px] gap-1.5',
      md: 'px-4 py-2.5 text-sm rounded-md min-h-[44px] gap-2',
      lg: 'px-6 py-4 text-base rounded-lg min-h-[54px] gap-2.5',
      icon: 'p-2.5 rounded-md aspect-square min-h-[44px] min-w-[44px]',
    };

    const iconSize = size === 'sm' ? 16 : 18;

    return (
      <Component
        ref={ref}
        type={asChild ? undefined : type}
        disabled={isLoading || disabled}
        className={clsx(
          baseStyles,
          variants[variant],
          sizes[size],
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
