import type { ReactNode } from 'react';

export interface TabItem<T extends string> {
  key: T;
  label: string;
  icon?: ReactNode;
}

interface Props<T extends string> {
  tabs: TabItem<T>[];
  active: T;
  onChange: (key: T) => void;
}

export function TabSwitcher<T extends string>({
  tabs,
  active,
  onChange,
}: Props<T>) {
  return (
    <div className="tab-bar">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={`tab-item${active === tab.key ? ' is-active' : ''}`}
          onClick={() => onChange(tab.key)}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
