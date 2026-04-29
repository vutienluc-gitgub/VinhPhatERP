import type { ZodSchema, ZodError } from 'zod';

/**
 * Validate input data at the API layer before writing to the database.
 * Throws a user-friendly error message if validation fails.
 *
 * @example
 * ```ts
 * const validated = validateApiInput(ordersSchema, rawInput);
 * await untypedDb.rpc('rpc_create_order', { p_header: validated });
 * ```
 */
export function validateApiInput<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = formatZodError(result.error);
    throw new Error(`[ValidationError] ${message}`);
  }
  return result.data;
}

/**
 * Format Zod validation errors into a human-readable string.
 */
function formatZodError(error: ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
      return `${path}${issue.message}`;
    })
    .join('; ');
}
