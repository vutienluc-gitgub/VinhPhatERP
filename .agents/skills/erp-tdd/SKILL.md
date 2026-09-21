---
name: erp-tdd
description: Enforces Test-Driven Development (TDD) using Vitest for VinhPhatERP domain logic, calculations, inventory math, debt, and state transitions. Use when creating or refactoring business calculations, hooks, or services before connecting to UI.
---

# ERP TDD (Test-Driven Development for VinhPhatERP)

## Overview

Adapted from Addy Osmani's `test-driven-development`, customized for **VinhPhatERP v3**.
The principle: **"Tests are proof."**
In an ERP system handling real-world money, inventory, and debt, code without tests is a liability. You must write tests to define and verify behavior **before** or alongside the implementation, not as an afterthought.

---

## When to Use

- Implementing new financial or inventory calculations (discounts, VAT, fabric conversions, cost of goods).
- Implementing status transitions (e.g. order workflow: `draft` $\rightarrow$ `pending` $\rightarrow$ `confirmed` $\rightarrow$ `in_production`).
- Creating domain services or business logic hooks (`useWeavingCalculation`, `useOrderTotal`, `useDebtSettlement`).
- Refactoring complex legacy logic to verify zero regression (matching Refactor Checklist Item 22).
- Reproducing and fixing a reported business calculation bug.

---

## The TDD Cycle: Red $\rightarrow$ Green $\rightarrow$ Refactor

```text
  1. RED                 2. GREEN               3. REFACTOR
 ┌───────────────┐      ┌───────────────┐      ┌───────────────┐
 │ Write failing │ ───▶ │ Write minimal │ ───▶ │ Clean up code │
 │ Vitest test   │      │ code to pass  │      │ Keep test 100%│
 └───────────────┘      └───────────────┘      └───────────────┘
```

### 1. RED: Write the failing test first

- Place unit tests alongside the code in `__tests__/` or as `<name>.test.ts`.
- Define expected behavior, inputs, and outputs.
- Test should fail for the right reason (function doesn't exist or returns wrong calculation).

### 2. GREEN: Make it pass with minimal code

- Implement the simplest logic that satisfies the test.
- Do not add speculative features or unnecessary abstractions.

### 3. REFACTOR: Clean up under test safety

- Remove duplicates, simplify conditions, rename variables to domain terminology (`fabricBatch`, `meterLength`).
- Ensure all tests still pass cleanly.

---

## Critical ERP Test Categories & Edge Cases

When testing ERP domain logic, you MUST cover these mandatory edge cases:

### 1. Financial & Currency Rounding (VND)

- **Zero amounts**: Handling `0 đ` without crashing or returning `NaN`.
- **Decimal rounding**: VND does not use fractional cents, but calculations (VAT 8%, 10%, discount rates) produce decimals. Ensure standard rounding (`Math.round`) is consistently tested.
- **Negative numbers**: Inputting negative prices, quantities, or discounts should throw a validation error or be handled gracefully.

### 2. Fabric & Weaving Math Conversions

- **Conversions**: $\text{kg} \leftrightarrow \text{meters} \leftrightarrow \text{rolls (cây vải)}$.
- **Loss / Shrinkage percentage**: Testing shrinkage rates ($\%$) where factor is bounded between $0\%$ and $100\%$.
- **Zero division guard**: When fabric density or roll weight is $0$, calculation must not produce `Infinity` or `NaN`.

### 3. Status Transition Machines

- **Legal transitions**: `draft` $\rightarrow$ `pending` $\rightarrow$ `confirmed`.
- **Illegal transitions**: Attempting to move `completed` back to `draft` directly must be rejected.
- **Role authorization flags**: Only approved roles can transition to `in_production` or `cancelled`.

### 4. Data Boundaries

- **Empty inputs**: Empty array of order items `[]` must yield total `= 0`, not error.
- **Null / Undefined parameters**: Safe default fallback.
- **Very large values**: Extremely large numbers (billions of VND) without integer overflow or floating point precision traps.

---

## Testing Standards in VinhPhatERP

1. **Framework**: Use **Vitest** for all unit and service tests.
2. **Pure Functions First**:
   - UI components MUST NOT contain business calculations (ESLint Architecture Guard: `no-business-logic-in-ui`).
   - Extract logic into pure functions: `calculateOrderSummary(items, discount, vatRate)`.
   - Test the pure function directly.
3. **No Mocking the Universe**:
   - Prefer testing pure functions that take inputs and return outputs with zero mocks.
   - For hooks using React Query, test using `@testing-library/react` with a clean `QueryClient`.
4. **Execution Command**:
   ```bash
   npm run test
   ```
   Must pass with 0 failures before marking Phase 2 or Phase 5 complete.
