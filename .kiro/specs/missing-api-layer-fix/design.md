# Design Document — Missing API Layer Fix

## Overview

Tạo `src/api/contracts.api.ts` và `src/api/contract-templates.api.ts` bằng cách di chuyển toàn bộ Supabase queries từ Feature Layer sang API Layer. Sau đó refactor `contracts.service.ts` và `contract-templates.module.ts` để chỉ chứa business logic, import từ API layer mới.

Không thay đổi public function signatures — tất cả callers hiện tại không cần sửa.

## Bug Condition

```pascal
FUNCTION isBugCondition(callSite)
  INPUT: callSite — một lời gọi Supabase trong codebase
  OUTPUT: boolean

  RETURN callSite.uses_supabase = true
     AND callSite.file IN [
           'src/features/contracts/contracts.service.ts',
           'src/features/contract-templates/contract-templates.module.ts'
         ]
END FUNCTION
```

**Fix Checking Property:**

```pascal
FOR ALL callSite WHERE isBugCondition(callSite) DO
  result ← fixedFunction(callSite)
  ASSERT callSite.file does NOT import from '@/services/supabase/client'
  ASSERT callSite.file does NOT contain 'supabase.from(...)'
  ASSERT callSite.file does NOT contain 'supabase.auth.*' or 'supabase.functions.*'
  ASSERT corresponding api file EXISTS in 'src/api/'
END FOR
```

**Preservation Property:**

```pascal
FOR ALL caller, args WHERE NOT isBugCondition(caller) DO
  ASSERT F(caller, args) = F'(caller, args)  -- return values unchanged
END FOR
```

## Technical Context

### Layer 9 Architecture

| Layer    | Path                                     | Responsibility                             |
| -------- | ---------------------------------------- | ------------------------------------------ |
| Infra    | `src/services/supabase/`                 | DB Connection                              |
| Contract | `src/schema/`                            | Zod validation, Enums                      |
| **API**  | **`src/api/`**                           | **DB Fetch, Insert, RPC — Supabase calls** |
| Logic    | `src/features/*/use*.ts`, `*.service.ts` | Business logic, state machines             |
| UI       | `src/features/*/*.tsx`                   | Pure render                                |

### db-guard Wrappers

| Wrapper                                       | Dùng khi                   | Return                    |
| --------------------------------------------- | -------------------------- | ------------------------- |
| `safeUpsertOne({ table, data, conflictKey })` | Upsert 1 row               | `unknown` (single object) |
| `safeUpsert({ table, data, conflictKey })`    | Upsert nhiều rows          | `unknown[]`               |
| `safeInsert({ table, data, uniqueCheck })`    | Insert với duplicate check | `unknown`                 |

### Infrastructure Calls trong contracts.service.ts

`exportContractPdf` và `generateContract` dùng `supabase.auth.getSession()` và `supabase.functions.invoke()`. Theo pattern của `orders.api.ts` (có `getAccessToken()` và `invokeCreateOrderFunction()`), các calls này sẽ được di chuyển vào `contracts.api.ts`.

## Implementation Plan

### Step 1 — Tạo `src/api/contracts.api.ts`

File mới chứa toàn bộ Supabase data access cho contracts domain. Tổ chức theo nhóm chức năng:

**Nhóm 1: Read operations**

```typescript
import { supabase } from '@/services/supabase/client';
import { safeUpsertOne, safeInsert } from '@/lib/db-guard';
import type {
  Contract,
  ContractAuditLog,
  ContractOrderLink,
  ContractStatus,
  ContractsFilter,
  UpdateContractInput,
} from '@/features/contracts/contracts.module';
import type { GenerateContractResponse } from '@/features/contracts/contracts.service';

// ── DB helpers ────────────────────────────────────────────────────────────────

const db = {
  contracts: () => supabase.from('contracts'),
  contractOrderLinks: () => supabase.from('contract_order_links'),
  contractAuditLogs: () => supabase.from('contract_audit_logs'),
};

// ── Read ──────────────────────────────────────────────────────────────────────

export async function fetchContracts(filters: ContractsFilter = {}): Promise<Contract[]>
export async function fetchContractById(id: string): Promise<Contract>
export async function fetchContractsByOrderId(orderId: string): Promise<Contract[]>
export async function fetchOrdersByContractId(contractId: string): Promise<{...}[]>
export async function fetchAuditLogs(contractId: string): Promise<ContractAuditLog[]>
export async function fetchAvailableOrdersForContract(excludeIds: string[]): Promise<{...}[]>
export async function fetchOrderOptions(): Promise<{...}[]>
export async function fetchCustomerOptions(): Promise<{...}[]>
export async function fetchSupplierOptions(): Promise<{...}[]>
```

