# Operational Guide System (OGS) – ERP Blueprint

## 1. System Definition

OGS = Knowledge Base + Workflow Mapping + Context Engine + Action Layer + Search

---

## 2. Folder Structure

src/features/guide-system/

- engine/
- content/
- components/
- hooks/
- integrations/
- types/

---

## 3. Core Types

### GuideContext

- role
- module
- entityId
- state

### GuideAction

- type: navigate | mutation | external
- payload: path | api

### GuideStep

- id
- title
- content
- actions
- nextSteps

### PlaybookSection

- id
- title
- roles
- modules
- steps
- relatedWorkflows

---

## 4. Context Engine

Build context from:

- current user role
- current route
- entity state

---

## 5. Guide Resolver

Match:

- role
- module
- (future: state, error)

---

## 6. Workflow Integration

Define states + transitions per module.
Guide references workflows → render graph dynamically.

---

## 7. Action Layer

GuideStep includes CTA buttons:

- navigate → route
- mutation → API call

---

## 8. UI Requirements

- Sidebar + Content layout
- Workflow visualization
- Inline help [?]
- Command palette (Cmd + K)

---

## 9. Search Engine

Basic:

- keyword match title + content

Upgrade:

- fuzzy search
- ranking

---

## 10. Analytics

Track:

- guide_view
- action_click
- search_query

---

## 11. Integration

Hook: useContextualGuide()

Used in:

- Orders
- Inventory
- Dashboard

---

## 12. Principles

- Context-aware
- Actionable
- Always integrated
- Easy to update (no hardcode)

---

## 13. Roadmap

Phase 1:

- structure + resolver + markdown render

Phase 2:

- workflow graph + actions

Phase 3:

- search + command palette

Phase 4:

- analytics + optimization
