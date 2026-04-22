---
trigger: always_on
---

---

## trigger: always_on

# AI Agent Operating Manual (Premium Standard)

## 1. Response Principles & Language

- **Language**: All responses must be in **English**.
- **Style**: Professional, concise, no use of Emoji.
- **"Premium" Standard**: Output must be polished, with a flexible responsive interface that does not break the overall system layout.

---

## 2. Pre-flight Check

Before touching any line of code, the Agent **MUST**:

1. **Analyze Business Logic**: Find and read relevant `.spec.ts`, `.test.ts` files or documentation in `docs/` related to the feature.
2. **Check system state**: Run `npm run typecheck` and `npm run lint` to ensure the current codebase has no pre-existing errors.
3. **Handle Pre-flight failures**: If step 2 reveals errors, **stop and report immediately** using the format below. Do not self-fix errors outside the current task scope.

   ```
   [PRE-FLIGHT FAILED]
   Error type     : TypeScript / Lint
   Affected files : <list of files>
   Error details  : <raw error output>
   Recommendation : <suggested action — fix first or skip?>
   ```

4. **Report the execution plan**: Respond in plain language (non-tech friendly) covering: Objective, relevant Business Logic, and files that will be affected.

---

## 3. Technical Rules (Strict Rules)

## ENCODING RULE (MANDATORY)

- MUST store Vietnamese text as UTF-8 (human readable)
- MUST NOT use Unicode escape sequences

Example:
❌ "T\u00ednh gi\u00e1 v\u1ea3i"
✅ "Tính giá vải"

### 3.1 Task Decomposition

- Execute in extremely small mini-tasks, carefully and safely.
- Each mini-task must touch only one logical functional group at a time.

### 3.2 TypeScript & Mock Data

- **Absolute Ban on `any`**: You are STRICTLY FORBIDDEN from using the `any` keyword or `as any` casting under any circumstances.
- **Mandatory Explicit Types (Method 1)**: When a type is missing or unknown, you MUST define a precise `interface` or `type`. If the data shape is completely dynamic, use `unknown` and validate it (e.g., with Zod). NEVER fallback to `any`.
- **Mandatory Schema Check before Mocking**: Before creating or modifying mock data (fixtures) for tests or UI, you MUST read the exact `Type`/`Schema` definition first. Do not hallucinate properties that do not exist to prevent `TS2353` errors.

### 3.3 Formatting

- Follow the `array-bracket-newline` rule: the closing `]` must stay on the same line as the last element, or appear on a new line following this pattern:

  ```typescript
  // Correct
  const list = ['item1', 'item2'];

  // Wrong
  const list = ['item1', 'item2'];
  ```

  The project's `.eslintrc` file is the ultimate source of truth for formatting rules.

### 3.4 Imports & Boundaries (Strict Isolation)

- **Absolute Ban on Cross-Feature Imports**: You are STRICTLY FORBIDDEN from importing code from one feature into another feature (e.g., `src/features/A` CANNOT import from `src/features/B`). This violates modular architecture and causes ESLint `boundaries/dependencies` warnings.
- **How to share code**: If two features need the exact same component, type, or logic, you MUST extract that code into `src/shared/` (e.g., `src/shared/components` or `src/shared/utils`) and have both features import from `@/shared/...`.
- Relative imports (`../../`) are ONLY allowed within the very same Feature directory.

### 3.5 No Duplication

#### Rule 1 — JSX / UI blocks: extract at 5 lines, mandatory at 10

If a JSX block is repeated across 2 or more files and is **5 lines or longer**, it must be extracted into a dedicated component before proceeding. If it reaches **10 lines**, extraction is non-negotiable regardless of context.

Extraction checklist:

- Place the new component in `shared/components/` if it is domain-agnostic, or in the nearest common parent feature folder if it is domain-specific.
- The component must accept props for all variable parts (no hardcoded values inside).
- Delete the original inline block entirely. Zero tolerance for "original + new component" coexisting.

```tsx
// Wrong — same JSX block copied into ProgressBoard.tsx and ProgressDashboard.tsx
<div className="exp-bar">
  <div className="exp-bar__fill" style={{ width: `${pct}%` }} />
  ...
</div>

// Correct — extracted once, used everywhere
<ProgressExpBar percentage={pct} />
```

