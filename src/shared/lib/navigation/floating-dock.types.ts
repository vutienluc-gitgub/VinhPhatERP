import type { IconName } from '@/shared/components/Icon';

/** Một tab hiển thị trên Floating Dock. */
export interface FloatingDockItem {
  /** Định danh duy nhất của tab (route path hoặc khoá chức năng). */
  id: string;
  /** Nhãn ngắn hiển thị dưới icon. */
  label: string;
  /** Tên icon — tra qua <Icon name>, không import lucide-react trực tiếp. */
  icon: IconName;
  /** Số huy hiệu; 0/undefined nghĩa là không hiển thị. */
  badge?: number | string;
}

/** Mô tả nút hành động nhanh (Integrated FAB) gắn cuối dock. */
export interface FloatingDockAction {
  icon: IconName;
  /** Nhãn trợ năng bắt buộc — dùng cho aria-label. */
  ariaLabel: string;
  onTrigger: () => void;
}

export interface FloatingDockProps {
  items: FloatingDockItem[];
  activeId?: string;
  onSelect: (id: string) => void;
  action?: FloatingDockAction;
}
