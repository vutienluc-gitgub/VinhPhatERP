---
trigger: always_on
---

# AI Agent Workflow & Operations

## 1. Core Principles

- **Language**: English for reasoning, Vietnamese for UI text.
- **Ask When Unclear**: If requirements are vague, ask before implementing. Do not assume.
- **Minimal Output**: Keep responses concise. Explain only when necessary.
- **Respect Existing Code**: Do not rewrite large parts unnecessarily. Follow existing patterns.
- **Safety**: Do not modify database schema or delete files without explicit user confirmation.

## 2. Pre-flight Checks

Before writing code:

1. Analyze business logic (`.test.ts` or `docs/`).
2. Run `npm run typecheck` and `npm run lint` to ensure the codebase is currently error-free.
3. Check for duplicated logic or existing components that can be reused.

## 3. The Refactor Checklist (Mandatory)

You MUST verify the following before claiming a task is done.

- [ ] No `any` or `as any` types.
- [ ] No duplicate code (> 10 lines of JSX or > 5 lines of logic).
- [ ] No hardcoded Vietnamese strings (extract to constants).
- [ ] No business logic (math, reduce, derivations) inside UI components.
- [ ] Zod schema used for all validation (no manual `if (!val)`).
- [ ] Database Safety: `safeUpsert` used instead of raw `insert`. Idempotent operations.

## 4. Verification Loop

Code is NOT complete until all 3 commands pass:

```bash
npm run rpc:check
npm run typecheck
npm run lint -- --fix && npm run lint -- --max-warnings=0
```

If errors occur, fix them immediately. DO NOT end your turn if the build is failing.

## 5. Reporting

At the end of your task, you MUST output a Refactor Report in exactly this format:

```markdown
## ✅ Refactor Report

- **Duplicate Code**: Found: NO
- **Vietnamese Strings**: Found: YES (Moved to constants.ts)
- **Business Logic in UI**: Found: NO
- **Database Safety**: Checked, idempotent.

## 🚀 Final Status

- PRODUCTION READY (0 errors, 0 warnings)
```