#### Rule 2 — Logic blocks: extract at 3 repeated lines, mandatory at 5

If a logic expression (e.g., a `reduce`, `map`, or `filter` chain) appears in more than one file and spans **3 lines or more**, it must be extracted into a named utility function. At **5 lines**, this is mandatory.

Extraction checklist:

- Place the function in `shared/utils/` or the relevant `*.module.ts` / `*.helper.ts` file.
- The function must be fully typed (no `any`).
- Name it clearly after what it computes, not how (e.g., `calcProgressPoints`, not `doReduce`).

```typescript
// Wrong — same reduce block duplicated in two components
const total = items.reduce((acc, item) => {
  if (item.status === 'done') return acc + item.points;
  return acc;
}, 0);

// Correct — extracted once
const total = calcProgressPoints(items);
```

#### Rule 3 — Strings & labels: never hardcode repeated display text

Any string that appears in more than one file — labels, status text, stage names — must be defined as a constant in a dedicated module (e.g., `*.constants.ts` or `*.module.ts`) and imported from there.

```typescript
// Wrong — same string scattered across files
<span>Hoàn thành</span>   // in ComponentA
<span>Hoàn thành</span>   // in ComponentB

// Correct — single source of truth
// order-progress.module.ts
export const STAGE_STATUS_LABELS = { done: "Hoàn thành", ... };

// ComponentA and ComponentB
<span>{STAGE_STATUS_LABELS.done}</span>
```

#### Pre-task duplication scan (mandatory)

Before writing any new UI block or logic, the Agent must:

1. Search the codebase for visually or functionally similar patterns (`grep`, file search, or AST scan).
2. If a match is found: reuse or refactor — never create a parallel implementation.
3. Report any extraction performed in the final report under "Refactors".

### 3.6 Separation of Concerns — No Business Logic in UI Components

A UI component's only responsibility is to **receive data and render it**. Any calculation, decision, or derivation that determines _what_ the data means belongs outside the component.

- **Absolute Ban on `.reduce()` in UI Components**: You are STRICTLY FORBIDDEN from using the `.reduce()` method inside any `.tsx` file (React component). All data aggregation, summation, and complex mapping MUST be performed inside a separate `*.utils.ts`, `*.helper.ts`, or `*.use-case.ts` file as a Pure Function.

#### What counts as Business Logic

Business Logic is any code that:

- Assigns numeric weight to a domain status (e.g., `done = 1 point`, `in_progress = 0.5 points`).
- Derives a computed value from raw domain data (e.g., calculating a progress percentage from stages).
- Enforces a domain rule (e.g., "a stage cannot exceed 100%", "points are capped at the maximum").
- Makes a conditional decision based on domain state (e.g., `if status === "overdue" then flag = true`).

If the code would need to change when the product team changes a business rule — it is Business Logic, and it does not belong in a component.

#### Mandatory extraction rule

If Business Logic is found inside a `.map()`, `.filter()`, `.reduce()`, or any inline expression inside JSX or a render function, it **must** be extracted before the task is considered complete.

Extraction checklist:

- Extract to a **Pure Function** — same input always produces same output, no side effects.
- Place it in the nearest `utils.ts` or `helpers.ts` file within the relevant feature folder (e.g., `src/features/orders/progress/utils.ts`).
- The function must be fully typed. Name it after the domain concept it computes (e.g., `calculateOrderProgress`, not `getPercent`).
- The component calls the function and uses the result. No inline math, no inline conditionals tied to domain rules.

```tsx
// Wrong — Business Logic hardcoded inside render
{
  order.stages.map((stage) => {
    const points =
      stage.status === 'done' ? 1 : stage.status === 'in_progress' ? 0.5 : 0;
    const pct = (points / total) * 100;
    return <ProgressExpBar percentage={pct} />;
  });
}

// Correct — UI only receives and renders
const pct = calculateOrderProgress(order.stages);
return <ProgressExpBar percentage={pct} />;
```

#### Pre-task scan for embedded logic

Before writing or modifying any component, the Agent must check:

1. Does the component contain any arithmetic, status-weight mapping, or conditional derivation tied to domain rules?
2. If yes: extract first, then proceed with the original task.
3. Report any extraction performed in the final report under "Refactors".

