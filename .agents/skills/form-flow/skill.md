# Form Flow Skill

Handle form creation and validation.

## When to use

- User asks to create a form
- Input includes fields, validation

## Steps

1. Identify fields
2. Generate validation schema (Zod)
3. Create UI form (React, TypeScript, Tailwind)
4. Add validation logic
5. Integrate UI feedback (loading, error, success)
6. Support auto-fill, auto-save if needed

## Output

- React component (form)
- Validation schema (Zod)

## Constraints

- Use React + TypeScript
- Use Tailwind CSS
- Follow design system

## Anti-pattern

- Do not duplicate API calls
- Avoid inline styles

## Example

```tsx
import { z } from 'zod';
const schema = z.object({ email: z.string().email() });
// ...React form component...
```
