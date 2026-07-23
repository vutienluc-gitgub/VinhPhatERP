import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

type AdaptiveSheetProps = {
  /** Hiển thị hay ẩn */
  open: boolean;
  /** Callback khi đóng */
  onClose: () => void;
  /** Tiêu đề hiển thị trên mặc định Header (nếu không truyền custom header) */
  title?: ReactNode;
  /** Custom header thay thế toàn bộ header mặc định */
  header?: ReactNode;
  /** Nội dung dính ngay dưới header (thường dùng cho Tabs) */
  subHeader?: ReactNode;
  /** Nội dung chính (cuộn được) */
  children: ReactNode;
  /** Các nút bấm ở Footer (Sticky) */
  footer?: ReactNode;
  /** Thông tin bước hiện tại (hiển thị Progress Indicator) */
  stepInfo?: { current: number; total: number };
  /** ID cho aria-labelledby */
  titleId?: string;
  /** Kích thước chuẩn của modal trên Desktop */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  /** Độ rộng tối đa (legacy, ưu tiên dùng size) */
  maxWidth?: number | string;
};

const SIZE_MAP = {
  sm: 400,
  md: 600,
  lg: 800,
  xl: 1100,
  '2xl': 1400,
  full: '100%',
};

const LABELS = {
  CLOSE: 'Đóng',
  STEP: 'Bước',
} as const;

/** Minimum swipe distance (px) to trigger dismiss */
const SWIPE_DISMISS_THRESHOLD = 100;
/** Duration (ms) for swipe dismiss/snap-back animation */
const SWIPE_ANIMATION_MS = 200;

/**
 * AdaptiveSheet — 1 Component, 2 Cách hiển thị.
 *
 * - Mobile (<640px): Bottom Sheet trượt từ đáy, có Handle-bar + swipe-to-dismiss.
 * - Desktop (≥640px): Modal trung tâm với Overlay mờ.
 *
 * Tận dụng CSS media queries trong `.modal-overlay` / `.modal-sheet`
 * để tự động chuyển đổi layout mà KHÔNG cần JS detect.
 *
 * Exit animation: Khi `open` chuyển từ true → false, component sẽ
 * phát animation đóng (fade-out + slide-down) trước khi unmount.
 */
