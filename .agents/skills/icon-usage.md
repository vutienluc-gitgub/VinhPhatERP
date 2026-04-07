# Icon Usage Skill
# You MUST read:

.agents/context/icon-system.md

## Goal
Ensure consistent icon usage across the application.

## Rules

1. ALWAYS use <Icon /> component
2. NEVER import from lucide-react directly
3. ALWAYS use predefined icon names

## Mapping

- dashboard → home
- orders → package
- products → layers
- customers → users
- reports → bar-chart
- settings → settings

## Validation

Before writing code:
- Check if icon exists in mapping
- If not, suggest adding to mapping

## Example

✅ CORRECT:
<Icon name="package" />

❌ WRONG:
import { Package } from "lucide-react";
<Package />