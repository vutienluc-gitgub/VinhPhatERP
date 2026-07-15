import { useMemo, useState, useEffect, memo } from 'react';
import { NavLink } from 'react-router-dom';

import type { NavigationItem } from '@/app/router/routes';
import { Icon } from '@/shared/components/Icon';
import { GROUP_LABEL_MAP, GROUP_ORDER } from '@/shared/constants/navigation';
import { DRAWER_LABELS } from '@/shared/constants/layout';

const removeAccents = (str: string) => {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

const DrawerNavItem = memo(
  ({ item, onClose }: { item: NavigationItem; onClose: () => void }) => (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `drawer-list-item${isActive ? ' text-primary bg-primary/10' : ''}`
      }
      onClick={onClose}
    >
      <span className="drawer-list-icon">
        <Icon name={item.icon ?? 'Component'} size={18} strokeWidth={1.5} />
      </span>
      <span className="drawer-list-label">{item.label}</span>
    </NavLink>
  ),
);

DrawerNavItem.displayName = 'DrawerNavItem';

type Props = {
  items: NavigationItem[];
  onClose: () => void;
};

type GroupedItems = {
  group: string;
  label: string;
  items: NavigationItem[];
};

export function MobileMoreDrawer({ items, onClose }: Props) {
  const [search, setSearch] = useState('');

  // Scroll lock & Escape to close
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalStyle;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = removeAccents(search.toLowerCase().trim());
    return items.filter(
      (item) =>
        removeAccents(item.label.toLowerCase()).includes(q) ||
        removeAccents(item.shortLabel.toLowerCase()).includes(q),
    );
  }, [items, search]);

  const grouped = useMemo(() => {
    if (filtered.length === 0) return { ungrouped: [], groups: [] };

    const ungrouped = filtered.filter((item) => !item.group);
    const groups: GroupedItems[] = GROUP_ORDER.map((groupKey) => {
      const groupItems = filtered.filter((item) => item.group === groupKey);
      const label = GROUP_LABEL_MAP[groupKey] ?? groupKey;
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
        aria-label={DRAWER_LABELS.MODAL_ARIA}
      >
        <div className="drawer-handle" />

        {/* Search */}
        <div className="drawer-search">
          <Icon name="Search" size={16} strokeWidth={1.8} />
          <input
            type="text"
            className="drawer-search-input"
            placeholder={DRAWER_LABELS.SEARCH_PLACEHOLDER}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          {search && (
            <button
              type="button"
              className="drawer-search-clear"
              onClick={() => setSearch('')}
              aria-label={DRAWER_LABELS.CLEAR_SEARCH_ARIA}
            >
              <Icon name="X" size={14} strokeWidth={2} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="drawer-content">
          {noResults && <p className="drawer-empty">{DRAWER_LABELS.EMPTY}</p>}

          {/* Grouped items (Hiển thị nhóm trước) */}
          {grouped.groups.map((g) => (
            <div key={g.group} className="drawer-section">
              <p className="drawer-title">{g.label}</p>
              {g.items.map((item) => (
                <DrawerNavItem key={item.path} item={item} onClose={onClose} />
              ))}
            </div>
          ))}

          {/* Ungrouped items (Hiển thị các mục Khác ở cuối) */}
          {grouped.ungrouped.length > 0 && (
            <div className="drawer-section">
              <p className="drawer-title">{DRAWER_LABELS.OTHER_GROUP}</p>
              {grouped.ungrouped.map((item) => (
                <DrawerNavItem key={item.path} item={item} onClose={onClose} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
