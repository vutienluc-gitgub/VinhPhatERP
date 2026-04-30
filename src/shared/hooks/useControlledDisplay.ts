import { useEffect, useRef, useState } from 'react';

/**
 * useControlledDisplay — Shared hook for controlled numeric input components.
 *
 * Encapsulates the common pattern of:
 * 1. Maintaining a local `display` string for the formatted value
 * 2. Syncing from external `value` prop → local display (on prop change)
 * 3. Avoiding sync loops (when display already matches the external value)
 *
 * Previously this logic was duplicated across CurrencyInput, NumericInput,
 * and NumberInput with subtle differences in each implementation.
 *
 * @param value - External numeric value (from react-hook-form or parent)
 * @param toDisplay - Function to format a number into a display string
 * @param toNumber - Function to parse a display string back into a number
 */
export function useControlledDisplay(
  value: number | null | undefined,
  toDisplay: (num: number | null | undefined) => string,
  toNumber: (text: string) => number | null,
) {
  const [display, setDisplay] = useState(() => toDisplay(value));
  /** Track whether the input is currently focused to skip external sync */
  const isFocusedRef = useRef(false);

  // Sync when value changes from outside (form reset, edit mode, etc.)
  // Skip when focused to avoid overwriting user's in-progress typing
  useEffect(() => {
    if (isFocusedRef.current) return;

    const currentNum = toNumber(display);
    const externalNum = value ?? null;

    // Only update if the external value differs from what's displayed
    if (externalNum !== currentNum) {
      setDisplay(toDisplay(value));
    } else if (externalNum === null && display !== '') {
      setDisplay('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return {
    display,
    setDisplay,
    isFocusedRef,
  };
}
