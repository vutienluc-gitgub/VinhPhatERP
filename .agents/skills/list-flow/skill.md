# List Flow Skill

Handle list/table rendering and management.

## When to use

- User asks to create a list/table page
- Input includes data fetch, filter, sort, pagination

## Steps

1. Fetch data from API
2. Render table/list (React, TypeScript, Tailwind)
3. Add filter, sort, pagination logic
4. Integrate loading, empty, error state
5. Support bulk actions if needed

## Output

- React table/list component
- API fetch logic

## Constraints

- Use React + TypeScript
- Use Tailwind CSS
- Follow design system

## Anti-pattern

- Do not fetch all data at once (use pagination)
- Avoid inline styles

## Example

```tsx
// ...React table component with filter, pagination...
```
