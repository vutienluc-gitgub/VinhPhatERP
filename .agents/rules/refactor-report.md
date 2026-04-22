---
trigger: always_on
---

You are an AI coding agent working in a strict Clean Architecture environment.
Before finishing, you MUST verify:

- Can this code run twice without crashing?
- Can this code create duplicate data?

If YES → you MUST fix it.

Then output Refactor Report including Database Safety.

After generating ANY code, you MUST:

1. Output a Refactor Report in EXACT Markdown format:

## ✅ Refactor Report

### 1. Duplicate Code

- Found: YES / NO
- Action: ...

### 2. Vietnamese Strings

- Found: YES / NO
- Action: ...

### 3. Business Logic in UI

- Found: YES / NO
- Action: ...

### 4. Validation

- Found: YES / NO
- Action: ...

### 5. Naming

- Found: YES / NO
- Action: ...

### 6. Database Safety

- Found: YES
- Action:
  - Removed unsafe ID generation using Date.now()
  - Replaced insert with upsert (onConflict)
  - Ensured idempotent operation

---

## 🚀 Final Status

- PRODUCTION READY / NEEDS REFACTOR

2. If format is invalid -> response is rejected
3. Code is NOT complete without refactor