**Nhóm 2: Write operations**

```typescript
export async function patchContract(id: string, data: UpdateContractInput): Promise<Contract>
export async function patchContractStatus(id: string, patch: Record<string, unknown>): Promise<Contract>
export async function insertContractOrderLink(data: {...}): Promise<ContractOrderLink>
export async function deleteContractOrderLink(contractId: string, orderId: string): Promise<void>
export async function insertAuditLog(data: {...}): Promise<void>
```

**Nhóm 3: Infrastructure calls (Edge Functions)**

```typescript
export async function invokeExportContractPdf(
  contractId: string,
): Promise<void>;
export async function invokeGenerateContract(
  payload: Record<string, unknown>,
): Promise<GenerateContractResponse>;
```

**Lưu ý về naming convention:**

- Hàm trong API layer dùng prefix `fetch*`, `patch*`, `insert*`, `delete*`, `invoke*`
- Hàm trong service layer giữ nguyên tên hiện tại (`getContracts`, `updateContract`, v.v.) — callers không bị ảnh hưởng

### Step 2 — Refactor `src/features/contracts/contracts.service.ts`

Sau khi tạo API layer:

1. **Xóa** import `supabase` từ `@/services/supabase/client`
2. **Xóa** `const db = { contracts: ..., contractOrderLinks: ..., contractAuditLogs: ... }`
3. **Thêm** import các hàm từ `@/api/contracts.api`
4. **Giữ nguyên** `validateStatusTransition()` — pure business logic
5. **Giữ nguyên** `VALID_TRANSITIONS` constant
6. **Refactor** từng hàm để delegate data access sang API layer:

```typescript
// Trước:
export async function getContracts(filters = {}): Promise<Contract[]> {
  let query = db
    .contracts()
    .select('*')
    .order('created_at', { ascending: false });
  // ... filter logic ...
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Contract[];
}

// Sau:
export async function getContracts(
  filters: ContractsFilter = {},
): Promise<Contract[]> {
  return fetchContracts(filters);
}
```

```typescript
// Trước:
export async function writeAuditLog(contractId, action, oldValues, newValues, performedBy): Promise<void> {
  const { error } = await supabase.from('contract_audit_logs').insert({ ... });
  if (error) throw error;
}

// Sau:
export async function writeAuditLog(contractId, action, oldValues, newValues, performedBy): Promise<void> {
  await insertAuditLog({ id: crypto.randomUUID(), contract_id: contractId, action, ... });
}
```

```typescript
// updateContract — giữ business logic (signed check), delegate DB calls:
export async function updateContract(
  id,
  data,
  performedBy = null,
): Promise<Contract> {
  const current = await fetchContractById(id); // API call
  if (current.status === 'signed') throw new Error('...');
  const updated = await patchContract(id, data); // API call
  await writeAuditLog(id, 'updated', current, data, performedBy);
  return updated;
}
```

```typescript
// updateContractStatus — giữ state machine logic, delegate DB calls:
export async function updateContractStatus(id, status, meta = {}): Promise<Contract> {
  const current = await fetchContractById(id);  // API call
  if (!validateStatusTransition(current.status, status)) throw new Error('...');
  // ... build patch ...
  const updated = await patchContractStatus(id, patch);  // API call
  await writeAuditLog(id, 'status_changed', ...);
  return updated;
}
```

### Step 3 — Tạo `src/api/contract-templates.api.ts`

File mới chứa toàn bộ Supabase data access cho contract_templates:

```typescript
import { supabase } from '@/services/supabase/client';
import { safeUpsertOne } from '@/lib/db-guard';
import type {
  ContractType,
  ContractTemplate,
  UpdateTemplateInput,
} from '@/schema';

const db = {
  templates: () => supabase.from('contract_templates'),
};

export async function fetchTemplates(): Promise<ContractTemplate[]>;
export async function fetchTemplateById(id: string): Promise<ContractTemplate>;
export async function insertTemplate(data: {
  type: ContractType;
  name: string;
  content: string;
}): Promise<ContractTemplate>;
export async function patchTemplate(
  id: string,
  data: UpdateTemplateInput,
): Promise<ContractTemplate>;
export async function fetchActiveTemplateByType(
  type: ContractType,
): Promise<ContractTemplate | null>;
export async function removeTemplate(id: string): Promise<void>;
```

