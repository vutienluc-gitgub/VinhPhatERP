import type { FieldErrors } from 'react-hook-form';

/**
 * Extracts a flat, readable error message from deeply nested react-hook-form FieldErrors.
 * Useful for displaying generic Toast notifications on form submit failure.
 *
 * @param errors The `errors` object returned by `react-hook-form`'s `handleSubmit` or `formState`
 * @param defaultMessage The fallback message if no specific message could be extracted
 * @returns A single string describing the first encountered validation error
 */
export function extractFormErrorMessage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: FieldErrors<any>,
  defaultMessage = 'Vui lòng kiểm tra lại form',
): string {
  if (!errors || Object.keys(errors).length === 0) return defaultMessage;

  const firstErrorKey = Object.keys(errors)[0];
  if (!firstErrorKey) return defaultMessage;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const errorObj = errors[firstErrorKey] as any;
  if (!errorObj) return defaultMessage;

  // Case 1: Direct root string message
  if (errorObj?.root?.message) {
    return String(errorObj.root.message);
  }

  // Case 2: Standard field message
  if (errorObj?.message) {
    return String(errorObj.message);
  }

  // Case 3: Deep nested array field (e.g. `items[0].quantity.message`)
  if (Array.isArray(errorObj)) {
    const firstItemError = errorObj.find((e) => e !== undefined && e !== null);
    if (firstItemError) {
      const nestedFirstKey = Object.keys(firstItemError)[0];
      if (nestedFirstKey && firstItemError[nestedFirstKey]?.message) {
        return String(firstItemError[nestedFirstKey].message);
      }
    }
  }

  return defaultMessage;
}
