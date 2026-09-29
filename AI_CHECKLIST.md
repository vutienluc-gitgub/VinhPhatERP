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
- [ ] **No Emoji in UI**: Zero emoji in source code or UI elements (Use Lucide SVG icons).
- [ ] **High-Density Data Alignment**: Numbers/quantities right-aligned with `tabular-nums`; codes/statuses centered; text left-aligned.
- [ ] **Loading Skeletons**: Displayed during fetch — no flash of empty or default data.
- [ ] **Error States**: Clear inline error display with retry options.
- [ ] **Empty States**: Friendly empty illustration/message when datasets are empty (`[]`).
- [ ] **Pending States**: Form submit and destructive buttons disabled with spinners during mutations.
- [ ] **Basic Accessibility (a11y)**: Images have `alt`, interactive elements keyboard accessible (visible focus rings).

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

- [!] `npm run rpc:check` (Frontend RPC calls match DB functions) — **[NOT VERIFIED]**: no `DATABASE_URL` in sandbox. MUST run in a DB-enabled environment before merge.
- [x] `npm run typecheck` (TypeScript compiles with 0 errors)
- [x] `npm run lint -- --max-warnings=0` (ESLint passes with 0 warnings)
- [x] `npm run lint:css` (Stylelint passes with 0 color violations)
- [x] `npm run test` (Vitest unit tests pass 100%)

---

## 9. TASK VERIFICATION RECORD — fix/auth-p2

Scope: auth session-load guard (P2.3) + blocked-Turnstile feedback (P2.2).
Not in scope: `rememberMe` (P2.1) and passkey refresh-token (P1) — see report.

### Automated gates (real observed output)

- `npm run rpc:check`: **[NOT VERIFIED]** — `❌ DATABASE_URL not set in .env`
- `npm run typecheck`: PASS
- `npm run lint -- --max-warnings=0`: PASS
- `npm run lint:css`: PASS
- `npm run test`: PASS — 153 files, 962 tests
- `node scripts/check-file-size.mjs`: PASS — "No file grew past its baseline."
- `npm run build`: PASS — `✓ built in 2.67s` (pre-existing chunk-size warning only)

### Item status for this task

- **Business logic in UI**: N/A — no math/filter/validation added to components.
- **Single responsibility**: PASS — `LoginForm` 322 → 305 lines; new `LoginCaptchaField` 74 lines.
- **Layer hierarchy / circular deps**: PASS — imports via `@/` alias only.
- **Zero `any` / `@ts-ignore`**: PASS.
- **Error narrowing / Rule 7**: PASS — `getSession` rejection logged and handled.
- **Stable list keys**: N/A — no new lists.
- **Error states with retry**: PASS — captcha alert + "Thử lại" (`role="alert"`).
- **Pending state**: PASS (unchanged) — submit disabled while `isSubmitting`.
- **Zero hardcoded colors**: **[OBSERVATION]** — `text-[#818cf8]` was carried over from the existing `LoginForm` pattern and a documented `@architecture-exception: legacy color migration`. Not introduced by this task; not refactored (out of scope).
- **No emoji**: PASS.
- **a11y**: PASS — `role="alert"`, labelled retry button, existing focus styles.
- **RLS / secret leakage**: PASS — no DB or credential changes.
- **ERP safety (pricing/debt/stock/status)**: PASS — untouched; no `[BUSINESS BEHAVIOR CHANGE]` to those domains.
- **No speculative changes**: PASS — bounded to approved P2.2 + P2.3.

---

## 10. TASK VERIFICATION RECORD — fix/auth-p2-remember-passkey

Scope: **P2.1-A** `rememberMe` session persistence + **P1-B** passkey
refresh-token handling. Both approved in Phase 2.

Not in scope (explicitly deferred, NOT implemented): a server-side refresh-token
endpoint for passkey sessions. Client-side handling now degrades gracefully to
re-authentication; see "Passkey refresh token" below.

### Automated gates (real observed output)

- `npm run rpc:check`: **[NOT VERIFIED]** — `❌ DATABASE_URL not set in .env`
- `npm run typecheck`: PASS
- `npm run typecheck:server`: PASS
- `npm run lint`: PASS — full repo, 0 errors
- `npm run lint:css`: PASS
- `npm run test`: PASS — 162 files, 997 tests
- `node scripts/check-file-size.mjs`: PASS — "No file grew past its baseline."
- `npm run build`: PASS — `✓ built in 2.66s` (pre-existing chunk-size warning only)
- `npm run test:e2e` (playwright): **[NOT RUN]** — needs a browser + dev server; not available in this sandbox. Must run in CI.

### Item status for this task

- **Business logic in UI**: PASS — storage selection and session classification live in `remember-session.ts` / `session-kind.ts`, not in components.
- **Single responsibility**: PASS — `LoginForm.tsx` 312 lines (baseline 342); new files well under 300.
- **Layer hierarchy / circular deps**: PASS — `@/` alias only; helper imports point downward.
- **Zero `any` / `@ts-ignore`**: PASS.
- **Error narrowing**: N/A for this diff.
- **Stable list keys**: N/A — no new lists.
- **Pure effects**: PASS — `PasskeyExpiryNotice` effect only schedules/clears a timer; no fetching.
- **Zero hardcoded colors**: PASS — no styling added.
- **No emoji**: PASS.
- **a11y**: PASS — notice is a toast announcement; no new interactive elements.
- **RLS / secret leakage**: PASS — `auth.users` untouched; JWT signing unchanged.
- **ERP safety**: PASS — no pricing/debt/stock/status touch.
- **No speculative changes**: PASS — bounded to approved P2.1-A + P1-B.

### Behaviour changes to call out (non-business, auth-only)

- `[SESSION STORAGE CHANGE]` **P2.1-A**: sessions now route to `localStorage`
  (remember) or `sessionStorage` (forget) via a custom supabase-js storage
  adapter (`storageKey` unchanged: `vinhphat_session`). GoTrue's own `lock`/
  `broadcastChannel` are keyed on `storageKey`, not the adapter, so cross-tab
  sync still works.
- `[AUTH LIFECYCLE CHANGE]` **P1-B**: passkey sessions no longer reuse the access
  token as the refresh token. They store a truthy sentinel
  (`passkey:no-refresh-token`) so supabase-js treats the session as valid without
  a rotation request that GoTrue would reject. When the passkey token expires,
  `PasskeyExpiryNotice` shows a persistent message and signs out deliberately
  instead of the previous silent drop.

### Passkey refresh token — honest limitation

A true refresh token would need a server endpoint to re-mint a passkey JWT.
That is **acceptable Phase 2 scope** for this app because a passkey login is a
single touch (Face ID), so re-authentication is cheap. It is **NOT** acceptable
for unattended/kiosk or long-lived operations; those still need the server
endpoint (tracked as future P1-C).
