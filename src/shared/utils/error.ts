/**
 * Safely extract an error message from an unknown value.
 * Use this instead of `(error as Error).message` to prevent runtime crashes.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return String(error);
}
