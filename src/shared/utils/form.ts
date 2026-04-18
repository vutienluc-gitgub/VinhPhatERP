/**
 * Extracts a flat, readable error message from deeply nested react-hook-form FieldErrors.
 * Useful for displaying generic Toast notifications on form submit failure.
 *
 * @param errors The `errors` object returned by `react-hook-form`'s `handleSubmit` or `formState`
 * @param defaultMessage The fallback message if no specific message could be extracted
 * @returns A single string describing the first encountered validation error
 */
export function extractFormErrorMessage<
  T extends import('react-hook-form').FieldValues,
>(
  errors: import('react-hook-form').FieldErrors<T>,
  defaultMessage = 'Vui lòng kiểm tra lại form',
): string {
  if (!errors || Object.keys(errors).length === 0) return defaultMessage;

  const firstErrorKey = Object.keys(
    errors,
  )[0] as keyof import('react-hook-form').FieldErrors<T>;
  if (!firstErrorKey) return defaultMessage;

  const errorObj = errors[firstErrorKey];
  if (!errorObj) return defaultMessage;

  // Type-guards an toàn
  const hasMessage = (obj: unknown): obj is { message: string } => {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'message' in obj &&
      typeof (obj as Record<string, unknown>).message === 'string'
    );
  };

  const hasRootMessage = (
    obj: unknown,
  ): obj is { root: { message: string } } => {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'root' in obj &&
      hasMessage((obj as Record<string, unknown>).root)
    );
  };

  // Case 1: Direct root string message
  if (hasRootMessage(errorObj)) {
    return errorObj.root.message;
  }

  // Case 2: Standard field message
  if (hasMessage(errorObj)) {
    return errorObj.message;
  }

  // Case 3: Deep nested array field (e.g. `items[0].quantity.message`)
  if (Array.isArray(errorObj)) {
    const firstItemError = errorObj.find(
      (e) => e !== undefined && e !== null,
    ) as unknown;
    if (typeof firstItemError === 'object' && firstItemError !== null) {
      const nestedFirstKey = Object.keys(firstItemError)[0];
      if (nestedFirstKey) {
        const nestedObj = (firstItemError as Record<string, unknown>)[
          nestedFirstKey
        ];
        if (hasMessage(nestedObj)) {
          return nestedObj.message;
        }
      }
    }
  }

  return defaultMessage;
}
