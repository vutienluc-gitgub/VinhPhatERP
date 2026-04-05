# EXECUTION ENGINE

## Role

Execute workflow based on task type selected by orchestrator.

---

## Input

* task_type
* entity (orders, shipments, drivers...)
* ERP flow context

---

## Steps

### 1. Load ERP Flow

* Read docs/erp-flow/{entity}.md
* Extract:

  * entities
  * rules
  * relationships

---

### 2. Select Workflow

| task_type | workflow    |
| --------- | ----------- |
| form      | form-flow   |
| list      | list-flow   |
| detail    | detail-flow |
| action    | action-flow |

---

### 3. Spawn Agents

* UI Agent
* Frontend Agent
* Backend Agent
* Reviewer Agent

---

### 4. Enforce Rules

* Must follow ERP rules
* Must follow coding rules
* Must follow design system

---

### 5. Validate Output

Check:

* Type safety
* UI consistency
* Business correctness

---

## Output

* workflow_used
* components_created
* api_created
* validation_result
