# VinhPhatERP AI Refactoring & Engineering Workflow

## 1. PURPOSE & GOLDEN RULE

This document specifies the exact, step-by-step workflow AI Agents MUST follow when auditing, refactoring, or extending code in **VinhPhatERP v3**.

> 🚨 **GOLDEN PRINCIPLE**:  
> **AI MUST NOT execute all phases in a single turn.**  
> The workflow is broken into sequential phases separated by **Human Approval Gates**.  
> The AI Agent acts as an engineer who inspects, proposes, and executes only what is approved by the Human Gatekeeper.

### 1.1 Approval Token Protocol (MANDATORY)

A Gate is opened **only** by the exact literal approval token for that Gate.

| Gate   | Accepted token (exact) | Alternative                      |
| ------ | ---------------------- | -------------------------------- |
| Gate 1 | `APPROVE PHASE 2`      | `APPROVE PHASE 2 ONLY`           |
| Gate 2 | `APPROVE PHASE 3`      | `REVISE PHASE 2: <instructions>` |
| Gate 3 | `APPROVE PHASE 4 & 5`  | `REVISE PHASE 3: <instructions>` |
| Gate 4 | `APPROVE MERGE`        | `REVISE CLEANUP: <instructions>` |

Rules:

1. **Silence, questions, or vague assent are NOT approval.** "ok", "trong on day", "tiep di", "looks good" do NOT open a Gate. If the reply is not an exact token, the AI MUST re-state the Gate and ask again — never infer consent.
2. **A token opens exactly one Gate.** Approval is never carried forward, inherited, or reused for a later phase.
3. **Tokens are case-insensitive but otherwise literal.** `APPROVE PHASE 2` matches; `APPROVE PHASE 2 and 3` does not (ask which one).
4. **Never self-approve.** The AI may not emit an approval token, and may not treat its own proposal as approved because the user is idle.
5. **Partial scope is respected literally.** `APPROVE PHASE 2 ONLY` means Phase 3 stays closed until a new token arrives.

### 1.2 Evidence Rule (MANDATORY)

> **AI MUST NEVER claim that a check passed unless that exact command was actually executed in this session and its real output was observed.**

1. Report results **exactly as the command printed them** — actual exit code and actual counts. Never write a template's mark as if it were a measurement.
2. A check that was **not run** must be reported as `[NOT RUN]` with the reason. A check that **cannot** run (e.g. no DB access) must be reported as `[NOT VERIFIED]`. Neither may be reported as PASS.
3. A check that was **simulated** or reasoned about without execution must be marked `[SIMULATED]`.
4. **A template with pre-filled pass marks is not evidence.** Template blocks below are layout placeholders — replace each mark with the real observed result.
5. If a mandatory check fails, the current phase **fails**. Do not proceed to the next phase, and do not soften the failure to "passes with minor issues".

### 1.3 Branch & Commit Discipline (MANDATORY)

1. Work on a branch — **never directly on `main`**. Use `fix/<scope>` or `chore/<scope>`.
2. **One commit per approved phase**, so any phase can be reverted independently. Suggested messages: `refactor(core): ...` (Phase 2), `refactor(ui): ...` (Phase 3), `chore(cleanup): ...` (Phase 4).
3. Do not squash phases together before approval. If Phase 5 fails, `git revert` the offending phase commit rather than unpicking a mixed diff.

---

## 2. THE PHASE ARCHITECTURE WITH APPROVAL GATES

```text
┌─────────────────────────────────────────────────────────────┐
│                      PHASE 0: CONTEXT                       │
│  Read-only. Understand target, dependencies & Impact Map.   │
└──────────────────────────────┬──────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────┐
│                       PHASE 1: AUDIT                        │
│  Read-only. Audit target against 22 ERP Rules. Plan diff.   │
└──────────────────────────────┬──────────────────────────────┘
                               ↓
                   🛑 GATE 1: USER APPROVAL
        (User: "APPROVE PHASE 2" or "MODIFY PLAN...")
                               ↓
┌─────────────────────────────────────────────────────────────┐
│                 PHASE 2: CORE / DATA / DOMAIN               │
│  Implement business logic, data access, validation & RPC.   │
│  Strictly DO NOT touch UI or CSS.                           │
└──────────────────────────────┬──────────────────────────────┘
                               ↓
                   🛑 GATE 2: USER APPROVAL
        (User: "APPROVE PHASE 3" or "REVISE CORE...")
                               ↓
┌─────────────────────────────────────────────────────────────┐
│                      PHASE 3: UI / UX                       │
│  Implement loading skeletons, error states, empty states,   │
│  render safety, and semantic tokens. DO NOT alter logic.    │
└──────────────────────────────┬──────────────────────────────┘
                               ↓
                   🛑 GATE 3: USER APPROVAL
        (User: "APPROVE PHASE 4 & 5" or "REVISE UI...")
                               ↓
┌─────────────────────────────────────────────────────────────┐
│                  PHASE 4: CLEANUP & POLISH                  │
│  Eliminate duplicates, extract constants, clean dead code.  │
└──────────────────────────────┬──────────────────────────────┘
                               ↓
              🛑 GATE 4: FINAL DIFF REVIEW
        (User: "APPROVE MERGE" or "REVISE CLEANUP...")
                               ↓
┌─────────────────────────────────────────────────────────────┐
│              PHASE 5: TEST & FINAL VERIFICATION             │
│  Run rpc:check, typecheck, lint, lint:css, vitest.          │
│  Fill AI_CHECKLIST.md. Output Final Production Report.      │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. PHASE DETAILS

### 🟢 PHASE 0: CONTEXT & IMPACT MAPPING (Read-only)

**Goal**: Build precise situational awareness without modifying any code.

**Actions**:

1. Read `.erp-rules.md`.
2. Inspect target file and direct dependencies (Scoped Context only).
3. Construct the **Impact Map**:
   `Target UI -> Hook -> Service -> API -> RPC -> DB Table`.
4. Identify active tests and domain boundaries.
5. Flag any potential risks or unknowns.

**Output Format**:

```markdown
### Phase 0 Context Summary

