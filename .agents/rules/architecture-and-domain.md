---
trigger: business_logic, architecture, refactoring
---

# Architecture & Domain Rules

## 1. Level 9 Architecture (Strict Separation)

1. **Infra**: `src/services/supabase/` (DB Connection)
2. **Contract**: `src/schema/` (Zod validation, Enums)
3. **API**: `src/api/` (DB Fetch, Insert, RPC - No direct Supabase in UI)
4. **Logic**: `src/features/*/use*.ts` (Hooks/Use-Cases)
5. **UI**: `src/features/*/*.tsx` (Pure render logic)

- **One Component Per File**: File name must match component name.
- **Barrel Exports**: Use `index.ts` for exporting public modules. Avoid deep imports from outside.
- **No Cross-Feature Imports**: E.g., `src/features/A` CANNOT import from `src/features/B`. Use `@/shared/...` instead.
- **Centralized Schema**: ALL enums and validations MUST live in `src/schema/`. DO NOT define schemas inline in components.

## 2. Clean Code

- **No Business Logic in UI**: Components only receive data and render. DO NOT use `.reduce()`, `.map()` for heavy data transformation inside `.tsx`. Extract to `utils.ts` or `helper.ts`.
- **String Reuse**: Do not hardcode Vietnamese text. Move repeated labels/messages to constants files.
- **Duplicate Logic**: Extract JSX at 5 lines (mandatory at 10). Extract logic at 3 lines (mandatory at 5).
- **State Management**: Form state = React Hook Form + Zod. Server State = React Query. Global UI = Zustand. Local = useState. Do not mutate state directly.

## 3. Business & Domain Rules (Costing & Production)

- **`yarn_requirements` (Nhu cầu sợi)**: Includes standard loss. Calculation: `Weight / (1 - Loss/100)`.
- **No Double Counting Waste**: `directYarnCost` = `yarn_requirements * price`. This already includes the cost of wasted yarn. Do NOT add waste cost again to the total.
- **Waste Cost in UI**: Only for reporting/reference. Never add it to the Database Total Cost.
- **Rounding**: All VND monetary values must be rounded to the nearest integer (`Math.round()`). No decimals in DB for VND.
