/**
 * Atomic document number generator via database RPC.
 *
 * Calls `generate_next_doc_number` which uses `pg_advisory_xact_lock`
 * to prevent race conditions when multiple users create documents at
 * the same time.
 */
import { untypedDb } from '@/services/supabase/untyped';

type DocNumberParams = {
  table: string;
  column: string;
  prefix: string;
  pad?: number;
};

export async function fetchNextDocNumber({
  table,
  column,
  prefix,
  pad = 4,
}: DocNumberParams): Promise<string> {
  const { data, error } = await untypedDb.rpc('generate_next_doc_number', {
    p_table: table,
    p_column: column,
    p_prefix: prefix,
    p_pad: pad,
  });

  if (error) throw error;
  return data as string;
}

/**
 * Build a monthly prefix like "DH2604-" from a base code.
 * @param code - e.g. 'DH', 'BG', 'TT', 'XK', 'DN', 'PC'
 */
export function monthlyPrefix(code: string): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  return `${code}${yy}${mm}-`;
}
