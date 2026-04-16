import { useMemo, useState } from 'react';
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

type GroupedItems = {
  group: string;
  label: string;
  items: NavigationItem[];
};

export function MobileMoreDrawer({ items, onClose }: Props) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase().trim();
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.shortLabel.toLowerCase().includes(q),
    );
  }, [items, search]);

  const grouped = useMemo(() => {
    const ungrouped = filtered.filter((item) => !item.group);
    const groups: GroupedItems[] = GROUP_ORDER.map((groupKey) => {
      const groupItems = filtered.filter((item) => item.group === groupKey);
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
  }, [filtered]);

  const noResults = filtered.length === 0 && search.trim().length > 0;

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} aria-hidden="true" />
      <div
        className="drawer-sheet drawer-sheet--full"
        role="dialog"
        aria-modal="true"
        aria-label="Tat ca module"
      >
        <div className="drawer-handle" />

        {/* Search */}
        <div className="drawer-search">
          <Icon name="Search" size={16} strokeWidth={1.8} />
          <input
            type="text"
            className="drawer-search-input"
            placeholder="Tìm module..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          {search && (
            <button
              type="button"
              className="drawer-search-clear"
              onClick={() => setSearch('')}
              aria-label="Xóa tìm kiếm"
            >
              <Icon name="X" size={14} strokeWidth={2} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="drawer-content">
          {noResults && (
            <p className="drawer-empty">Không tìm thấy module nào</p>
          )}

          {/* Ungrouped items */}
          {grouped.ungrouped.length > 0 && (
            <div className="drawer-section">
              <p className="drawer-title">Khac</p>
              {grouped.ungrouped.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `drawer-list-item${isActive ? ' is-active' : ''}`
                  }
                  onClick={onClose}
                >
                  <span className="drawer-list-icon">
                    <Icon
                      name={item.icon ?? 'Component'}
                      size={18}
                      strokeWidth={1.5}
                    />
                  </span>
                  <span className="drawer-list-label">{item.label}</span>
                </NavLink>
              ))}
            </div>
          )}

          {/* Grouped items */}
          {grouped.groups.map((g) => (
            <div key={g.group} className="drawer-section">
              <p className="drawer-title">{g.label}</p>
              {g.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `drawer-list-item${isActive ? ' is-active' : ''}`
                  }
                  onClick={onClose}
                >
                  <span className="drawer-list-icon">
                    <Icon
                      name={item.icon ?? 'Component'}
                      size={18}
                      strokeWidth={1.5}
                    />
                  </span>
                  <span className="drawer-list-label">{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
