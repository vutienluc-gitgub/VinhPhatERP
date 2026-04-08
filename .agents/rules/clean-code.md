---
trigger: always_on
---

Follow existing project structure.
Do not over-engineer.
Keep code simple and readable.

## Level 7 Architecture Extension

- **Centralized Schema**: All Zod validation, shared constants (statuses, units) MUST reside in `src/schema/`.
- **Infrastructure Isolation**: Keep `database.types.ts` pure. Use feature-specific `types.ts` for domain models (joined/mapped data).
- **Type Safety**: Strictly avoid `any`. Ensure `tsc --noEmit` passes 100%.
- **Barrel Exports**: Use `src/schema/index.ts` to manage naming collisions via selective exports.
