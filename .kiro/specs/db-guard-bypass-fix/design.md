# Design Document — DB-Guard Bypass Fix

## Overview

Fix 3 điểm vi phạm db-guard rule bằng cách thay thế các lời gọi `.insert()` / `.upsert()` trực tiếp bằng các wrapper tương ứng trong `src/lib/db-guard.ts`. Không thay đổi logic nghiệp vụ, chỉ thay đổi lớp persistence.

## Bug Condition

```pascal
FUNCTION isBugCondition(callSite)
  INPUT: callSite — một lời gọi write operation lên Supabase
  OUTPUT: boolean

  RETURN callSite.method IN ['insert', 'upsert']
     AND callSite.caller NOT IN ['safeUpsert', 'safeUpsertOne', 'safeInsert']
     AND callSite.table NOT IN ['tasks', 'contract_order_links']  -- đã đúng
END FUNCTION
```

**Fix Checking Property:**

```pascal
FOR ALL callSite WHERE isBugCondition(callSite) DO
  result ← fixedFunction(callSite)
  ASSERT result routes through db-guard wrapper
  ASSERT result has idempotency guarantee
END FOR
```

**Preservation Property:**

```pascal
FOR ALL callSite WHERE NOT isBugCondition(callSite) DO
  ASSERT F(callSite) = F'(callSite)  -- behavior unchanged
END FOR
```

## Technical Context

### db-guard.ts API

| Wrapper                                       | Dùng khi                                | Idempotency                                              |
| --------------------------------------------- | --------------------------------------- | -------------------------------------------------------- |
| `safeUpsert({ table, data, conflictKey })`    | Upsert nhiều rows, conflict theo column | Có — dựa trên `conflictKey`                              |
| `safeUpsertOne({ table, data, conflictKey })` | Upsert 1 row, trả về single object      | Có — dựa trên `conflictKey`                              |
| `safeInsert({ table, data, uniqueCheck })`    | Insert với duplicate check trước        | Có — check `uniqueCheck.column = value` trước khi insert |

`safeInsert` thực hiện SELECT trước, nếu đã tồn tại thì trả về bản ghi cũ thay vì insert mới — phù hợp cho audit log (không nên upsert/overwrite).

### Tại sao audit log dùng `safeInsert` thay vì `safeUpsert`

Audit log là immutable event record. Nếu dùng `safeUpsert` với `conflictKey: 'id'`, khi retry sẽ overwrite `old_values`/`new_values` của bản ghi cũ — mất tính toàn vẹn lịch sử. `safeInsert` với `uniqueCheck: { column: 'id', value: id }` đảm bảo: nếu đã có bản ghi với `id` đó thì bỏ qua, không ghi đè.

## Implementation Plan

### Fix 1 — `contracts.service.ts`: `writeAuditLog()`

**File:** `src/features/contracts/contracts.service.ts`

**Hiện tại:**

```typescript
import { safeUpsertOne } from '@/lib/db-guard';

export async function writeAuditLog(...): Promise<void> {
  const { error } = await supabase.from('contract_audit_logs').insert({
    id: crypto.randomUUID(),
    contract_id: contractId,
    action,
    old_values: oldValues as never,
    new_values: newValues as never,
    performed_by: performedBy,
    performed_at: new Date().toISOString(),
  });
  if (error) throw error;
}
```

**Sau fix:**

```typescript
import { safeUpsertOne, safeInsert } from '@/lib/db-guard';

export async function writeAuditLog(...): Promise<void> {
  const id = crypto.randomUUID();
  await safeInsert({
    table: 'contract_audit_logs',
    data: {
      id,
      contract_id: contractId,
      action,
      old_values: oldValues as never,
      new_values: newValues as never,
      performed_by: performedBy,
      performed_at: new Date().toISOString(),
    },
    uniqueCheck: { column: 'id', value: id },
  });
}
```

**Lưu ý:** Import thêm `safeInsert` vào import hiện có. Bỏ `supabase.from(...)` call và `if (error) throw error` — db-guard đã xử lý.

---

### Fix 2 — `color.api.ts`: `colorApi.upsert()`

**File:** `src/api/color.api.ts`

**Hiện tại:**

```typescript
import { supabase } from '@/services/supabase/client';

upsert: async (values: ColorFormValues) => {
  const tenantId = await getTenantId();
  const payload = { ... };

  const { data, error } = await supabase
    .from('colors')
    .upsert(payload, { onConflict: 'code' })
    .select()
    .single();

  if (error) throw error;
  return data;
},
```

**Sau fix:**

