import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  MouseEvent,
  ReactNode,
} from 'react';
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
        gray: 'bg-surface-secondary text-muted-foreground',
        purple: 'bg-[rgba(155,89,182,0.12)] text-[#7d3c98]',
        primary: 'bg-brand-soft text-foreground',
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

/* ── Icon / Dot discriminated union ── */
type IconDotUnion =
  | { icon: IconName; showDot?: never; iconSize?: number }
  | { icon?: never; showDot?: boolean; iconSize?: never };

/* ── Shared visual props ── */
type BadgeBaseProps = {
  variant?: BadgeVariant;
  className?: string;
  children?: ReactNode;
} & IconDotUnion;

/* ── Static Badge → <span> ── */
type BadgeStaticProps = BadgeBaseProps &
  Omit<HTMLAttributes<HTMLSpanElement>, 'color' | 'className' | 'children'> & {
    onFilter?: undefined;
    filterTooltip?: never;
  };

/* ── Filterable Badge → <button> ── */
type BadgeFilterProps = BadgeBaseProps &
  Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'className' | 'children' | 'onClick' | 'type'
  > & {
    /** Required — turns Badge into a <button> with filter behavior */
    onFilter: (e: MouseEvent<HTMLButtonElement>) => void;
    /** Default: "Nhấn để lọc" */
    filterTooltip?: string;
  };

export type BadgeProps = BadgeStaticProps | BadgeFilterProps;

/* ── Type guard ── */
function isFilterable(props: BadgeProps): props is BadgeFilterProps {
  return 'onFilter' in props && typeof props.onFilter === 'function';
}

function renderBadgeInner(
  children?: ReactNode,
  icon?: IconName,
  iconSize = 14,
  showDot?: boolean,
) {
  return (
    <>
      {icon && <Icon name={icon} size={iconSize} />}
      {showDot && (
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current shadow-[0_0_6px_currentColor]" />
      )}
      {children}
    </>
  );
}

/**
 * A standardized Badge component for status tags and labels.
 *
 * Two modes via discriminated union:
 * - **Static** (default): Renders `<span>`, no interaction.
 * - **Filterable**: Pass `onFilter` to render `<button>` with
 *   `stopPropagation`, tooltip, keyboard A11Y (native `<button>`).
 */
export function Badge(props: BadgeProps) {
  const { variant, className, icon, iconSize, showDot, children } = props;

  const baseClasses = cn(badgeVariants({ variant, className }));

  // ── Static Badge → <span> ──
  if (!isFilterable(props)) {
    const {
      variant: _v,
      className: _c,
      icon: _i,
      iconSize: _is,
      showDot: _sd,
      children: _ch,
      onFilter: _of,
      ...spanRest
    } = props;

    return (
      <span className={baseClasses} {...spanRest}>
        {renderBadgeInner(children, icon, iconSize, showDot)}
      </span>
    );
  }

  // ── Filterable Badge → <button> ──
  const {
    variant: _v,
    className: _c,
    icon: _i,
    iconSize: _is,
    showDot: _sd,
    children: _ch,
    onFilter,
    filterTooltip,
    ...buttonRest
  } = props;

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onFilter(e);
  };

  return (
    <button
      type="button"
      {...buttonRest}
      className={cn(
        baseClasses,
        'cursor-pointer transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md',
      )}
      title={filterTooltip ?? 'Nhấn để lọc'}
      onClick={handleClick}
    >
      {renderBadgeInner(children, icon, iconSize, showDot)}
    </button>
  );
}

Badge.displayName = 'Badge';
