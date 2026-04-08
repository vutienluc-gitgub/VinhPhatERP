---
trigger: ui_design, frontend, component_creation, styling
---

# UX Core Principles

Whenever implementing UI components, layouts, or interacting with the user format, you MUST adhere to the following core UX philosophies:

## 1. "Don't make me think" (Krug's First Law of Usability)

- **Zero Cognitive Load:** The interface should be self-evident and self-explanatory. Users should never have to guess what a button does or what state the system is in.
- **Obvious Navigation:** If a user is on a step, make it blatantly obvious.
- **Enforcement:** Always enforce the one-screen-one-action rule, provide immediate feedback for async states, and use search-based comboboxes instead of endless scrolling lists.

## 2. Visual Hierarchy (Phân cấp thị giác)

- **Focal Points:** Use colors, borders, and contrast to draw attention only to what matters right now.
- **Example - Active States:** An active step (or active item) should use a combination of:
  - **Colored border (e.g., primary/green)**: To define a clear boundary.
  - **Light background (e.g., pastel/light green)**: To float the element and provide contrast without overwhelming text readability.
  - **Prominent icon**: To allow for quick visual scanning and context recognition before reading text.
- **Sizing:** Tap areas on mobile must be distinct and follow the `touch-friendly.md` (min 44px) rule.

## 3. Context Retention

- **Stay in Context:** Do not jolt the user out of their current flow.
- **Mobile First Forms:** Use Bottom Sheets for forms on mobile (per `bottom-sheet-only.md`) to retain spatial context of the underlying screen. Center modals break this flow.

When building or reviewing UI, verify that these principles are actively applied.
