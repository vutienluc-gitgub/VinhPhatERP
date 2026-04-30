import { useEffect } from 'react';

/**
 * Khoá tính năng cuộn trang (scroll) trên thẻ body khi hiển thị Modal/Drawer
 * @param isLocked Trạng thái khoá (true = khoá, false = mở)
 */
export function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    // Lưu lại giá trị overflow cũ để phục hồi thay vì gán cứng 'unset'
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isLocked]);
}