- **Target**: `path/to/TargetFile.tsx`
- **Impact Map**:
  - UI Sub-components: ...
  - Custom Hooks: ...
  - Domain Services: ...
  - API / RPC: ...
  - DB Tables & RLS: ...
- **ERP Safety Check**: Does this touch pricing, inventory, debt, or order status? [YES / NO]
- **Risk Assessment**: [LOW / MEDIUM / HIGH]
- **Status**: READY FOR PHASE 1
```

---

### 🔵 PHASE 1: AUDIT & PLANNING (Read-only)

**Goal**: Audit code against the 22 ERP Rules and structure a clear refactoring plan.

**Actions**:

1. Evaluate the target against the 22 Rules in `.erp-rules.md`.
2. For each rule violation, provide exact file, line number, and risk.
3. Propose a segmented plan grouped into **Phase 2 (Core)**, **Phase 3 (UI)**, **Phase 4 (Cleanup)**, **Phase 5 (Tests)**.
4. **DO NOT modify any code.**
5. **STOP and wait for User Gate 1.**

**Output Format**:

```markdown
### Phase 1 Audit Report

- **Rule 3 (Business Logic in UI)**: [VIOLATION] at `Line 142` — inline calculation of subtotal.
- **Rule 6 (Database Safety)**: [VIOLATION] at `Line 210` — direct mutation without idempotent RPC.
- **Rule 20 (UX States)**: [VIOLATION] at `Line 85` — missing loading skeleton.

### Proposed Refactoring Plan

- **PHASE 2 (Core / Data)**:
  - Extract calculation to `order-calc.service.ts`
  - Switch direct write to `safeUpsert` / `rpc_update_order`
- **PHASE 3 (UI / UX)**:
  - Add `<OrderSkeleton />`
  - Add empty state for line items
- **PHASE 4 (Cleanup)**:
  - Move string literals to `order.constants.ts`
- **PHASE 5 (Test & Verify)**:
  - Add unit tests for `order-calc.service.test.ts`
  - Verify all mandatory checks (report `[NOT VERIFIED]` for any needing DB)

🛑 AWAITING USER APPROVAL (GATE 1)
```

---

### 🛑 GATE 1: USER APPROVAL

The human reviewer reviews the audit and replies:

- `APPROVE PHASE 2 ONLY`
- `MODIFY PLAN: [user instructions]`

---

### 🟠 PHASE 2: CORE / DATA / DOMAIN (Execution)

**Goal**: Implement pure business logic, database transactions, validation, and data flows.

**Rules**:

- Implement ONLY approved Phase 2 items.
- **DO NOT touch UI components or CSS modules.**
- Preserve exact existing business behavior unless explicitly instructed.
- All multi-row or stock/debt operations must be atomic RPCs.
- Inspect diff, run `npm run typecheck` and `npm run rpc:check`.

**Output Format**:

```markdown
### Phase 2 Implementation Summary

- **Files Changed**: `[link to file]`
- **Rules Fixed**: Rule 3, Rule 6
- **RPC Sync**: <PASS (n) / FAIL (n) / [NOT VERIFIED] + reason if no DB access>
- **Typecheck**: <real result>
- **Business Behavior Changed?**: NO (behavior preserved 100%)

🛑 AWAITING USER APPROVAL (GATE 2)
```

---

### 🛑 GATE 2: USER APPROVAL

The human reviewer checks the data diff and replies:

- `APPROVE PHASE 3`
- `REVISE PHASE 2: [user instructions]`

---

### 🟣 PHASE 3: UI / UX (Execution)

**Goal**: Elevate presentation quality, loading states, render safety, and semantic design tokens.

**Rules**:

- Implement ONLY approved Phase 3 items.
- Add skeletons, error states, and empty states.
- Ensure all list keys are stable (`item.id`).
- Replace hardcoded colors with Semantic Design Tokens (`text-foreground`, `bg-surface`, etc.).
- **DO NOT modify domain logic or calculations.**
- Inspect diff, run `npm run lint:css` and `npm run lint`.

**Output Format**:

```markdown
### Phase 3 UI Summary

