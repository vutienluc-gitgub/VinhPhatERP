import { useMemo, useState, useEffect, memo, useRef } from 'react';
import { NavLink } from 'react-router-dom';

import { useVisualViewport } from '@/shared/hooks/useVisualViewport';
import type { NavigationItem } from '@/app/router/routes';
import { Icon } from '@/shared/components/Icon';
import { GROUP_LABEL_MAP, GROUP_ORDER } from '@/shared/constants/navigation';
import { DRAWER_LABELS, QUICK_ACTIONS } from '@/shared/constants/layout';

import styles from './MobileMoreDrawer.module.css';

const removeAccents = (str: string) => {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

/* ── Quick Action Item (Horizontal scroll) ── */
const QuickActionItem = memo(
  ({
    action,
    onClose,
  }: {
    action: (typeof QUICK_ACTIONS)[number];
    onClose: () => void;
  }) => (
    <NavLink
      to={action.path}
      className={styles.quickActionBtn}
      onClick={onClose}
    >
      <span className={styles.quickActionIcon}>
        <Icon name={action.icon} size={24} strokeWidth={1.5} />
      </span>
      <span className={styles.quickActionLabel}>{action.label}</span>
    </NavLink>
  ),
);

QuickActionItem.displayName = 'QuickActionItem';

/* ── Navigation Item (Inside inset grouped list) ── */
const DrawerNavItem = memo(
  ({ item, onClose }: { item: NavigationItem; onClose: () => void }) => (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `${styles.listItem}${isActive ? ` ${styles.isActive}` : ''}`
      }
      onClick={onClose}
    >
      <span className={styles.listIcon}>
        <Icon name={item.icon ?? 'Component'} size={18} strokeWidth={1.5} />
      </span>
      <span className={styles.listLabel}>{item.label}</span>
      <Icon
        name="ChevronRight"
        size={14}
        strokeWidth={1.5}
        className={styles.listChevron}
      />
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
  const { isKeyboardOpen, height: vvHeight } = useVisualViewport();
  const inputRef = useRef<HTMLInputElement>(null);

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
  const isSearching = search.trim().length > 0;

  return (
    <>
      <div className={styles.overlay} onClick={onClose} aria-hidden="true" />
      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-label={DRAWER_LABELS.MODAL_ARIA}
        style={{
          paddingBottom: isKeyboardOpen ? '0.5rem' : undefined,
          ...(isKeyboardOpen && {
            bottom: 0,
            maxHeight: vvHeight ? `${vvHeight * 0.95}px` : '75dvh',
          }),
        }}
      >
        <div className={styles.handle} />

        {/* Header Title */}
        <p className={styles.headerTitle}>{DRAWER_LABELS.HEADER_TITLE}</p>

        {/* Search */}
        <div className={styles.search}>
          <Icon name="Search" size={16} strokeWidth={1.8} />
          <input
            ref={inputRef}
            type="text"
            className={styles.searchInput}
            placeholder={DRAWER_LABELS.SEARCH_PLACEHOLDER}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => {
              setTimeout(() => {
                inputRef.current?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center',
                });
              }, 300);
            }}
          />
          {search && (
            <button
              type="button"
              className={styles.searchClear}
              onClick={() => setSearch('')}
              aria-label={DRAWER_LABELS.CLEAR_SEARCH_ARIA}
            >
              <Icon name="X" size={14} strokeWidth={2} />
            </button>
          )}
        </div>

        {/* Quick Actions (only when NOT searching) */}
        {!isSearching && (
          <div className={styles.quickActions}>
            {QUICK_ACTIONS.map((action) => (
              <QuickActionItem
                key={action.path}
                action={action}
                onClose={onClose}
              />
            ))}
          </div>
        )}

        {/* Scrollable Content */}
        <div className={styles.content}>
          {noResults && <p className={styles.empty}>{DRAWER_LABELS.EMPTY}</p>}

          {/* Grouped items (Inset Grouped Lists) */}
          {grouped.groups.map((g) => (
            <div key={g.group} className={styles.section}>
              <p className={styles.title}>{g.label}</p>
              <div className={styles.groupBlock}>
                {g.items.map((item) => (
                  <DrawerNavItem
                    key={item.path}
                    item={item}
                    onClose={onClose}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Ungrouped items */}
          {grouped.ungrouped.length > 0 && (
            <div className={styles.section}>
              <p className={styles.title}>{DRAWER_LABELS.OTHER_GROUP}</p>
              <div className={styles.groupBlock}>
                {grouped.ungrouped.map((item) => (
                  <DrawerNavItem
                    key={item.path}
                    item={item}
                    onClose={onClose}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
