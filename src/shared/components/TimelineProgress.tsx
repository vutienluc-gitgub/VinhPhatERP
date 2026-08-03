import { clsx } from 'clsx';
import type { ReactNode } from 'react';

import { Icon, type IconName } from './Icon';

export interface TimelineStep {
  id: string;
  title: string;
  subtitle?: string | ReactNode;
  icon?: IconName;
  status: 'completed' | 'current' | 'pending' | 'error';
  date?: string;
}

interface TimelineProgressProps {
  steps: TimelineStep[];
  className?: string;
  direction?: 'vertical' | 'horizontal';
}

/**
 * Premium Timeline Progress Component
 * Displays a vertical step-by-step timeline, perfect for Order tracking and Production flow.
 */
export function TimelineProgress({
  steps,
  className,
  direction = 'vertical',
}: TimelineProgressProps) {
  return (
    <div
      className={clsx(
        'flex w-full',
        direction === 'vertical'
          ? 'flex-col gap-0'
          : 'flex-row items-start justify-between gap-4 overflow-x-auto pb-4 scrollbar-none',
        className,
      )}
    >
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;
        const IconName = step.icon ?? 'Circle';

        // Colors mapping based on status
        const activeColor = {
          completed: 'bg-success text-white border-success',
          current:
            'bg-surface border-primary text-primary shadow-[0_0_8px_var(--primary)]',
          pending: 'bg-surface border-border text-muted',
          error: 'bg-danger text-white border-danger',
        }[step.status];

        const lineColorClass = {
          completed: 'bg-success',
          current: 'border-dashed border-border', // Rendered as border-l-2
          pending: 'bg-border',
          error: 'bg-danger',
        }[step.status];

        return (
          <div
            key={step.id}
            className={clsx(
              'relative group fade-up',
              direction === 'vertical'
                ? 'flex items-start gap-4'
                : 'flex flex-col items-center flex-1 min-w-[140px]',
            )}
            style={{ animationDelay: `${idx * 0.1}s` }}
          >
            {/* Timeline line connecting steps */}
            {!isLast && (
              <div
                className={clsx(
                  'absolute transition-colors duration-500',
                  direction === 'vertical'
                    ? 'left-4 top-8 bottom-[-16px] w-[2px] -translate-x-1/2'
                    : 'top-4 left-[50%] right-[-50%] h-[2px]',
                  step.status === 'current'
                    ? (direction === 'vertical' ? 'border-l-2' : 'border-t-2') +
                        ' border-dashed border-border bg-transparent'
                    : lineColorClass,
                )}
              />
            )}

            {/* Step Icon Node */}
            <div
              className={clsx(
                'relative z-10 flex flex-col items-center',
                direction === 'horizontal' && 'mb-3',
              )}
            >
              <div
                className={clsx(
                  'w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110',
                  activeColor,
                )}
              >
                {step.status === 'completed' ? (
                  <Icon name="Check" size={16} strokeWidth={3} />
                ) : (
                  <Icon name={IconName} size={14} strokeWidth={2.5} />
                )}
              </div>
            </div>

            {/* Step Content */}
            <div
              className={clsx(
                'transition-all duration-300',
                direction === 'vertical'
                  ? 'flex-1 mb-6 p-4 rounded-xl border'
                  : 'flex flex-col items-center text-center p-3 rounded-lg border w-full relative group-hover:shadow-md',
                step.status === 'completed' &&
                  'bg-success/10 border-success/20',
                step.status === 'current' &&
                  'bg-primary/10 border-primary/30 shadow-sm',
                step.status === 'error' && 'bg-danger/10 border-danger/20',
                step.status === 'pending' &&
                  'bg-transparent border-transparent pt-1 px-0',
              )}
            >
              <div
                className={clsx(
                  'flex',
                  direction === 'vertical'
                    ? 'justify-between items-start gap-2'
                    : 'flex-col items-center gap-1.5',
                )}
              >
                <div
                  className={clsx(
                    direction === 'horizontal' &&
                      'flex flex-col items-center w-full',
                  )}
                >
                  <h4
                    className={clsx(
                      'text-sm font-bold m-0',
                      step.status === 'completed' && 'text-success-700',
                      step.status === 'current' && 'text-primary-700',
                      step.status === 'error' && 'text-danger-700',
                      step.status === 'pending' && 'text-muted',
                    )}
                  >
                    {step.title}
                  </h4>
                  {step.subtitle && (
                    <div
                      className={clsx(
                        direction === 'vertical'
                          ? 'text-xs mt-1 leading-relaxed'
                          : 'text-[11px] leading-tight mt-1 px-1',
                        step.status === 'pending'
                          ? 'text-muted'
                          : 'text-text/80',
                      )}
                    >
                      {step.subtitle}
                    </div>
                  )}
                </div>
                {step.date && (
                  <div
                    className={clsx(
                      'font-semibold uppercase tracking-wider tabular-nums whitespace-nowrap',
                      direction === 'vertical'
                        ? 'text-[10px] pt-0.5'
                        : 'text-[9px] mt-1',
                      step.status === 'pending' ? 'text-muted' : 'text-text/60',
                    )}
                  >
                    {step.date}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
