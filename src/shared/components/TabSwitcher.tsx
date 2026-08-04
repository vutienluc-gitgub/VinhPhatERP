import { clsx } from 'clsx';
import type { ReactNode } from 'react';

export interface TabItem<T extends string> {
  key: T;
  label: string;
  icon?: ReactNode;
  badge?: number;
}

interface Props<T extends string> {
  tabs: TabItem<T>[];
  active: T;
  onChange: (key: T) => void;
  /** sm: compact mode for use inside widget headers or tight spaces */
  size?: 'default' | 'sm';
  className?: string;
}

export function TabSwitcher<T extends string>({
  tabs,
  active,
  onChange,
  size = 'default',
  className,
}: Props<T>) {
  const smBarClass = size === 'sm' ? 'p-0.5' : undefined;
  const smItemClass = size === 'sm' ? 'px-2 py-1 text-[11px]' : undefined;

  return (
    <div
      className={clsx(
        'tab-bar-underline',
        smBarClass,
        'w-full min-w-0 max-w-full',
        className,
      )}
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={active === tab.key}
          className={clsx(
            'tab-item-underline',
            smItemClass,
            active === tab.key && 'text-primary bg-primary/10',
          )}
          onClick={() => onChange(tab.key)}
        >
          {tab.icon}
          {tab.label}
          {tab.badge !== undefined && tab.badge > 0 && (
            <span
              className={clsx(
                'tab-badge',
                active === tab.key && 'tab-badge--active',
              )}
            >
              {tab.badge > 99 ? '99+' : tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
