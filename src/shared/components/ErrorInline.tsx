import type { ReactNode } from 'react';

type ErrorInlineProps = {
  children: ReactNode;
  className?: string;
  /** Use 'sm' for compact variant inside data tables */
  size?: 'default' | 'sm';
};

/**
 * Accessible error message component with `role="alert"`.
 *
 * Replaces raw `<p className="error-inline">` so that screen readers
 * are automatically notified when an error appears.
 */
export function ErrorInline({
  children,
  className,
  size = 'default',
}: ErrorInlineProps) {
  const base = size === 'sm' ? 'error-inline-sm' : 'error-inline';
  const cls = className ? `${base} ${className}` : base;

  return (
    <p className={cls} role="alert">
      {children}
    </p>
  );
}
