# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

VinhPhat ERP: internal B2B ERP for a textile/fabric manufacturer (yarn intake → weaving → dyeing → finished-fabric stock by lot/roll → orders → shipping → payments/debt). Mobile-first React SPA on Supabase, plus a small Hono API server. Docs, comments, and all UI strings are in Vietnamese.

## Governance docs (read before non-trivial changes)

The repo has its own mandatory AI process. It is not optional background reading:

- [.erp-rules.md](.erp-rules.md): the 22 engineering rules and the **ERP Safety Rule**. Any change that touches pricing/tax, stock quantities or unit conversions (kg/m/rolls), AR/AP debt, payments/invoicing, order status flow, reservation/allocation concurrency, accounting, or permissions/RLS must be flagged `[BUSINESS BEHAVIOR CHANGE]`. Stop and wait for explicit approval before editing.
- [AI_WORKFLOW.md](AI_WORKFLOW.md): the phased workflow with approval gates. A gate opens only on the exact literal token (`APPROVE PHASE 2`, `APPROVE PHASE 3`, `APPROVE PHASE 4 & 5`, `APPROVE MERGE`). "ok" or "looks good" does not open a gate. Use one commit per approved phase on a `fix/<scope>` or `chore/<scope>` branch, never on `main`.
- **Evidence rule:** never report a check as passing unless it ran in this session. Report unrun checks as `[NOT RUN]` and checks that can't run (e.g. no DB) as `[NOT VERIFIED]`.
- [AI_CHECKLIST.md](AI_CHECKLIST.md): the pre-close checklist. [AGENT.md](AGENT.md) lists which actions are safe and which need confirmation. [docs/do-not-touch.md](docs/do-not-touch.md) lists files reserved for maintainers (app shell CSS, `App.tsx`, `main.tsx`, design tokens, core shared components).
- `.agents/rules/` has detailed UI/architecture/WCAG rules. `agent/ai-tool.md` has overrides for the `agent/` package.

## Commands

```bash
npm run dev              # Vite frontend (proxies /api → http://localhost:3001)
npm run dev:server       # Hono server (server/, tsx watch, reads server/.env)
npm run dev:all          # both

# Required quality gates before calling a task done (0 errors, 0 warnings)
npm run rpc:check                 # frontend rpc() calls vs live DB function signatures — needs DATABASE_URL
npm run typecheck
npm run lint -- --max-warnings=0
npm run lint:css                  # Stylelint: semantic tokens only
npm run test                      # Vitest (src/**/*.test.ts(x) and server/src/**/*.test.ts)

npm run typecheck:server          # when touching server/
npm run size:check                # file-size ratchet (see below)
npm run theme:check               # theme contract
npm run audit:full                # rpc + vapid + lint + typecheck(both) + theme

# Single test
npx vitest run src/domain/inventory/roll-selection.engine.test.ts
npx vitest run -t "test name substring"
npx playwright test e2e/auth.spec.ts   # E2E starts its own dev server on :5174 (--mode test)

# DB (Supabase CLI)
npm run db:new <name>    # new migration in supabase/migrations/
npm run db:status
npm run db:push          # applies to the REAL database — propose it, never run it yourself
```

`agent/` and `server/` are separate npm packages with their own `package.json` and lockfiles. Run `npm run server:install` after changing server deps.

## Enforcement you will hit