`insertTemplate` giữ nguyên pattern `safeUpsertOne` như trong module hiện tại.

### Step 4 — Refactor `src/features/contract-templates/contract-templates.module.ts`

1. **Xóa** import `supabase` từ `@/services/supabase/client`
2. **Xóa** `const db = { templates: ... }`
3. **Thêm** import các hàm từ `@/api/contract-templates.api`
4. **Refactor** từng hàm để delegate sang API layer:

```typescript
// Trước:
export async function getTemplates(): Promise<ContractTemplate[]> {
  const { data, error } = await db
    .templates()
    .select('*')
    .order('type')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ContractTemplate[];
}

// Sau:
export async function getTemplates(): Promise<ContractTemplate[]> {
  return fetchTemplates();
}
```

## Files Affected

| File                                                           | Thay đổi                                                         |
| -------------------------------------------------------------- | ---------------------------------------------------------------- |
| `src/api/contracts.api.ts`                                     | **Tạo mới** — chứa toàn bộ Supabase calls cho contracts domain   |
| `src/api/contract-templates.api.ts`                            | **Tạo mới** — chứa toàn bộ Supabase calls cho contract_templates |
| `src/features/contracts/contracts.service.ts`                  | **Refactor** — xóa Supabase imports, delegate sang API layer     |
| `src/features/contract-templates/contract-templates.module.ts` | **Refactor** — xóa Supabase imports, delegate sang API layer     |

## Files NOT Affected

- Tất cả callers của `contracts.service.ts` — public API không thay đổi
- Tất cả callers của `contract-templates.module.ts` — public API không thay đổi
- `src/lib/db-guard.ts` — không thay đổi
- `src/features/media/media.service.ts` — đã xử lý riêng, không thuộc scope
- Tất cả `.select()`, `.update()`, `.delete()` calls trong các API files khác — không liên quan

## Correctness Properties

### Property 1 — Fix Checking: contracts.service.ts không còn Supabase imports

```pascal
FOR ALL file WHERE file = 'src/features/contracts/contracts.service.ts' DO
  ASSERT file does NOT contain "import.*supabase.*from '@/services/supabase/client'"
  ASSERT file does NOT contain "supabase.from("
  ASSERT file does NOT contain "supabase.auth."
  ASSERT file does NOT contain "supabase.functions."
END FOR
```

### Property 2 — Fix Checking: contract-templates.module.ts không còn Supabase imports

```pascal
FOR ALL file WHERE file = 'src/features/contract-templates/contract-templates.module.ts' DO
  ASSERT file does NOT contain "import.*supabase.*from '@/services/supabase/client'"
  ASSERT file does NOT contain "supabase.from("
END FOR
```

### Property 3 — Fix Checking: API files tồn tại

```pascal
ASSERT EXISTS 'src/api/contracts.api.ts'
ASSERT EXISTS 'src/api/contract-templates.api.ts'
```

### Property 4 — Preservation: getContracts return value unchanged

```pascal
FOR ALL filters: ContractsFilter DO
  result_before ← getContracts(filters)   -- F (service gọi Supabase trực tiếp)
  result_after  ← getContracts'(filters)  -- F' (service gọi API layer)
  ASSERT result_after = result_before     -- same data, same order
END FOR
```

### Property 5 — Preservation: updateContractStatus business logic unchanged

```pascal
FOR ALL id, invalidTransition WHERE NOT validateStatusTransition(current.status, invalidTransition) DO
  ASSERT updateContractStatus'(id, invalidTransition) throws Error
END FOR

FOR ALL id, validTransition WHERE validateStatusTransition(current.status, validTransition) DO
  result ← updateContractStatus'(id, validTransition, meta)
  ASSERT result.status = validTransition
END FOR
```

### Property 6 — Preservation: linkOrderToContract signed-contract guard unchanged

```pascal
FOR ALL contractId WHERE contract.status = 'signed' DO
  ASSERT linkOrderToContract'(contractId, orderId) throws Error
  ASSERT unlinkOrderFromContract'(contractId, orderId) throws Error
END FOR
```

### Property 7 — Preservation: getTemplates return value unchanged

```pascal
FOR ALL () DO
  result_before ← getTemplates()   -- F
  result_after  ← getTemplates'()  -- F'
  ASSERT result_after = result_before
END FOR
```
