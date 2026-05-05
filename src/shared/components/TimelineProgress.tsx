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
}

/**
 * Premium Timeline Progress Component
 * Displays a vertical step-by-step timeline, perfect for Order tracking and Production flow.
 */
export function TimelineProgress({ steps, className }: TimelineProgressProps) {
  return (
    <div className={clsx('flex flex-col gap-0 w-full', className)}>
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
            className="relative flex items-start gap-4 group fade-up"
            style={{ animationDelay: `${idx * 0.1}s` }}
          >
            {/* Timeline line connecting steps */}
            {!isLast && (
              <div
                className={clsx(
                  'absolute left-4 top-8 bottom-[-16px] w-[2px] -translate-x-1/2 transition-colors duration-500',
                  step.status === 'current'
                    ? 'border-l-2 border-dashed border-border bg-transparent'
                    : lineColorClass,
                )}
              />
            )}

            {/* Step Icon Node */}
            <div className="relative z-10 flex flex-col items-center">
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
                'flex-1 mb-6 p-4 rounded-xl border transition-all duration-300',
                step.status === 'completed' &&
                  'bg-success/10 border-success/20',
                step.status === 'current' &&
                  'bg-primary/10 border-primary/30 shadow-sm',
                step.status === 'error' && 'bg-danger/10 border-danger/20',
                step.status === 'pending' &&
                  'bg-transparent border-transparent pt-1 px-0',
              )}
            >
              <div className="flex justify-between items-start gap-2">
                <div>
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
                        'text-xs mt-1 leading-relaxed',
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
                      'text-[10px] font-semibold uppercase tracking-wider tabular-nums whitespace-nowrap pt-0.5',
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