- **Pre-push hook** (`.husky/pre-push`) blocks pushes to `main`, checks both lockfiles, and runs `rpc:check`, `size:check`, `vapid:check`, `theme:check`, and both typechecks. `SKIP_RPC_CHECK=1` only bypasses the push; it does not mean the check passed. Full lint, Vitest, build, E2E, and AI audit run in CI (`.github/workflows/ci.yml`).
- **File-size ratchet (Rule 11, 300-line limit):** `scripts/file-size-baseline.json` lists legacy files over 300 lines. A listed file may not grow, and a new file may not exceed 300 lines. Split files instead of growing them. Run `npm run size:baseline` only after a real shrink.
- **ESLint architecture guards:**
  - No cross-feature imports: `src/features/A` cannot import `src/features/B`. `*Page.tsx`, `*Detail.tsx`, and `*Layout.tsx` are exempt.
  - No relative `../` imports; use the `@/` alias (→ `src/`).
  - No direct `lucide-react`; use `<Icon />`. No emoji literals in source.
  - No native `<select>`; use `VPSelect`. No legacy `@/shared/components/Combobox`; use `VPCombobox` or `VPVirtualCombobox`.
  - No hardcoded Tailwind palette colors like `text-gray-900`, `bg-white`, `text-red-500`. Use semantic tokens from `src/styles/theme/tokens.css`, e.g. `text-muted`, `bg-surface`, `text-danger`.
  - In `.tsx`: no `.reduce()`, `formatCurrency()`, `toLocaleString()`, or `Intl.NumberFormat`. Move math into domain/utils and show money with `<MoneyText />` or `<MoneyCell />`.
  - No `any`.
  - Server routes (`server/src/routes`) must not import `server/src/db` directly; go through `server/src/services`.
- **Infrastructure files stay out of feature commits.** Keep changes to `.github/`, `.husky/`, `.agents/rules/`, and `e2e/` out of feature commits. Automated commits have silently reverted CI gates before. Check with `git diff --name-only origin/main...HEAD | grep -E '^\.github/|^\.husky/|^\.agents/rules/|^e2e/'`.

## Frontend architecture

The folder list in README/`docs/ARCHITECTURE.md` is older than the code. A vertical slice actually looks like this:

```
src/features/<module>/      UI components, feature-local hooks, *.module.ts (FeatureDefinition: route, menu, roles)
  ↓ imports hooks from
src/application/<domain>/   React Query hooks (useQuery/useMutation) orchestrating api + domain
  ↓
src/domain/<domain>/        pure business logic, types, calculations (unit-tested; no React, no Supabase)
src/schema/*.schema.ts      Zod schemas + form value types
  ↓
src/api/*.api.ts            Supabase queries / supabase.rpc(...) calls, one file per resource
  ↓
src/services/supabase/      typed client (database.types.ts) and untypedDb for tables/RPCs not yet in generated types
  ↓
supabase/migrations/        Postgres tables, RLS, RPC functions
```

- Features are registered through `*.module.ts` with `createModule` (`src/core/registry/moduleRegistry.ts`). Routing lives in `src/app/router/`, split into ERP shell, public, customer portal, supplier portal, and driver routes.
- `src/shared/` holds cross-feature components (VP\* inputs, `Icon`, money display), hooks, utils, and print services. Look there before creating anything new.
- **Writes:** single-row inserts/upserts go through `safeUpsert` in `src/lib/db-guard.ts`. Never call raw `.insert()`, and never build business IDs from `Date.now()`. Anything multi-table or concurrent must be an atomic Postgres RPC using `FOR UPDATE`: stock deduction, debt, status transitions, reservations.
- **Adding or changing an RPC** means a new migration (never edit a pushed migration), updating `src/services/supabase/database.types.ts`, and keeping `rpc:check` green. `npm run rpc:fix` can generate a migration stub. A near-duplicate `src/schema/database.types.ts` also exists, but the Supabase client imports the `services/supabase` one.
- Print documents (packing lists, invoices, etc.) use a registry in `src/domain/print` (templates, field registry). Rendering and export live in `src/shared/services/print/`.
- Heavy libraries (exceljs, jspdf, html2canvas, AI SDKs) are split into their own chunks in `vite.config.ts`. Lazy-import them.

## Backend

- `server/`: a Hono app (`server/src/index.ts`) with Drizzle schema in `server/src/db/schema`. It covers AI chat, OCR/vision for payment slips, webhooks with a retry worker, and web push (VAPID keys must match the frontend; `npm run vapid:check`). Most CRUD goes straight from the frontend to Supabase under RLS; the server handles work that needs secrets or the service role.
- `agent/`: a standalone AI agent and MCP server package with its own typecheck job in CI.
- Env vars are listed in `.env.example`. `DATABASE_URL` is required for `rpc:check`.
