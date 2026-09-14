# VinhPhatERP AI Quality Gate Checklist

Every task, refactor, or new feature in VinhPhatERP v3 MUST satisfy every item in this checklist before merging or committing.

---

## 1. Architecture & Layering

- [ ] **No Business Logic in UI**: Components do not contain math, reduce, complex filters, or inline validations.
- [ ] **Single Responsibility**: Components are modular (< 300 lines). Sub-views split into presentational components.
- [ ] **Layer Hierarchy Preserved**: UI -> Hook -> Service -> API -> RPC -> DB. No upward or cross-feature imports.
- [ ] **Zero Circular Dependencies**: All modules form a clean acyclic dependency graph.

## 2. TypeScript & Type Safety

- [ ] **Zero `any` / `as any`**: Strict types used throughout. No type bypasses or `@ts-ignore`.
- [ ] **Discriminated Unions**: Statuses and state variants use strict union types.
- [ ] **Zod Validation**: All external inputs, query parameters, and form states validated via Zod schemas.
- [ ] **Error Narrowing**: Catch blocks use `error instanceof Error ? error.message : String(error)`.

## 3. Database Safety & Concurrency (CRITICAL)

- [ ] **No Raw Unsafe Inserts**: No bare `supabase.from(...).insert(...)`.
- [ ] **Idempotent Writes**: Single-row updates use `safeUpsert` (`src/lib/db-guard.ts`).
- [ ] **Atomic Multi-Row Operations**: Stock deductions, unreserves, debt accruals, and status shifts use atomic Postgres RPCs with `FOR UPDATE` locking.
- [ ] **Deterministic IDs**: No `Date.now()` used for entity IDs (UUID or PostgreSQL sequences only).
- [ ] **RPC Sync**: All frontend RPC calls and parameters match database function signatures (`npm run rpc:check`).

## 4. React & Render Safety

- [ ] **Stable List Keys**: All `.map()` lists use unique entity IDs (`key={item.id}`). No array indices for dynamic lists.
- [ ] **Pure Effects**: No side effects, heavy calculations, or API fetching in `useEffect`.
- [ ] **Null / Undefined Guards**: Values that can be missing are guarded (`{value ?? '---'}`).
- [ ] **Optimistic State Consistency**: Mutations roll back gracefully on failure.

## 5. UI / UX & Semantic Design Tokens

- [ ] **Zero Hardcoded Colors**: No `#hex`, `rgb()`, `text-gray-*`, or `bg-red-*` in CSS or JSX.
- [ ] **Semantic Tokens Used**: Colors mapped to `text-foreground`, `text-muted`, `bg-surface`, `bg-danger-soft`, etc.
- [ ] **Loading Skeletons**: Displayed during fetch — no flash of empty or default data.
- [ ] **Error States**: Clear inline error display with retry options.
- [ ] **Empty States**: Friendly empty illustration/message when datasets are empty (`[]`).
- [ ] **Pending States**: Form submit and destructive buttons disabled with spinners during mutations.
- [ ] **Basic Accessibility (a11y)**: Images have `alt`, interactive elements keyboard accessible.

## 6. Security & RLS Compliance

- [ ] **Row Level Security (RLS)**: Policies preserved; no unauthorized bypasses.
- [ ] **No Secret Leakage**: No API keys, secret tokens, or sensitive credentials in client bundles.
- [ ] **Input Sanitization**: User input sanitized before rendering or transmitting.

## 7. ERP Safety (Business Rule Guard)

- [ ] **Pricing, debt, and stock formulas**: Unchanged unless explicitly requested and approved.
- [ ] **Order and trip statuses**: State transitions follow business lifecycle specs.
- [ ] **No speculative changes**: All changes are strictly bounded to approved scope.

---

## 8. AUTOMATED VERIFICATION GATES (Mandatory: 0 Errors)

- [ ] `npm run rpc:check` (Frontend RPC calls match DB functions)
- [ ] `npm run typecheck` (TypeScript compiles with 0 errors)
- [ ] `npm run lint -- --max-warnings=0` (ESLint passes with 0 warnings)
- [ ] `npm run lint:css` (Stylelint passes with 0 color violations)
- [ ] `npm run test` (Vitest unit tests pass 100%)
