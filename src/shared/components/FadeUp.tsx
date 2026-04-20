import { clsx } from 'clsx';
import type { ReactNode } from 'react';

interface FadeUpProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

/**
 * Premium Micro-Animation Component
 * Wraps content in an elegant staggered fade-up animation.
 */
export function FadeUp({ children, delay = 0, className }: FadeUpProps) {
  return (
    <div
      className={clsx('fade-up', className)}
      style={delay > 0 ? { animationDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
}
