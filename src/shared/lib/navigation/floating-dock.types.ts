import type { IconName } from '@/shared/components/Icon';

import type { DockSourceItem } from './floating-dock.utils';

/** Một tab hiển thị trên Floating Dock. */
export interface FloatingDockItem {
  /** Định danh duy nhất của tab (route path hoặc khoá chức năng). */
  id: string;
  /** Nhãn trợ năng — dock icon-only nên nhãn không render ra giao diện. */
  label: string;
  /** Tên icon — tra qua <Icon name>, không import lucide-react trực tiếp. */
  icon: IconName;
  /** Số huy hiệu; 0/undefined nghĩa là không hiển thị. */
  badge?: number | string;
  /** Chấm trạng thái; chỉ hiện khi không có badge. */
  hasDot?: boolean;
}

/** Nút hành động gắn cuối dock (Menu hoặc FAB "+"). */
export interface FloatingDockAction {
  icon: IconName;
  /** Nhãn trợ năng — dùng cho aria-label (dock hiển thị icon-only). */
  label: string;
  /** Nhãn trợ năng đầy đủ; mặc định lấy `label`. */
  ariaLabel?: string;
  onTrigger: () => void;
  badge?: number | string;
  hasDot?: boolean;
  /** Đánh dấu nút đang là mục điều hướng hiện hành. */
  isActive?: boolean;
}

export interface FloatingDockProps {
  /** Danh sách tab (thường là bottomTabs đã resolve theo role). */
  items: DockSourceItem[];
  /** Tab đang hoạt động theo `id` (chính là `path`). */
  activeId?: string;
  onSelect: (id: string) => void;
  /** Nút hành động nằm trong pill, sau các tab, theo thứ tự truyền vào. */
  actions?: FloatingDockAction[];
  /**
   * FAB nổi tách riêng khỏi pill (kiểu Material), neo góc phải dưới,
   * nằm trên dock. Dùng cho hành động tạo mới.
   */
  fab?: FloatingDockAction;
  className?: string;
}
