---
trigger: always_on
---

Separate business logic from UI.
Use hooks for data and logic.
Keep components focused on rendering.

## Use-Case Role (Level 7)

- Hooks (`useOrders.ts`, `useInventory.ts`, etc.) ARE the Use-Cases.
- They MUST handle:
  - Loading / Error / Success states.
  - Data mapping (Raw -> Domain).
  - Cache Invalidation (via React Query).
- UI components should only consume these Use-Cases.
