import { useRef, useCallback } from 'react';
import { getFocusableElements, moveFocus } from '@/utils/focusManager';

/**
 * useEditableTableKeyboard
 * Hỗ trợ điều hướng bàn phím trong bảng editable (arrow, enter, esc, tab)
 * @param tableRef - ref tới table
 * @param onEdit - callback khi enter cell
 * @param onCancel - callback khi esc
 */
export function useEditableTableKeyboard(
  tableRef: React.RefObject<HTMLElement>,
  onEdit?: (cell: HTMLElement) => void,
  onCancel?: () => void
) {
  const focusIndex = useRef(0);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!tableRef.current) return;
      const focusables = getFocusableElements(tableRef.current);
      if (focusables.length === 0) return;
      let handled = false;
      switch (e.key) {
        case 'ArrowDown':
          focusIndex.current = moveFocus(focusables, focusIndex.current, +1);
          handled = true;
          break;
        case 'ArrowUp':
          focusIndex.current = moveFocus(focusables, focusIndex.current, -1);
          handled = true;
          break;
        case 'Enter': {
          const el = focusables[focusIndex.current];
          if (onEdit && el) onEdit(el);
          handled = true;
          break;
        }
        case 'Escape':
          if (onCancel) onCancel();
          handled = true;
          break;
        case 'Tab':
          focusIndex.current = moveFocus(focusables, focusIndex.current, e.shiftKey ? -1 : +1);
          handled = true;
          break;
      }
      if (handled) e.preventDefault();
    },
    [tableRef, onEdit, onCancel]
  );

  return handleKeyDown;
}
