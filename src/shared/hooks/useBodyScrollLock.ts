import { useEffect } from 'react';

type BodyScrollLockOptions = {
  /**
   * Khoá kiểu iOS Safari: ghim body bằng `position: fixed` để trang phía sau
   * không bị cuộn/nảy theo khi người dùng kéo trong Modal/Drawer toàn màn hình.
   * Vị trí cuộn cũ được khôi phục khi mở khoá.
   */
  preserveScrollPosition?: boolean;
  /**
   * Phần tử đang giữ scroll ở viewport hiện tại. Trên mobile `body` bị
   * `overflow: hidden` và `.shell-layout` mới là scroller thật, nên khoá mỗi
   * body là không đủ. Truyền `null` để chỉ khoá body (hành vi cũ).
   */
  scrollContainerSelector?: string | null;
};

const DEFAULT_SCROLL_CONTAINER_SELECTOR = '.shell-layout';

/**
 * Khoá tính năng cuộn trang (scroll) trên thẻ body khi hiển thị Modal/Drawer
 * @param isLocked Trạng thái khoá (true = khoá, false = mở)
 * @param options Tuỳ chọn khoá (mặc định chỉ đặt overflow: hidden)
 */
export function useBodyScrollLock(
  isLocked: boolean,
  options: BodyScrollLockOptions = {},
) {
  const {
    preserveScrollPosition = false,
    scrollContainerSelector = DEFAULT_SCROLL_CONTAINER_SELECTOR,
  } = options;

  useEffect(() => {
    if (!isLocked) return;

    const { body, documentElement } = document;
    // Lưu lại giá trị cũ để phục hồi thay vì gán cứng 'unset'
    const originalOverflow = body.style.overflow;

    const container = scrollContainerSelector
      ? document.querySelector<HTMLElement>(scrollContainerSelector)
      : null;
    // Chỉ coi là scroller khi nó thực sự cuộn: trên desktop `.shell-layout` có
    // overflow mặc định (visible) và body mới cuộn — ghim overflow ở đó sẽ cắt
    // mất nội dung trang.
    const isContainerScroller = Boolean(
      container &&
      (container.scrollTop > 0 ||
        getComputedStyle(container).overflowY === 'auto' ||
        getComputedStyle(container).overflowY === 'scroll'),
    );
    const lockContainer = isContainerScroller ? container : null;
    const originalContainerOverflow = lockContainer?.style.overflow ?? '';

    if (!preserveScrollPosition) {
      body.style.overflow = 'hidden';
      if (lockContainer) lockContainer.style.overflow = 'hidden';
      return () => {
        body.style.overflow = originalOverflow;
        if (lockContainer) {
          lockContainer.style.overflow = originalContainerOverflow;
        }
      };
    }

    const scrollY =
      isContainerScroller && container ? container.scrollTop : window.scrollY;
    const originalBodyStyles = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
    };
    const originalHtmlOverscroll = documentElement.style.overscrollBehavior;

    body.style.overflow = 'hidden';
    if (lockContainer) lockContainer.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    documentElement.style.overscrollBehavior = 'none';
    if (lockContainer) lockContainer.scrollTop = 0;

    return () => {
      body.style.overflow = originalOverflow;
      if (lockContainer) {
        lockContainer.style.overflow = originalContainerOverflow;
      }
      Object.assign(body.style, originalBodyStyles);
      documentElement.style.overscrollBehavior = originalHtmlOverscroll;

      if (isContainerScroller && container) {
        container.scrollTop = scrollY;
      } else {
        window.scrollTo(0, scrollY);
      }
    };
  }, [isLocked, preserveScrollPosition, scrollContainerSelector]);
}