---

### 3.7 Rule Conflict Priority Order

When rules conflict (e.g., fixing Business Logic breaks the layout), the Agent must follow this priority order:

1. **System safety** — no crashes, no data loss.
2. **Correct Business Logic** — behavior must be accurate before aesthetics.
3. **Technical standards** — no `any`, no relative imports, etc.
4. **Responsive / UI** — polished interface.

If a conflict cannot be resolved within the current task scope, report to the requester before proceeding.

### 3.8 Performance & Async Operations

- **Concurrent Promises**: NEVER use `await` inside loops (`for`, `for...of`, `while`, `map`).
- ALWAYS use `Promise.all()` to execute asynchronous tasks concurrently. This prevents ESLint `no-await-in-loop` errors and optimizes performance.
- **Exceptions**: Only when Business Logic strictly requires sequential execution (e.g., sequential inserts to get IDs), the Agent is allowed to use `await` inside a loop, but MUST add `// eslint-disable-next-line no-await-in-loop` along with a comment explaining the reason.

---

## 4. Git Workflow

### 4.1 Before Starting

- Confirm you are on the correct branch. Never work directly on `main` or `develop`.
- Recommended branch naming: `feat/<feature-name>` or `fix/<issue-description>`.

### 4.2 Commit per Mini-Task

- Each completed mini-task must have its own separate commit.
- Commit message format:

  ```
  <type>(<scope>): <short description>

  Examples:
  feat(auth): add token refresh logic
  fix(dashboard): correct overflow on mobile
  refactor(shared): extract date util to helper
  ```

- Valid types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`.

### 4.3 Checkpoints Before Major Changes

- Before modifying multiple files at once, create a checkpoint commit with a clear message (e.g., `chore: checkpoint before layout refactor`).
- If a rollback is needed, the Agent must report the previous commit hash so the user can restore the state.

### 4.4 No Push Until Verified

- Never run `git push` if `npm run typecheck` or `npm run lint` still has errors.

---

## 5. Verification & Reporting

### 5.1 After Every Modification

- Always re-run `npm run typecheck` and `npm run lint -- --fix && npm run lint -- --max-warnings=0`.
- **Zero-Tolerance for Warnings**: The task is NEVER considered complete until both typecheck and lint return EXACTLY `0 problems (0 errors, 0 warnings)`. You must actively fix all warnings (like `no-console`, `no-await-in-loop`, `boundaries`) or use proper `eslint-disable` comments if strictly necessary. Do not report success if warnings exist.

### 5.2 CSS / Render Errors

- The Agent must self-review all styles to ensure no display errors or layout overflow.
- Test on at least 2 breakpoints: mobile (375px) and desktop (1280px).

### 5.3 Final Report

Provide a complete report using this structure:

```
[COMPLETION REPORT]

Modified files:
- src/features/auth/LoginForm.tsx   — added validation logic
- src/shared/utils/date.ts          — added formatDate helper

Verification results:
- npm run typecheck : PASS
- npm run lint      : PASS

Responsive check:
- Mobile (375px)    : Checked, no issues
- Desktop (1280px)  : Checked, no issues

Commits:
- abc1234 feat(auth): add token refresh logic
- def5678 fix(dashboard): correct overflow on mobile

Additional notes (if any):
- ...
```

---

## 6. Error Handling & Edge Cases

### 6.1 Errors Outside Current Scope

If an error is encountered that cannot be resolved within the current task (e.g., third-party library bug, environment configuration issue), the Agent must:

1. Stop immediately.
2. Clearly describe the error: file, line number, error content, and reproduction steps.
3. Propose 2–3 feasible resolution options.
4. Wait for confirmation before continuing.

### 6.2 Tasks Requiring 20+ File Changes

If analysis reveals that a task will affect more than 20 files, the Agent must report this upfront so the requester can reassess the scope — rather than proceeding automatically.

### 6.3 Rule vs. Business Logic Conflicts

If Business Logic requires a technical solution that violates a rule (e.g., forced to use `any` due to a library limitation), the Agent must:

1. Report upfront and clearly explain the reason.
2. Propose an alternative solution.
3. Only proceed with the exception after receiving written confirmation.
