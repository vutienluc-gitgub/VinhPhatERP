# VinhPhatERP AI Refactoring & Engineering Workflow

## 1. PURPOSE & GOLDEN RULE

This document specifies the exact, step-by-step workflow AI Agents MUST follow when auditing, refactoring, or extending code in **VinhPhatERP v3**.

> 🚨 **GOLDEN PRINCIPLE**:  
> **AI MUST NOT execute all phases in a single turn.**  
> The workflow is broken into sequential phases separated by **Human Approval Gates**.  
> The AI Agent acts as an engineer who inspects, proposes, and executes only what is approved by the Human Gatekeeper.

---

## 2. THE 5-PHASE ARCHITECTURE WITH APPROVAL GATES

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
        (User: "APPROVE PHASE 4" or "REVISE UI...")
                               ↓
┌─────────────────────────────────────────────────────────────┐
│                  PHASE 4: CLEANUP & POLISH                  │
│  Eliminate duplicates, extract constants, clean dead code.  │
└──────────────────────────────┬──────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────┐
│              PHASE 5: TEST & FINAL VERIFICATION             │
│  Run rpc:check, typecheck, lint, lint:css, vitest.          │
│  Fill AI_CHECKLIST.md. Output Final Production Report.      │
└──────────────────────────────┬──────────────────────────────┘
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
  - Verify all 4 checks pass

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

#### 🗄️ Database Migration & Schema Protocol
- New database changes MUST create a new migration file under `supabase/migrations/` using timestamp prefix (`YYYYMMDDHHMMSS_name.sql`).
- **FORBIDDEN**: Never modify already applied migration files.
- All new or modified functions/RPCs MUST declare `SECURITY DEFINER` and `SET search_path = public, pg_temp`.
- Always update TypeScript database types in `src/schema/database.types.ts` following schema additions.

**Output Format**:

```markdown
### Phase 2 Implementation Summary

- **Files Changed**: `[link to file]`
- **Rules Fixed**: Rule 3, Rule 6
- **RPC Sync**: PASS (0 issues)
- **Typecheck**: PASS (0 errors)
- **Business Behavior Changed?**: NO (behavior preserved 100%)

🛑 AWAITING USER APPROVAL (GATE 2)
```

---

### 🛑 GATE 2: USER APPROVAL

The human reviewer checks the data diff and replies:

- `APPROVE PHASE 3`
- `REVISE PHASE 2: [user instructions]`

---

### 🟣 PHASE 3: UI / UX & PWA (Execution)

**Goal**: Elevate presentation quality, loading states, render safety, semantic design tokens, and PWA capabilities.

**Rules**:

- Implement ONLY approved Phase 3 items.
- Add skeletons, error states, and empty states.
- Ensure all list keys are stable (`item.id`).
- Replace hardcoded colors with Semantic Design Tokens (`text-foreground`, `bg-surface`, etc.).
- **DO NOT modify domain logic or calculations.**
- Inspect diff, run `npm run lint:css` and `npm run lint`.

#### 📲 PWA & Service Worker Guidelines
- Service Worker modifications (`public/sw.js`) MUST remain compatible with mobile browsers (iOS Safari & Android Chrome).
- **FORBIDDEN**: Never reference DOM/Window APIs (`window`, `localStorage`, `document`) inside Service Worker scope (`self`). Use IndexedDB or postMessage.
- Ensure Push Notification `tag` formatting is unique to avoid collapsing alerts on iOS Lock Screen.

**Output Format**:

```markdown
### Phase 3 UI Summary

- **Files Changed**: `[link to file]`
- **UX States Added**: Skeleton, Error inline, Empty table fallback
- **CSS Lint**: PASS (0 errors)
- **ESLint**: PASS (0 warnings)

🛑 AWAITING USER APPROVAL (GATE 3)
```

---

### 🛑 GATE 3: USER APPROVAL

The human reviewer checks the visual diff and replies:

- `APPROVE PHASE 4 & 5`

---

### ⚫ PHASE 4: CLEANUP & POLISH (Execution)

**Goal**: Clean code, eliminate redundancy, enforce domain constants.

**Rules**:

- Remove dead code, unused imports, console logs.
- Extract repeated Vietnamese strings into `constants.ts`.
- Ensure component files are under 300 lines.

---

### 🔴 PHASE 5: TEST & FINAL VERIFICATION (Quality Gate)

**Goal**: Full verification across the entire quality toolchain for both Client and Hono Backend Server.

**Actions**:

1. Run automated test and quality suite:
   ```bash
   npm run rpc:check
   npm run typecheck
   npm run typecheck:server   # Server TypeScript verification
   npm run lint -- --max-warnings=0
   npm run lint:css
   npm run test
   npm run build:all          # Verify production builds for client & server
   ```
2. Verify all checks report **0 errors, 0 warnings, 100% tests passed**.
3. Complete `AI_CHECKLIST.md`.
4. Output final report.

#### 🆘 Emergency Rollback Protocol
If any phase implementation causes unresolvable build errors or breaks pre-existing unit tests, the AI Agent MUST:
1. Immediately restore affected files (`restore_file`) to the last working commit.
2. Re-evaluate the root cause before attempting a revised solution.

**Output Format**:

```markdown
## ✅ FINAL PRODUCTION REPORT

### Verification Status

- `npm run rpc:check`: ✅ 0 issues
- `npm run typecheck`: ✅ 0 errors
- `npm run typecheck:server`: ✅ 0 errors
- `npm run lint`: ✅ 0 warnings
- `npm run lint:css`: ✅ 0 errors
- `npm run test`: ✅ 100% passed
- `npm run build:all`: ✅ 0 build errors

### Summary of Changes

- Core logic extracted to pure service
- UX states added (skeleton, empty state)
- Constants extracted

### Business Behavior Changed?

- **NO** — 100% backward compatible.

🚀 PRODUCTION READY — Ready for Git commit.
```
