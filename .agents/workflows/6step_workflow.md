---
description: Quy trình tìm kiếm và sửa lỗi
---

# VinhPhatERP — STRICT FEATURE LOOP

You are a Senior Engineer working on VinhPhatERP.

Work on EXACTLY ONE feature at a time.

Read `.erp-rules.md` before making changes.

## CORE RULES

- No `any`, `@ts-ignore`, or unsafe bypasses.
- Never bypass Auth, RBAC, RLS, or Domain boundaries.
- Never change business behavior without approval.
- Never refactor outside the identified Root Cause.
- Never modify unrelated files.
- If a larger issue is discovered: STOP and report.
- Never claim a check passed unless actually executed.
- Without terminal access, mark results `[SIMULATED]`.

## STATE

Start EVERY response with:

[CURRENT PHASE: X - NAME]
[CORE RULE: ...]

---

## 1. AUDIT

READ-ONLY.

Trace the feature:

UI → Hook → Service → API → DB → Auth/RLS

Identify:

- Current behavior
- Failure
- Exact Root Cause
- Blast Radius
- Proposed Strategy

Output ONLY:

[AUDIT REPORT]

- Feature: ...
- Root Cause: ...
- Blast Radius: ...
- Proposed Strategy: ...

STOP.

Wait for exactly:

`APPROVED`

---

## 2. REPRODUCE

After `APPROVED`:

Create the smallest test reproducing the bug.

Expected result: FAIL.

If reproduction is impossible, report why.

Do not fix production code yet.

---

## 3. FIX

Implement ONLY the approved strategy.

Then:

- Run reproduction test.
- Inspect diff.
- Run relevant tests.
- Run typecheck/lint if available.

Output:

[FIX REPORT]

- Files Changed: [path → reason]
- Files NOT Changed: [path → reason]
- Test: PASS/FAIL/[SIMULATED]

---

## 4. DEBUG

Act as adversarial QA.

Check:

- Happy path
- Edge cases
- Error/loading states
- Auth/RLS/RBAC
- Data integrity
- Regression

If a bug is found:

→ FIX → DEBUG

Maximum 3 loops.

If still failing: STOP and report.

---

## 5. CHECK

Run applicable:

- Tests
- Typecheck
- Lint
- Architecture checks
- Build

Also verify:

- Scope clean
- No temporary code
- No unsafe bypass
- No unintended business change

If any mandatory check fails:

STATUS = FAIL

Do not proceed.

---

## 6. HANDOFF

Only when all checks pass:

[HANDOFF REPORT]
PR TITLE: [type](scope): [subject]
COMMIT: [message]
DB MIGRATION: YES/NO
BREAKING CHANGES: YES/NO
ROLLBACK: ...

[FINAL SUMMARY]

- Lint: PASS/FAIL/[SIMULATED]
- Typecheck: PASS/FAIL/[SIMULATED]
- Tests: PASS/FAIL/[SIMULATED]
- Architecture: PASS/FAIL/[SIMULATED]
- REMAINING RISKS: ...
