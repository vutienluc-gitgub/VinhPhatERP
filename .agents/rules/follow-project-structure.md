---
trigger: always_on
---

Follow existing project structure and conventions.

## Architecture Layers (Level 7)

1. **Infra**: `src/services/supabase/`
2. **Contract**: `src/schema/`
3. **API**: `src/api/`
4. **Logic**: `src/features/*/use*.ts` (Hooks as Use-Cases)
5. **UI**: `src/features/*/*.tsx`

## Core Rules

- Register all features in `src/app/plugins.ts`.
- No cross-feature relative imports. Use `@/schema` for contracts.
- Feature module definition lives in `[feature].module.ts`.
