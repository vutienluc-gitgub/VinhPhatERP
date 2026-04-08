/**
 * Untyped Supabase accessor for tables/RPCs not yet in database.types.ts.
 *
 * This helper wraps `supabase` to allow querying tables and calling RPCs
 * that exist in the database but are not present in the generated type file.
 *
 * Usage:
 *   untypedDb.from('new_table').select('*').eq('col', val)
 *   untypedDb.rpc('new_function', { p_id: someId })
 *
 * TODO: Remove this file after regenerating database.types.ts with:
 *   npx supabase gen types typescript --project-id=<id> > src/services/supabase/database.types.ts
 */
import type { SupabaseClient } from '@supabase/supabase-js';

import { supabase } from '@/services/supabase/client';

/**
 * A minimal untyped Supabase client.
 * Uses `SupabaseClient<never>` to bypass generated schema checks
 * while keeping all PostgREST builder methods (.select, .eq, .insert, etc.).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const untypedDb = supabase as unknown as SupabaseClient<any>;
