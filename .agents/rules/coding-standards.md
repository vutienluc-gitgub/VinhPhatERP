---
trigger: always_on
---

# 🧠 Agent Workflow & Premium Coding Standards (STRICT - ERP)

---

## 🚨 GLOBAL ENFORCEMENT

- Code is NOT complete without refactor
- ANY rule violation → ❌ INVALID RESPONSE
- MUST regenerate until ALL rules pass
- AI MUST NOT ignore any rule

---

## 🔒 Database Safety (CRITICAL - NON-NEGOTIABLE)

Use db helpers from:
src/lib/db-guard.ts

### ❌ FORBIDDEN

- DO NOT use supabase.insert
- DO NOT use raw insert in any form
- DO NOT use safeInsert (unsafe in concurrent systems)
- DO NOT generate ID using Date.now()

### ✅ REQUIRED

- ONLY use safeUpsert
- ALL operations MUST be idempotent
- MUST prevent duplicate BEFORE hitting database constraint

---

## 🧠 Refactor Enforcement (MANDATORY)

Must follow:
agents/rules/refactor-checklist.md

### REQUIRED:

- MUST run full checklist after writing code
- MUST fix ALL violations before finishing

---

## 🧾 Refactor Report (MANDATORY)

You MUST output:

## ✅ Refactor Report

For EACH checklist item:

- Found: YES / NO
- Evidence: file + line
- Action: what was fixed

### ❗ IMPORTANT

- If Found = NO → MUST prove it
- Missing Evidence → INVALID

---

## ⚙️ Verification Loop (MANDATORY)

After ANY code change:

1. npm run typecheck
2. npm run lint -- --fix
3. npm run lint -- --max-warnings=0

### RULE:

- MUST be: 0 errors, 0 warnings
- Otherwise → MUST fix immediately
- MUST NOT end turn if failing

---

## 🧠 Code Quality Rules

- NO `as any`
- NO duplicate code
- NO emoji
- NO cross-feature relative import

---

## 🎨 UI / UX (Premium Standard)

- Must be responsive
- Must not break layout
- Must use design tokens from src/index.css

---

## 🛡️ Render Safety

- MUST check null/undefined before render
- MUST use unique key in list
- MUST handle:
  - empty state
  - long data overflow

---

## 🔁 Auto Recovery

If UI breaks:

- MUST rollback or fix immediately
- MUST not leave broken UI

---

## 💣 FINAL RULE

- "Works" ≠ "Correct"
- "No error" ≠ "Production-ready"

ONLY clean, safe, validated code is acceptable
