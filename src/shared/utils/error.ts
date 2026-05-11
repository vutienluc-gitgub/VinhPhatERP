/**
 * Safely extract an error message from an unknown value.
 * Use this instead of `error instanceof Error ? error.message : String(error)` to prevent runtime crashes.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  ) {
    return (error as Record<string, unknown>).message as string;
  }
  return JSON.stringify(error);
}
