import { motion } from 'framer-motion';

import { cn } from '@/shared/utils/cn';

export interface FilterOption<T extends string> {
  id: T;
  label: string;
}

export interface FilterChipsProps<T extends string> {
  options: FilterOption<T>[];
  activeValue: T;
  onChange: (value: T) => void;
  className?: string;
  layoutIdPrefix?: string; // Used to prevent layoutId collisions if multiple instances are rendered
}

export function FilterChips<T extends string>({
  options,
  activeValue,
  onChange,
  className,
  layoutIdPrefix = 'filter-chip',
}: FilterChipsProps<T>) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-hide',
        className,
      )}
    >
      {options.map((opt) => {
        const isActive = activeValue === opt.id;

        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={cn(
              'relative px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              isActive
                ? 'text-primary-foreground'
                : 'bg-surface-secondary text-muted-foreground hover:text-foreground hover:bg-surface-secondary/80',
            )}
          >
            {isActive && (
              <motion.div
                layoutId={`${layoutIdPrefix}-active`}
                className="absolute inset-0 bg-primary rounded-full shadow-sm"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
