---
trigger: always_on
---

# Icon System Rules

## Library
- MUST use: lucide-react
- NEVER use: heroicons, fontawesome, custom svg

## Size
- Default: 20px
- Small: 16px
- Large: 24px

## Stroke
- Default: 1.5
- MUST be consistent across app

## Color
- Inherit from text (currentColor)
- Active: primary color
- Inactive: muted color

## Usage
- Icons MUST go through <Icon /> wrapper
- NEVER import directly from lucide-react in feature code

## Naming
- Use semantic names:
  - orders → package
  - customers → users
  - fabric → layers