- **Files Changed**: `[link to file]`
- **UX States Added**: Skeleton, Error inline, Empty table fallback
- **CSS Lint**: <real result>
- **ESLint**: <real result>

🛑 AWAITING USER APPROVAL (GATE 3)
```

---

### 🛑 GATE 3: USER APPROVAL

The human reviewer checks the visual diff and replies:

- `APPROVE PHASE 4 & 5` — opens **Phase 4 only**. Phase 5 still needs Gate 4.
- `REVISE PHASE 3: [user instructions]`

---

### ⚫ PHASE 4: CLEANUP & POLISH (Execution)

**Goal**: Clean code, eliminate redundancy, enforce domain constants.

**Rules**:

- Remove dead code, unused imports, console logs.
- Extract repeated Vietnamese strings into `constants.ts`.
- **File size ratchet (Rule 11):** a file you touch must not grow beyond 300 lines, and must not grow at all if already above 300. Do NOT bulk-split pre-existing oversized files — that is out of scope, violates "no speculative refactoring", and will be rejected at Gate 4. Report pre-existing violations as observations instead of fixing them.
- **Cleanup is not behaviour-neutral by default.** Deleting "dead" code that is still reachable, or re-typing a constant so its value changes, is a `[BUSINESS BEHAVIOR CHANGE]` under Rule 3. Flag it, do not do it silently.

---

### 🛑 GATE 4: FINAL DIFF REVIEW

Cleanup is the phase most likely to introduce unintended behaviour drift, so the final diff is reviewed by a human before verification is accepted.

The human reviewer reads the complete diff and replies:

- `APPROVE MERGE` — authorises Phase 5 to be reported as final.
- `REVISE CLEANUP: [user instructions]` — return to Phase 4.

Until `APPROVE MERGE` is received, the Phase 5 report is **not** a production-ready claim, even if every command passed.

---

### 🔴 PHASE 5: TEST & FINAL VERIFICATION (Quality Gate)

**Goal**: Full verification across the entire quality toolchain.

**Actions**:

1. Run automated test suite:
   ```bash
   npm run rpc:check
   npm run typecheck
   npm run lint -- --max-warnings=0
   npm run lint:css
   npm run test
   ```
2. Verify all checks report **0 errors, 0 warnings, 100% tests passed**.
3. Complete `AI_CHECKLIST.md`.
4. Output final report.

### Checks that need database access

`npm run rpc:check` compares frontend `rpc()` calls against live function signatures and therefore **requires `DATABASE_URL`**. It cannot pass offline, in CI, or in a sandbox.

If the database is unreachable:

1. Report it as `[NOT VERIFIED]`, never as PASS. State plainly that RPC/database sync was not confirmed.
2. Mark the SQL/RPC portions of `AI_CHECKLIST.md` as unverified alongside it.
3. Note that `.husky/pre-push` offers `SKIP_RPC_CHECK=1 git push` as an _escape hatch for pushing_, not as a way to claim the check passed. Using it means the check is skipped, not satisfied.
4. Always flag it in the final report so the human reviewer can run `npm run rpc:check` in an environment with DB access before merging.

### Phase applicability

Not every phase applies to every task. A pure-logic change with no UI has an empty Phase 3; a doc-only change may have empty Phases 2-4. State that the phase is **not applicable** rather than inventing work for it. Every phase is still reported and every Gate is still passed — an empty phase is reported as empty, not silently skipped.

### Single-file tasks spanning logic and UI

Some files (e.g. a 500+ line form component) contain both business logic and presentation. Do not split the edit artificially across Phase 2 and Phase 3 on the same file. Instead declare the file as **mixed-scope** in the Phase 1 plan, state which lines belong to which concern, and handle it in the phase carrying the dominant risk (usually Phase 2). This must be approved at Gate 1.

**Output Format**:

```markdown
## FINAL PRODUCTION REPORT

### Verification Status

<!-- Fill with REAL observed output. See section 1.2 Evidence Rule.
     Use: PASS (n) / FAIL (n) / [NOT RUN] / [NOT VERIFIED] / [SIMULATED].
     A mark that was not measured must not appear here. -->

- `npm run rpc:check`: <real result, or [NOT VERIFIED] + reason>
- `npm run typecheck`: <real result>
- `npm run lint -- --max-warnings=0`: <real result>
- `npm run lint:css`: <real result>
- `npm run test`: <real result, e.g. "719 passed (115 files)">

### Summary of Changes

- Core logic extracted to pure service
- UX states added (skeleton, empty state)
- Constants extracted

### Business Behavior Changed?

- **NO** / **YES — flagged at Gate n**

### Open Items

- <e.g. "rpc:check unverified — no DB access; must run before merge">

🚀 Ready for Git commit — pending Gate 4 (`APPROVE MERGE`) and human sign-off on any unverified check.
```
