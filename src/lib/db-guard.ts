/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/services/supabase/client';

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
    ? data.map((item: any) => ({
        id: item.id || crypto.randomUUID(),
        ...item,
      }))
    : {
        id: (data as any).id || crypto.randomUUID(),
        ...data,
      };

  const { data: result, error } = await supabase
    .from(table as any)
    .upsert(payload, {
      onConflict: conflictKey,
      ignoreDuplicates: false,
    })
    .select();

  if (error) {
    console.error('❌ DB UPSERT ERROR:', error);
    throw error;
  }

  return result;
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
  data: any;
  uniqueCheck: { column: string; value: any };
}) {
  const { data: existing } = await supabase
    .from(table as any)
    .select('*')
    .eq(uniqueCheck.column, uniqueCheck.value)
    .maybeSingle();

  if (existing) {
    return existing; // tránh duplicate
  }

  const { error, data: inserted } = await supabase
    .from(table as any)
    .insert(data)
    .select()
    .maybeSingle();

  if (error) {
    throw error;
  }

  return inserted;
}
