-- =============================================================================
-- Migration: Generic document number generator (atomic, race-condition safe)
-- Replaces all client-side fetchNext*Number() functions
-- =============================================================================

-- Generic function to generate the next sequential document number.
-- Uses pg_advisory_xact_lock to prevent race conditions.
--
-- Parameters:
--   p_table   : table name (e.g. 'yarn_receipts')
--   p_column  : column name (e.g. 'receipt_number')
--   p_prefix  : static prefix (e.g. 'NS-') or monthly prefix (e.g. 'DH2604-')
--   p_pad     : zero-pad width for the numeric portion (default 4)
--
-- Returns: next number string (e.g. 'NS-0042', 'DH2604-0015')

CREATE OR REPLACE FUNCTION generate_next_doc_number(
  p_table  TEXT,
  p_column TEXT,
  p_prefix TEXT,
  p_pad    INT DEFAULT 4
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_max_num INT;
  v_sql     TEXT;
  v_lock_id BIGINT;
BEGIN
  -- Derive a stable lock ID from table+prefix to serialize concurrent callers
  -- for the same document series without blocking other series.
  v_lock_id := hashtext(p_table || '::' || p_prefix);
  PERFORM pg_advisory_xact_lock(v_lock_id);

  -- Build dynamic query that:
  --   1. Filters rows matching the prefix
  --   2. Extracts the numeric suffix (everything after prefix)
  --   3. Casts to integer and finds max
  v_sql := format(
    'SELECT COALESCE(MAX(
       (regexp_replace(%I, %L, %L))::INT
     ), 0)
     FROM %I
     WHERE %I LIKE %L',
    p_column,                           -- column to extract from
    '^' || regexp_replace(p_prefix, '([.*+?^${}()|[\]\\])', '\\\1', 'g'),  -- escape prefix for regex
    '',                                 -- replace prefix with empty = numeric part
    p_table,                            -- table name
    p_column,                           -- column to filter
    p_prefix || '%'                     -- LIKE pattern
  );

  EXECUTE v_sql INTO v_max_num;

  RETURN p_prefix || lpad((v_max_num + 1)::TEXT, p_pad, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION generate_next_doc_number(TEXT, TEXT, TEXT, INT) TO authenticated;

-- Also update the existing weaving invoice helper to use the generic function
-- so all modules share the same atomic logic.
CREATE OR REPLACE FUNCTION next_weaving_invoice_number()
  RETURNS TEXT
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
AS $$
  SELECT generate_next_doc_number(
    'weaving_invoices',
    'invoice_number',
    'GC' || to_char(now(), 'YYMM') || '-',
    3
  );
$$;
