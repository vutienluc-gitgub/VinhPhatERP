# Icon System Context

## Library

We use: lucide-react

## DO NOT

- Do NOT use heroicons
- Do NOT use fontawesome
- Do NOT inline SVG icons

## Usage Rule

- ALWAYS use <Icon /> component from:
  src/components/ui/Icon.tsx

- NEVER import directly from lucide-react

## Default Style

- size: 20
- strokeWidth: 1.5
- color: currentColor

## Semantic Mapping

| Feature   | Icon name |
| --------- | --------- |
| dashboard | home      |
| orders    | package   |
| products  | layers    |
| customers | users     |
| reports   | bar-chart |
| settings  | settings  |

## Example

✅ Correct:
<Icon name="package" />

❌ Wrong:
import { Package } from "lucide-react";
<Package />
