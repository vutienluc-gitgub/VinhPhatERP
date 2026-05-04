import { untypedDb } from '@/services/supabase/untyped';

/**
 * SAFE UPSERT (STRONG GUARANTEE)
 */
export async function safeUpsert<T>({
  table,
  data,
  conflictKey,
}: {
  table: string;
  data: T | T[];
  conflictKey: string;
}) {
  // Ensure ID exists
  const payload = Array.isArray(data)
    ? data.map((item) => ({
        id: (item as Record<string, unknown>).id || crypto.randomUUID(),
        ...item,
      }))
    : {
        id: (data as Record<string, unknown>).id || crypto.randomUUID(),
        ...data,
      };

  const { data: result, error } = await untypedDb
    .from(table)
    .upsert(payload, {
      onConflict: conflictKey,
      ignoreDuplicates: false,
    })
    .select();

  if (error) {
    console.error('[DB_UPSERT_ERROR]', error);
    throw new Error(error.message || 'Database upsert failed');
  }

  return result;
}

/**
 * SAFE UPSERT — single row convenience wrapper.
 * Eliminates repeated `Array.isArray(result) ? result[0] : result` boilerplate.
 */
export async function safeUpsertOne<T>(params: {
  table: string;
  data: T;
  conflictKey: string;
}): Promise<unknown> {
  const result = await safeUpsert(params);
  return Array.isArray(result) ? result[0] : result;
}

/**
 * SAFE INSERT (only when truly needed)
 */
export async function safeInsert({
  table,
  data,
  uniqueCheck,
}: {
  table: string;
  data: Record<string, unknown>;
  uniqueCheck: { column: string; value: unknown };
}) {
  const { data: existing } = await untypedDb
    .from(table)
    .select('*')
    .eq(uniqueCheck.column, uniqueCheck.value)
    .maybeSingle();

  if (existing) {
    return existing; // tránh duplicate
  }

  const { error, data: inserted } = await untypedDb
    .from(table)
    .insert(data)
    .select()
    .maybeSingle();

  if (error) {
    throw new Error(error.message || 'Database insert failed');
  }

  return inserted;
}
