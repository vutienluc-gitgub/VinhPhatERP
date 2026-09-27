import type { IconName } from '@/shared/components/Icon';

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
  /** `primary` tô nền để làm nổi bật nút tạo mới (FAB "+"). */
  variant?: 'default' | 'primary';
}

export interface FloatingDockProps {
  items: FloatingDockItem[];
  activeId?: string;
  onSelect: (id: string) => void;
  /** Nút hành động hiển thị sau các tab, theo thứ tự truyền vào. */
  actions?: FloatingDockAction[];
  className?: string;
}
