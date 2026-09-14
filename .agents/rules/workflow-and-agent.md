---
trigger: always_on
---

# AI Agent Workflow & Operations

## 1. Core Principles

- **Language**: English for reasoning, Vietnamese for UI text.
- **Mandatory Governance**: Read and follow `.erp-rules.md` and `AI_WORKFLOW.md` at workspace root.
- **Gated Execution**: DO NOT execute Phase 0 to Phase 5 in a single turn. Always pause at Gate 1, Gate 2, and Gate 3 for human approval.
- **ERP Safety**: NEVER alter pricing, debt, stock quantities, or status flow under the guise of refactoring. Classify as `[BUSINESS BEHAVIOR CHANGE]` and stop.
- **Ask When Unclear**: If requirements are vague, ask before implementing. Do not assume.
- **Respect Existing Code**: Do not rewrite large parts unnecessarily. Follow existing patterns.
- **Safety**: Do not modify database schema or delete files without explicit user confirmation.

## 2. Pre-flight Checks (Phase 0)

Before writing or modifying any code:

1. Read `.erp-rules.md` and target file dependencies.
2. Build the **Impact Map**: `UI -> Hook -> Service -> API -> RPC -> DB`.
3. Check for duplicated logic or existing components that can be reused.
4. Run pre-flight verification: `npm run typecheck`, `npm run lint`, `npm run lint:css`.

## 3. The Quality Gate Checklist (AI_CHECKLIST.md)

Verify all criteria in `AI_CHECKLIST.md` before claiming a task is done. Key highlights:

- [ ] No `any` or `as any` types.
- [ ] No duplicate code (> 10 lines of JSX or > 5 lines of logic).
- [ ] No hardcoded Vietnamese strings (extract to constants).
- [ ] No business logic (math, reduce, derivations) inside UI components.
- [ ] Zod schema used for all validation (no manual `if (!val)`).
- [ ] Database Safety: `safeUpsert` used instead of raw `insert`. Idempotent operations. Atomic RPCs for multi-row mutations.
- [ ] Stylelint Guard: No hardcoded colors in `.css` (must pass `npm run lint:css`).
- [ ] Render Safety: Stable keys, null guards, loading skeletons, empty states.

## 4. Verification Loop (Phase 5)

Code is NOT complete until all 5 commands pass with 0 errors:

```bash
npm run rpc:check
npm run typecheck
npm run lint -- --max-warnings=0
npm run lint:css
npm run test
```

If errors occur, fix them immediately. DO NOT end your turn if the build or tests are failing.

## 5. Reporting

At the end of your task, you MUST output a Refactor Report adhering to `AI_WORKFLOW.md`:

```markdown
## ✅ Final Production Report

### Verification Status

- `npm run rpc:check`: ✅ 0 issues
- `npm run typecheck`: ✅ 0 errors
- `npm run lint`: ✅ 0 warnings
- `npm run lint:css`: ✅ 0 errors
- `npm run test`: ✅ 100% passed

### ERP Safety

- **Business Behavior Changed?**: NO (behavior preserved 100%)

🚀 PRODUCTION READY — Ready for Git commit.
```
