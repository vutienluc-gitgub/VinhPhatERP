import { useMemo } from 'react';
import { NavLink } from 'react-router-dom';

import type { NavigationItem } from '@/app/router/routes';
import { Icon } from '@/shared/components/Icon';

type Props = {
  items: NavigationItem[];
  onClose: () => void;
};

const GROUP_LABELS: Record<string, string> = {
  sales: 'Kinh doanh',
  production: 'San xuat',
  'master-data': 'Danh muc',
  system: 'He thong',
};

const GROUP_ORDER = ['sales', 'production', 'master-data', 'system'];

type GroupedItems = { group: string; label: string; items: NavigationItem[] };

export function MobileMoreDrawer({ items, onClose }: Props) {
  const grouped = useMemo(() => {
    const ungrouped = items.filter((item) => !item.group);
    const groups: GroupedItems[] = GROUP_ORDER.map((groupKey) => {
      const groupItems = items.filter((item) => item.group === groupKey);
      const label = GROUP_LABELS[groupKey] ?? groupKey;
      return {
        group: groupKey,
        label,
        items: groupItems,
      };
    }).filter((g) => g.items.length > 0);

    return {
      ungrouped,
      groups,
    };
  }, [items]);

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} aria-hidden="true" />
      <div
        className="drawer-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Tat ca module"
      >
        <div className="drawer-handle" />

        {/* Ungrouped items */}
        {grouped.ungrouped.length > 0 && (
          <>
            <p className="drawer-title">Khac</p>
            <div className="drawer-grid">
              {grouped.ungrouped.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `drawer-item${isActive ? ' is-active' : ''}`
                  }
                  onClick={onClose}
                >
                  <Icon
                    name={item.icon ?? 'Component'}
                    size={18}
                    strokeWidth={1.5}
                  />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </>
        )}

        {/* Grouped items */}
        {grouped.groups.map((g) => (
          <div key={g.group}>
            <p className="drawer-title">{g.label}</p>
            <div className="drawer-grid">
              {g.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `drawer-item${isActive ? ' is-active' : ''}`
                  }
                  onClick={onClose}
                >
                  <Icon
                    name={item.icon ?? 'Component'}
                    size={18}
                    strokeWidth={1.5}
                  />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
