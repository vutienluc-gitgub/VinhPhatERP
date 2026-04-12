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
  variant?: 'boxed' | 'underline';
}

export function TabSwitcher<T extends string>({
  tabs,
  active,
  onChange,
  variant = 'boxed',
}: Props<T>) {
  const barClass = variant === 'underline' ? 'tab-bar-underline' : 'tab-bar';
  const itemClass = variant === 'underline' ? 'tab-item-underline' : 'tab-item';

  return (
    <div className={barClass}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={`${itemClass}${active === tab.key ? ' is-active' : ''}`}
          onClick={() => onChange(tab.key)}
        >
          {tab.icon}
          {tab.label}
          {tab.badge !== undefined && tab.badge > 0 && (
            <span
              className={`tab-badge${active === tab.key ? ' tab-badge--active' : ''}`}
            >
              {tab.badge > 99 ? '99+' : tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
