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
  /** Chấm trạng thái; chỉ hiện khi không có badge. */
  hasDot?: boolean;
}

/** Nút hành động gắn cuối dock (Menu hoặc FAB). */
export interface FloatingDockAction {
  icon: IconName;
  /** Nhãn hiển thị dưới icon. */
  label: string;
  /** Nhãn trợ năng bắt buộc — dùng cho aria-label. */
  ariaLabel: string;
  onTrigger: () => void;
  badge?: number | string;
  hasDot?: boolean;
  /** Đánh dấu nút đang là mục điều hướng hiện hành. */
  isActive?: boolean;
}

export interface FloatingDockProps {
  items: FloatingDockItem[];
  activeId?: string;
  onSelect: (id: string) => void;
  action?: FloatingDockAction;
  className?: string;
}