export function AdaptiveSheet({
  open,
  onClose,
  title,
  header,
  subHeader,
  children,
  footer,
  stepInfo,
  titleId: titleIdProp,
  size = 'md',
  maxWidth,
}: AdaptiveSheetProps) {
  const generatedId = useId();
  const titleId = titleIdProp ?? `sheet-title-${generatedId}`;
  const sheetRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Track whether DOM should be mounted (includes exit animation phase)
  const [visible, setVisible] = useState(open);
  // Track closing state for CSS animation class
  const [closing, setClosing] = useState(false);

  // ── Swipe-to-dismiss state ──
  const touchStartY = useRef(0);
  const currentTranslateY = useRef(0);
  const isDragging = useRef(false);

  useEffect(() => {
    if (open) {
      // Opening: mount immediately
      setVisible(true);
      setClosing(false);
    } else if (visible && !closing) {
      // Closing: trigger exit animation
      setClosing(true);
    }
  }, [open, visible, closing]);

  // Handle animation end to unmount after exit animation completes
  const handleAnimationEnd = useCallback(() => {
    if (closing) {
      setClosing(false);
      setVisible(false);
    }
  }, [closing]);

  // Trap focus bên trong sheet
  useEffect(() => {
    if (!visible || closing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Trap Tab focus
      if (e.key === 'Tab' && sheetRef.current) {
        const focusable = sheetRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first || !last) return;

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    // Chặn scroll body khi sheet mở
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [visible, closing, onClose]);

  // Auto-focus vào sheet khi mở
  useEffect(() => {
    if (visible && !closing && sheetRef.current) {
      const firstInput = sheetRef.current.querySelector<HTMLElement>(
        'input:not([type="hidden"]), select, textarea',
      );
      if (firstInput) {
        // Delay nhỏ để animation kịp chạy
        requestAnimationFrame(() => firstInput.focus());
      }
    }
  }, [visible, closing]);

  const isMouseDownOnOverlay = useRef(false);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isMouseDownOnOverlay.current = e.target === e.currentTarget;
  }, []);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && isMouseDownOnOverlay.current) {
        onClose();
      }
      isMouseDownOnOverlay.current = false;
    },
    [onClose],
  );

  // ── Swipe-to-dismiss handlers (mobile only) ──
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    // Only enable swipe on narrow viewports (mobile bottom sheet)
    if (window.innerWidth >= 640) return;
    touchStartY.current = touch.clientY;
    currentTranslateY.current = 0;
    isDragging.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const touch = e.touches[0];
    if (!touch) return;
    const deltaY = touch.clientY - touchStartY.current;
    // Only allow dragging downward (positive deltaY)
    if (deltaY > 0 && sheetRef.current) {
      currentTranslateY.current = deltaY;
      sheetRef.current.style.transform = `translateY(${deltaY}px)`;
      sheetRef.current.style.transition = 'none';
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;

    if (sheetRef.current) {
      if (currentTranslateY.current >= SWIPE_DISMISS_THRESHOLD) {
        // Dismiss: animate off-screen then close
        sheetRef.current.style.transition = 'transform 0.2s ease-out';
        sheetRef.current.style.transform = 'translateY(100%)';
        // Wait for transition then trigger close
        setTimeout(() => {
          if (sheetRef.current) {
            sheetRef.current.style.transform = '';
            sheetRef.current.style.transition = '';
          }
          onClose();
        }, SWIPE_ANIMATION_MS);
      } else {
        // Snap back
        sheetRef.current.style.transition =
          'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)';
        sheetRef.current.style.transform = 'translateY(0)';
        setTimeout(() => {
          if (sheetRef.current) {
            sheetRef.current.style.transform = '';
            sheetRef.current.style.transition = '';
          }
        }, SWIPE_ANIMATION_MS);
      }
    }
    currentTranslateY.current = 0;
  }, [onClose]);

  if (!visible) return null;

  const mount = document.getElementById('modal-root');
  if (!mount) return null;

  const overlayClass = closing
    ? 'modal-overlay modal-overlay--closing'
    : 'modal-overlay';

  const sheetClass = closing
    ? 'modal-sheet modal-sheet--closing'
    : 'modal-sheet';

  const computedMaxWidth = maxWidth ?? SIZE_MAP[size];

  return createPortal(
    <div
      ref={overlayRef}
      className={overlayClass}
      onClick={handleOverlayClick}
      onPointerDown={handlePointerDown}
      onAnimationEnd={handleAnimationEnd}
    >
      <div
        ref={sheetRef}
        className={sheetClass}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{ maxWidth: computedMaxWidth }}
      >
        {/* Swipe handle area (mobile only — hidden via CSS on desktop) */}
        <div
          className="modal-sheet-handle"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />

        {/* Header */}
        {header ? (
          header
        ) : title ? (
          <div className="modal-header min-w-0">
            <div className="modal-header-content">
              <h3 id={titleId}>{title}</h3>
              {stepInfo && (
                <span className="sheet-step-indicator">
                  {LABELS.STEP} {stepInfo.current + 1}/{stepInfo.total}
                </span>
              )}
            </div>
            <button
              className="btn-icon"
              type="button"
              onClick={onClose}
              aria-label={LABELS.CLOSE}
            >
              ✕
            </button>
          </div>
        ) : null}

        {/* Sub Header (Sticky under header) */}
        {subHeader && (
          <div className="modal-subheader min-w-0">{subHeader}</div>
        )}

        {/* Step Progress Bar */}
        {stepInfo && (
          <div className="sheet-progress">
            <div
              className="sheet-progress-bar"
              style={{
                width: `${((stepInfo.current + 1) / stepInfo.total) * 100}%`,
              }}
            />
          </div>
        )}

        {/* Content (scrollable) */}
        <div className="modal-content min-w-0">{children}</div>

        {/* Footer (sticky) */}
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>,
    mount,
  );
}