```typescript
import { supabase } from '@/services/supabase/client';
import { safeUpsert } from '@/lib/db-guard';

upsert: async (values: ColorFormValues) => {
  const tenantId = await getTenantId();
  const payload = { ... };

  const result = await safeUpsert({
    table: 'colors',
    data: payload,
    conflictKey: 'code',
  });

  return Array.isArray(result) ? result[0] : result;
},
```

**Lưu ý:** `safeUpsert` trả về `unknown[]` — lấy `result[0]` để giữ nguyên return type. `safeUpsert` tự inject `id` nếu chưa có, nhưng `colors` table dùng `code` làm conflict key nên không ảnh hưởng.

---

### Fix 3 — `operations.api.ts`: `logBlockedTransitionEvent()`

**File:** `src/api/operations.api.ts`

**Hiện tại:**

```typescript
export async function logBlockedTransitionEvent(
  event: BlockedTransitionTelemetryEvent,
): Promise<void> {
  const tenantId = await getTenantId();
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id ?? null;

  const { error } = await supabase.from('business_audit_log').insert({
    tenant_id: tenantId,
    entity_type: 'operations_task_board',
    entity_id: event.taskId,
    event_type: 'OPS_TASK_TRANSITION_BLOCKED',
    payload: { ...event, module: 'operations-board' } satisfies Json,
    user_id: userId,
  });

  if (error) throw error;
}
```

**Sau fix:**

```typescript
import { safeUpsert, safeInsert } from '@/lib/db-guard';

export async function logBlockedTransitionEvent(
  event: BlockedTransitionTelemetryEvent,
): Promise<void> {
  const tenantId = await getTenantId();
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id ?? null;
  const id = crypto.randomUUID();

  await safeInsert({
    table: 'business_audit_log',
    data: {
      id,
      tenant_id: tenantId,
      entity_type: 'operations_task_board',
      entity_id: event.taskId,
      event_type: 'OPS_TASK_TRANSITION_BLOCKED',
      payload: { ...event, module: 'operations-board' } as Record<
        string,
        unknown
      >,
      user_id: userId,
    },
    uniqueCheck: { column: 'id', value: id },
  });
}
```

**Lưu ý:** Import thêm `safeInsert` vào import hiện có (`safeUpsert` đã được import). Bỏ `satisfies Json` cast vì `safeInsert` nhận `Record<string, unknown>`.

## Files Affected

| File                                          | Thay đổi                                                           |
| --------------------------------------------- | ------------------------------------------------------------------ |
| `src/features/contracts/contracts.service.ts` | Thêm `safeInsert` vào import; refactor `writeAuditLog`             |
| `src/api/color.api.ts`                        | Thêm import `safeUpsert`; refactor `colorApi.upsert`               |
| `src/api/operations.api.ts`                   | Thêm `safeInsert` vào import; refactor `logBlockedTransitionEvent` |

## Files NOT Affected

- `src/features/media/media.service.ts` — đã dùng `safeUpsert` đúng cách
- `src/lib/db-guard.ts` — không thay đổi API
- Tất cả `.select()`, `.update()`, `.delete()` calls — không thuộc phạm vi db-guard

## Correctness Properties

### Property 1 — Fix Checking: writeAuditLog idempotency

```pascal
FOR ALL contractId, action, oldValues, newValues, performedBy DO
  id ← crypto.randomUUID()
  call writeAuditLog'(contractId, action, oldValues, newValues, performedBy) twice with same id
  ASSERT business_audit_log contains exactly 1 record with that id
END FOR
```

### Property 2 — Fix Checking: colorApi.upsert routes through db-guard

```pascal
FOR ALL colorPayload WHERE colorPayload.code IS NOT NULL DO
  result ← colorApi.upsert'(colorPayload)
  ASSERT result is not null
  ASSERT no direct supabase.from('colors').upsert() call was made
END FOR
```

### Property 3 — Fix Checking: logBlockedTransitionEvent idempotency

```pascal
FOR ALL event: BlockedTransitionTelemetryEvent DO
  id ← crypto.randomUUID()
  call logBlockedTransitionEvent'(event) twice with same id
  ASSERT business_audit_log contains exactly 1 record with that id
END FOR
```

### Property 4 — Preservation: colorApi.upsert behavior unchanged

```pascal
FOR ALL colorPayload DO
  result_before ← colorApi.upsert(colorPayload)   -- F
  result_after  ← colorApi.upsert'(colorPayload)  -- F'
  ASSERT result_after.code = result_before.code
  ASSERT result_after.name = result_before.name
END FOR
```
