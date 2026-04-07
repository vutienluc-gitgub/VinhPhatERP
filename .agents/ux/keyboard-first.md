# Keyboard-first UX System

## Goal
Maximize data entry speed for ERP users

## Principles
- Zero mouse required
- Predictable focus flow
- No interruption during typing

---

## Global Rules

1. All forms MUST support keyboard navigation
2. Focus MUST follow business flow
3. No input should lose focus after re-render
4. Enter MUST trigger primary action
5. Tab MUST move to next logical field

---

## Navigation Behavior

### Basic
- Tab → next field
- Shift + Tab → previous field
- Enter → confirm / next / add row
- Escape → cancel / blur
- Arrow keys → move inside table

---

## Focus Management

- Auto focus first input on mount
- After selecting customer → focus product input
- After entering quantity → focus price
- After last field → focus submit button

---

## Table Behavior (Order Items)

- Enter on last row → create new row
- Tab cycles columns
- Arrow Up/Down → switch row
- Backspace on empty row → delete row

---

## Anti-patterns (FORBIDDEN)

- Mouse-only actions
- Modal interrupting typing flow
- Losing cursor position
- Resetting form on small updates
- Blocking typing with heavy validation

---

## Expected Output

Agent MUST generate:
- Keyboard handlers
- Focus control logic
- Table navigation system