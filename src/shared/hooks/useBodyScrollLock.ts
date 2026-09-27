import { useEffect } from 'react';

type BodyScrollLockOptions = {
  /**
   * Khoá kiểu iOS Safari: ghim body bằng `position: fixed` để trang phía sau
   * không bị cuộn/nảy theo khi người dùng kéo trong Modal/Drawer toàn màn hình.
   * Vị trí cuộn cũ được khôi phục khi mở khoá.
   */
  preserveScrollPosition?: boolean;
};

/**
 * Khoá tính năng cuộn trang (scroll) trên thẻ body khi hiển thị Modal/Drawer
 * @param isLocked Trạng thái khoá (true = khoá, false = mở)
 * @param options Tuỳ chọn khoá (mặc định chỉ đặt overflow: hidden)
 */
export function useBodyScrollLock(
  isLocked: boolean,
  options: BodyScrollLockOptions = {},
) {
  const { preserveScrollPosition = false } = options;

  useEffect(() => {
    if (!isLocked) return;

    const { body, documentElement } = document;
    // Lưu lại giá trị cũ để phục hồi thay vì gán cứng 'unset'
    const originalOverflow = body.style.overflow;

    if (!preserveScrollPosition) {
      body.style.overflow = 'hidden';
      return () => {
        body.style.overflow = originalOverflow;
      };
    }

    const scrollY = window.scrollY;
    const originalBodyStyles = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
    };
    const originalHtmlOverscroll = documentElement.style.overscrollBehavior;

    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    documentElement.style.overscrollBehavior = 'none';

    return () => {
      body.style.overflow = originalOverflow;
      Object.assign(body.style, originalBodyStyles);
      documentElement.style.overscrollBehavior = originalHtmlOverscroll;
      window.scrollTo(0, scrollY);
    };
  }, [isLocked, preserveScrollPosition]);
}
