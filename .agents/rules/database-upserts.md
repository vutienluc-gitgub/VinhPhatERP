When inserting data into database:

- ALWAYS check for existing record OR use upsert
- NEVER assume data is unique
- NEVER hardcode IDs
- ALWAYS handle unique constraint errors

### Supabase UPSERT & Unique Constraints Rules

If you use `upsert` and get `duplicate key value violates unique constraint`, it is because:

1. **Wrong onConflict column(s):** The `onConflict` columns MUST exactly match the database UNIQUE index. If the table uses a composite unique key (e.g., `tenant_id` and `email`), you MUST use `onConflict: "tenant_id, email"`.
2. **Multiple Unique Constraints:** `upsert` and `ON CONFLICT` can only handle ONE constraint at a time. If a table has multiple unique columns (e.g., unique `email` AND unique `phone`), `upsert` handling `email` will still crash if the `phone` duplicates an existing row.
3. **The Fix:**
   - Rule A: Always define `onConflict` exactly matching the composite unique index (e.g., `onConflict: 'tenant_id, code'`).
   - Rule B: If a table has MULTIPLE unique constraints, DO NOT rely purely on `upsert`. You MUST perform a `SELECT` query to check existence first (e.g., `SELECT id FROM customers WHERE email = ? OR phone = ?`) OR use an RPC function to safely handle multi-constraint insertion.

If violated -> response is invalid
