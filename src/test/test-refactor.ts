import { validateRefactorReport } from '@/lib/validate-refactor-report';

// eslint-disable-next-line no-restricted-syntax -- Allowed string emoji
const aiOutput = `
// eslint-disable-next-line no-restricted-syntax -- Allowed string emoji
## ✅ Refactor Report

### 1. Duplicate Code
- Found: YES
- Action: Extracted function

### 2. Vietnamese Strings
- Found: NO
- Action: N/A

### 3. Business Logic in UI
- Found: YES
- Action: Moved to service

### 4. Validation
- Found: YES
- Action: Using Zod

### 5. Naming
- Found: NO
- Action: N/A

### 6. Database Safety
- Found: YES
- Action:
  - Used upsert
  - Added existence check
  - Used UUID

---

// eslint-disable-next-line no-restricted-syntax -- Allowed string emoji
## 🚀 Final Status
- PRODUCTION READY
`;

const result = validateRefactorReport(aiOutput);

// eslint-disable-next-line no-restricted-syntax -- Allowed string emoji
console.info('✅ VALID:\n', JSON.stringify(result, null, 2));
