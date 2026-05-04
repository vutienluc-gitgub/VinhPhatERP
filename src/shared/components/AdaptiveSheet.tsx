import {
  useCallback,
  useEffect,
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
  /** Tiêu đề hiển thị trên Header */
  title: string;
  /** Nội dung chính (cuộn được) */
  children: ReactNode;
  /** Các nút bấm ở Footer (Sticky) */
  footer?: ReactNode;
  /** Thông tin bước hiện tại (hiển thị Progress Indicator) */
  stepInfo?: { current: number; total: number };
  /** ID cho aria-labelledby */
  titleId?: string;
  /** Độ rộng tối đa của modal trên Desktop */
  maxWidth?: number | string;
};

/**
 * AdaptiveSheet — 1 Component, 2 Cách hiển thị.
 *
 * - Mobile (< 640px): Bottom Sheet trượt từ đáy, có Handle-bar.
 * - Desktop (≥ 640px): Modal trung tâm với Overlay mờ.
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
  children,
  footer,
  stepInfo,
  titleId = 'adaptive-sheet-title',
  maxWidth,
}: AdaptiveSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Track whether DOM should be mounted (includes exit animation phase)
  const [visible, setVisible] = useState(open);
  // Track closing state for CSS animation class
  const [closing, setClosing] = useState(false);

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

  if (!visible) return null;

  const mount = document.getElementById('modal-root');
  if (!mount) return null;

  const overlayClass = closing
    ? 'modal-overlay modal-overlay--closing'
    : 'modal-overlay';

  const sheetClass = closing
    ? 'modal-sheet modal-sheet--closing'
    : 'modal-sheet';

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
        style={maxWidth ? { maxWidth } : undefined}
      >
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 id={titleId}>{title}</h3>
            {stepInfo && (
              <span className="sheet-step-indicator">
                Bước {stepInfo.current + 1}/{stepInfo.total}
              </span>
            )}
          </div>
          <button
            className="btn-icon"
            type="button"
            onClick={onClose}
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

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
        <div className="modal-content">{children}</div>

        {/* Footer (sticky) */}
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>,
    mount,
  );
}
