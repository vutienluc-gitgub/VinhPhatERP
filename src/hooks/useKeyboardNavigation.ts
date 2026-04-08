import { useEffect } from 'react';

/**
 * useKeyboardNavigation
 * Đăng ký lắng nghe phím Tab, Enter, Esc, Arrow để điều hướng focus cho UI.
 * @param options - Cấu hình callback cho các phím
 */
export function useKeyboardNavigation(
  options: {
    onEnter?: () => void;
    onEsc?: () => void;
    onArrow?: (direction: 'up' | 'down' | 'left' | 'right') => void;
    onTab?: (shift: boolean) => void;
  } = {},
) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Enter' && options.onEnter) {
        options.onEnter();
      } else if (e.key === 'Escape' && options.onEsc) {
        options.onEsc();
      } else if (e.key === 'Tab' && options.onTab) {
        options.onTab(e.shiftKey);
      } else if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) &&
        options.onArrow
      ) {
        const dir = e.key.replace('Arrow', '').toLowerCase() as
          | 'up'
          | 'down'
          | 'left'
          | 'right';
        options.onArrow(dir);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [options]);
}
