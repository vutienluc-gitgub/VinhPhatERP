/**
 * query-db-functions.ts
 * Lấy danh sách tất cả functions trong schema public từ PostgreSQL.
 * Dùng pg_proc — không cần extension hay quyền đặc biệt.
 */

import postgres from 'postgres';

export type DbParam = {
  name: string; // tên param, vd: p_id
  type: string; // SQL type, vd: uuid, text, integer
  hasDefault: boolean; // true if param has DEFAULT value (optional)
};

export type DbFunction = {
  name: string;
  params: DbParam[];
  returnType: string;
  rawArgs: string; // raw string từ pg_get_function_arguments, dùng để debug
};

// ──────────────────────────────────────────────
// Parse chuỗi args từ pg_get_function_arguments
// Input:  "p_id uuid, p_name text, p_amount numeric DEFAULT NULL"
// Output: [{ name: 'p_id', type: 'uuid' }, { name: 'p_name', type: 'text' }, ...]
// ──────────────────────────────────────────────
function parseArgString(rawArgs: string): DbParam[] {
  if (!rawArgs || rawArgs.trim() === '') return [];

  return rawArgs
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => {
      // Detect DEFAULT clause
      const hasDefault = /\bDEFAULT\b/i.test(segment);
      const withoutDefault = segment.replace(/\s+DEFAULT\s+.+$/i, '').trim();

      // Format: "name type" or "IN/OUT name type"
      const parts = withoutDefault.split(/\s+/);

      // Skip mode keywords (IN, OUT, INOUT, VARIADIC)
      const modeKeywords = new Set(['in', 'out', 'inout', 'variadic']);
      const filtered = parts.filter((p) => !modeKeywords.has(p.toLowerCase()));

      if (filtered.length < 2) {
        // Unnamed param, only type
        return { name: '', type: filtered[0] ?? 'unknown', hasDefault };
      }

      const name = filtered[0];
      const type = filtered.slice(1).join(' ');

      return { name, type, hasDefault };
    })
    .filter((p) => p.name !== ''); // bỏ unnamed params
}

// ──────────────────────────────────────────────
// Normalize SQL type để so sánh dễ hơn
// "character varying" → "text", "integer" → "int", v.v.
// ──────────────────────────────────────────────
export function normalizeType(sqlType: string): string {
  const t = sqlType.toLowerCase().trim();
  const map: Record<string, string> = {
    'character varying': 'text',
    varchar: 'text',
    character: 'text',
    char: 'text',
    integer: 'int',
    int4: 'int',
    int8: 'bigint',
    float4: 'numeric',
    float8: 'numeric',
    'double precision': 'numeric',
    bool: 'boolean',
    'timestamp with time zone': 'timestamptz',
    'timestamp without time zone': 'timestamp',
  };
  return map[t] ?? t;
}

// ──────────────────────────────────────────────
// Main: query database
// ──────────────────────────────────────────────
export async function getDbFunctions(
  connectionString: string,
): Promise<DbFunction[]> {
  const sql = postgres(connectionString, {
    max: 1,
    idle_timeout: 10,
    connect_timeout: 10,
    ssl: 'require',
  });

  try {
    const rows = await sql<
      {
        name: string;
        args: string;
        return_type: string;
      }[]
    >`
      SELECT
        p.proname                          AS name,
        pg_get_function_arguments(p.oid)   AS args,
        pg_get_function_result(p.oid)      AS return_type
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND p.prokind = 'f'       -- chỉ lấy functions, không lấy procedures/aggregates
      ORDER BY p.proname
    `;

    return rows.map((row) => ({
      name: row.name,
      params: parseArgString(row.args),
      returnType: row.return_type,
      rawArgs: row.args,
    }));
  } finally {
    await sql.end();
  }
}
