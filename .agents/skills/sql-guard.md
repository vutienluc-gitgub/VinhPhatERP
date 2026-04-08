# SQL Guard Skill (STRICT MODE)

## SOURCE OF TRUTH

You MUST ALWAYS read:

.agents/context/schema.sql

BEFORE writing ANY SQL.

If schema is not read → STOP.

---

## CORE RULES

1. NEVER assume table or column exists
2. ONLY use columns that exist in schema.sql
3. DO NOT invent fields like "status", "type", "code" unless confirmed
4. If unsure → query information_schema first

---

## MANDATORY WORKFLOW

For EVERY SQL task:

### Step 1: Read schema

- Open .agents/context/schema.sql
- Locate table
- Verify columns

### Step 2: Validate

- Table exists?
- Column exists?
- Data type correct?

### Step 3: Write SQL

### Step 4: Self-check

- Compare SQL vs schema
- Remove any unknown column

If mismatch → FIX before output

---

## HARD FAIL CONDITIONS

STOP immediately if:

- Column not found in schema
- Table not found
- Foreign key unclear

DO NOT continue.

---

## SAFE MIGRATION RULES

- Use IF EXISTS / IF NOT EXISTS
- Avoid breaking existing data
- Prefer additive changes (ADD COLUMN)

---

## AUTO FIX STRATEGY

When column is missing:

### Option A (Preferred)

Remove condition using that column

### Option B

Add column explicitly:

ALTER TABLE table_name ADD COLUMN column_name text;

### Option C

Fallback:

COALESCE(column_name, 'default')

---

## ERROR-DRIVEN FIX LOOP

If SQL execution fails:

1. Read error message
2. Identify:
   - missing column?
   - wrong table?
   - wrong type?

3. Re-check schema.sql
4. Fix SQL
5. Repeat until valid

---

## OUTPUT REQUIREMENT

Only output SQL that is 100% valid against schema.sql

NO guessing
NO assumptions
