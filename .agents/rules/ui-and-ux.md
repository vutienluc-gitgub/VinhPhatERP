---
trigger: ui_design, frontend, component_creation, styling
---

# UI & UX Standards (Premium ERP)

## 1. "Don't make me think" (UX Core)

- **Zero Cognitive Load:** Interface must be self-evident.
- **Visual Hierarchy:** Use colors, borders (e.g., primary/green), and light backgrounds for active states.
- **One Screen, One Action:** Each screen must have one primary action. Avoid overcrowding.

## 2. Mobile-First & Responsive

- **Mobile-First:** Layout must work on small screens first (sm 640px, md 768px, lg 1024px).
- **No Horizontal Overflow:** All layouts must fit within screen width. Use `overflow-x-auto` ONLY for tables, when absolutely necessary.
- **Responsive Tables:** Use card layout on mobile, table on desktop.
- **Touch-Friendly:** All interactive elements must have a minimum tap size of **44px**. Spacing must prevent mis-clicks.
- **No Hover Dependency:** All features must work on touch devices (no hover-only interactions).

## 3. Components & Interaction

- **Forms:** DO NOT use center modals for forms. ALL forms must use a Bottom Sheet on mobile.
- **Selects:** DO NOT use native select. Use searchable combobox (`lucide-react` icons). Support search by name, code, or phone.
- **State Feedback:** All async actions MUST show loading, success, and error states. Form buttons must be disabled while pending.
- **Consistent Spacing:** Use consistent design tokens from `src/index.css`. Avoid cramped UI.
- **Icons:** MUST use `lucide-react`. Default: 20px, Stroke: 1.5. Inherit currentColor. Wrap in `<Icon />`.

## 4. Banned Practices

- Do not use `gray-*`, `rounded-md`, or `bg-white` (use semantic design tokens).
- Do not leave broken UI. If UI breaks after a change, rollback or fix immediately.
