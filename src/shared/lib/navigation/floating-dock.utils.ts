import type { IconName } from '@/shared/components/Icon';

import type { FloatingDockItem } from './floating-dock.types';

/**
 * Dữ liệu điều hướng tối thiểu mà resolver cần.
 * Cố ý dùng cấu trúc thay vì import `NavigationItem` từ `@/app/router`,
 * để tầng shared không phụ thuộc ngược lên app shell.
 */
export interface DockSourceItem {
  path: string;
  label: string;
  shortLabel?: string;
  icon?: string;
  badge?: number | string;
  hasDot?: boolean;
}

export const DOCK_MAX_TABS = 4;
export const DOCK_BADGE_OVERFLOW = 99;

/**
 * Chuyển danh sách điều hướng thành tab của dock: khử trùng theo `path`,
 * bỏ qua item thiếu `path`, và giới hạn số tab.
 */
export function toDockItems(
  sources: readonly DockSourceItem[],
  maxTabs: number = DOCK_MAX_TABS,
): FloatingDockItem[] {
  if (maxTabs <= 0) return [];

  const seen = new Set<string>();
  const items: FloatingDockItem[] = [];

  for (const source of sources) {
    if (items.length >= maxTabs) break;
    if (!source.path || seen.has(source.path)) continue;

    seen.add(source.path);
    items.push({
      id: source.path,
      label: source.shortLabel || source.label,
      icon: (source.icon || 'Component') as IconName,
      badge: source.badge,
      hasDot: source.hasDot,
    });
  }

  return items;
}

/** Chuẩn hoá huy hiệu: rỗng/0 → null, vượt ngưỡng → '99+'. */
export function formatDockBadge(
  badge: number | string | undefined | null,
): string | null {
  if (badge === undefined || badge === null || badge === 0 || badge === '') {
    return null;
  }

  if (typeof badge === 'number') {
    return badge > DOCK_BADGE_OVERFLOW
      ? `${DOCK_BADGE_OVERFLOW}+`
      : String(badge);
  }

  return badge;
}

/** Tab đang hoạt động theo pathname; '/' chỉ khớp chính xác. */
export function isDockItemActive(itemId: string, pathname: string): boolean {
  return itemId === '/' ? pathname === '/' : pathname.startsWith(itemId);
}
