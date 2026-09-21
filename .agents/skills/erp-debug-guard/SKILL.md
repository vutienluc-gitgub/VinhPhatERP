---
name: erp-debug-guard
description: Structured 6-step root-cause debugging, hypothesis verification, and safe error recovery for VinhPhatERP. Use when diagnosing bugs, investigating RPC/Supabase failures, fixing broken queries, or resolving state inconsistencies without risking business data.
---

# ERP Debug Guard (Root-Cause Investigation & Safe Recovery)

## Overview

Adapted from Addy Osmani's `debugging-and-error-recovery` and `doubt-driven-development`.
In an enterprise ERP, **"guessing and fixing" is dangerous**. A naive fix in a transaction can corrupt ledger balances, stock counts, or supplier debt.
Debug Guard enforces systematic root-cause tracing, hypothesis testing with doubt, and minimally invasive corrections.

---

## The ERP Safety Invariant (CRITICAL)

Before changing any code to fix a bug, assess whether your fix alters:

- Pricing / Discounts / VAT
- Fabric roll counts / Stock quantities / Unit conversions
- Customer / Supplier debt (Công nợ AR / AP)
- Order status flow
- RLS policies or permissions

If yes $\rightarrow$ **STOP IMMEDIATELY**. Explicitly flag the issue as **`[BUSINESS BEHAVIOR CHANGE]`**, explain the difference and risk, and ask for user confirmation. Never alter core business rules under the pretext of fixing a bug.

---

## The 6-Step Debugging Protocol

```text
1. OBSERVE & LOG ──▶ 2. IMPACT MAP ──▶ 3. DOUBT & HYPOTHESIS
        │
        ▼
4. REPRODUCE TEST ──▶ 5. MINIMAL FIX ──▶ 6. VERIFY & GUARD
```

### Step 1: Observe & Collect Concrete Evidence

- Read the exact error message, stack trace, and HTTP/RPC response payload.
- Never assume what broke without seeing actual logs.
- Identify the exact layer where the failure originates:
  - Frontend React render error (e.g. `undefined is not an object`)
  - Hook / React Query caching or stale closure error
  - API / Hono routing or Zod validation rejection
  - Supabase RPC parameter mismatch or SQL runtime error
  - Database constraint or RLS policy denial

### Step 2: Trace the Vertical Impact Map

Map the entire vertical execution path:

```text
UI Component (User Action)
  ↓
Custom Hook (State / React Query Mutation)
  ↓
API Client (`src/api/...` or Supabase SDK)
  ↓
RPC Function (`untypedDb.rpc(...)`)
  ↓
Database Table / Foreign Keys / RLS Trigger
```

Identify which layer mutated the state unexpectedly or broke the contract.

### Step 3: Doubt Assumptions & Formulate Hypothesis

Apply **Doubt-Driven Development**:

- "Is the parameter type matching what Postgres expects?" (Check `supabase/migrations` or generated DB types).
- "Is this write idempotent?" (Did a network retry cause a duplicate row?).
- "Is the RLS policy blocking the current user role?"
- "Is there a stale cache in React Query that wasn't invalidated after mutation?"
- Formulate a single, testable hypothesis before touching code.

### Step 4: Reproduce with a Minimal Case or Unit Test

- Write a failing test in Vitest reproducing the unexpected condition, or trace the exact input payload that causes the failure.
- If it cannot be reproduced, inspect network timing (race conditions) or missing database foreign keys.

### Step 5: Implement the Minimal Invasive Fix

- Apply the fix at the **source layer**, not with a superficial band-aid in the UI.
- Use `safeUpsert` from `@/lib/db-guard` instead of raw insert if handling single-row writes.
- If generated Supabase types are stale, use `untypedDb.rpc(...)` rather than `as any`.
- Maintain full idempotency — running the operation twice must yield the same clean result.

### Step 6: Verify & Add Regression Guard

Run the complete 5-command verification suite:

```bash
npm run rpc:check
npm run typecheck
npm run lint -- --max-warnings=0
npm run lint:css
npm run test
```

Verify that the bug is resolved and no unrelated features or tests were broken.
