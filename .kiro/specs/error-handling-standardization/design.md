# Design Document — Error Handling Standardization

## Overview

Fix hai vấn đề error handling trong production:

1. Loại bỏ `console.log/info/warn/error` không phù hợp khỏi production code
2. Sửa silent failure trong `ExpenseForm.onSubmit` để `mutationError` hoạt động đúng

Không thay đổi business logic. Chỉ thay đổi logging behavior và error propagation.

---

## Bug Condition Analysis

### Bug Condition C(X)

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type AppEvent
  OUTPUT: boolean

  RETURN (
    // Bug 1: console logs trong production
    (X.context = "useCreateOrderV2" AND X.env = "production" AND X.hasConsoleCall = true)
    OR
    // Bug 2: silent failure trong ExpenseForm
    (X.context = "ExpenseForm.onSubmit" AND X.mutationFails = true AND X.usesMutateAsync = true)
  )
END FUNCTION
```

### Property P(result) — Fix Checking

```pascal
// Property: Fix Checking — No console in production
FOR ALL X WHERE isBugCondition(X) AND X.context = "useCreateOrderV2" DO
  ASSERT no_console_call_in_production(X)
END FOR

// Property: Fix Checking — Error propagation
FOR ALL X WHERE isBugCondition(X) AND X.context = "ExpenseForm.onSubmit" DO
  result ← onSubmit'(X)
  ASSERT mutationError IS NOT NULL
  ASSERT ui_shows_error_message = true
END FOR
```

### Preservation Goal ¬C(X)

```pascal
// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT F(X) = F'(X)
  // Business logic, fallback flow, cache invalidation không thay đổi
END FOR
```

---

## Technical Context

### File 1: `src/application/orders/useCreateOrderV2.ts`

**Vị trí các console calls cần xử lý:**

| Line | Call                                                          | Vấn đề                                 |
| ---- | ------------------------------------------------------------- | -------------------------------------- |
| ~196 | `console.warn('[createOrder] ⚠️ Edge Function...')`           | Log full error object trong production |
| ~210 | `console.info('[createOrder] ✅ ${result.orderNumber}...')`   | Log business data nhạy cảm             |
| ~214 | `console.error('[createOrder] ❌ Error:', code, err.message)` | Log error details trong production     |

**Cách fix:**

```typescript
// TRƯỚC (mutationFn catch block):
console.warn(
  '[createOrder] ⚠️ Edge Function không thể kết nối, chuyển sang direct insert.',
  edgeFnError,
);

// SAU:
if (import.meta.env.DEV) {
  console.warn(
    '[createOrder] ⚠️ Edge Function không thể kết nối, chuyển sang direct insert.',
    edgeFnError,
  );
}
```

```typescript
// TRƯỚC (onSuccess):
console.info(
  `[createOrder] ✅ ${result.orderNumber} created. ` +
    `Allocated ${result.allocation.length} rolls.`,
);

// SAU: Xóa hoàn toàn — không cần log trong onSuccess
```

```typescript
// TRƯỚC (onError):
const code = 'code' in err ? err.code : 'UNKNOWN';
console.error('[createOrder] ❌ Error:', code, err.message);

// SAU: Xóa hoàn toàn — React Query đã handle error state
onError: (_err: Error | CreateOrderError) => {
  // Error state được React Query quản lý — không cần log
},
```

---

### File 2: `src/features/payments/ExpenseForm.tsx`

**Root cause của silent failure:**

Khi dùng `mutateAsync` trong try/catch, React Query không set `mutation.error` vì error đã bị catch trước khi React Query có cơ hội xử lý. Đây là behavior đã được document trong React Query.

**Hai cách fix:**

**Option A — Dùng `mutate` thay vì `mutateAsync` (recommended):**

```typescript
// TRƯỚC:
async function onSubmit(values: ExpenseFormValues) {
  try {
    if (isEditing) {
      await updateMutation.mutateAsync({ id: expense.id, values });
    } else {
      await createMutation.mutateAsync(values);
    }
    onClose();
  } catch (err) {
    // Lỗi hiện qua mutationError
    console.error('[ExpenseForm]', err);
  }
}

// SAU (Option A):
function onSubmit(values: ExpenseFormValues) {
  if (isEditing) {
    updateMutation.mutate({ id: expense.id, values }, { onSuccess: onClose });
  } else {
    createMutation.mutate(values, { onSuccess: onClose });
  }
}
```

**Option B — Re-throw error sau khi catch:**

```typescript
// SAU (Option B):
async function onSubmit(values: ExpenseFormValues) {
  try {
    if (isEditing) {
      await updateMutation.mutateAsync({ id: expense.id, values });
    } else {
      await createMutation.mutateAsync(values);
    }
    onClose();
  } catch (err) {
    // Re-throw để React Query set mutationError
    throw err;
  }
}
```

**Lựa chọn: Option A** — Dùng `mutate` với `onSuccess` callback là idiomatic React Query pattern, tránh try/catch hoàn toàn, và đảm bảo `mutationError` được set đúng khi mutation thất bại.

**Lưu ý:** `mutationError` đã được render trong JSX — không cần thay đổi phần hiển thị lỗi:

```tsx
{
  mutationError && (
    <p className="error-inline mb-4">
      Lỗi:{' '}
      {mutationError instanceof Error
        ? mutationError.message
        : String(mutationError)}
    </p>
  );
}
```

---

## Implementation Plan

### Thay đổi 1: `useCreateOrderV2.ts`

1. Wrap `console.warn` trong fallback path bằng `if (import.meta.env.DEV)`
2. Xóa `console.info` trong `onSuccess` callback
3. Xóa `console.error` trong `onError` callback (giữ lại callback nhưng để trống hoặc xóa hoàn toàn nếu không cần)

### Thay đổi 2: `ExpenseForm.tsx`

1. Thay `async function onSubmit` dùng `mutateAsync` + try/catch bằng `function onSubmit` dùng `mutate` + `onSuccess` callback
2. Xóa `console.error('[ExpenseForm]', err)` trong catch block (catch block sẽ không còn tồn tại)

---

## Correctness Properties

### Property 1 — No console in production (useCreateOrderV2)

```pascal
FOR ALL X WHERE X.env = "production" AND X.context = "useCreateOrderV2" DO
  result ← executeHook'(X)
  ASSERT result.consoleCallCount = 0
END FOR
```

### Property 2 — Dev-only console.warn preserved

```pascal
FOR ALL X WHERE X.env = "development" AND X.edgeFnConnectionFails = true DO
  result ← executeHook'(X)
  ASSERT result.consoleWarnCalled = true
END FOR
```

### Property 3 — mutationError propagation (ExpenseForm)

```pascal
FOR ALL X WHERE X.context = "ExpenseForm.onSubmit" AND X.mutationFails = true DO
  result ← onSubmit'(X)
  ASSERT result.mutationError IS NOT NULL
  ASSERT result.uiShowsError = true
  ASSERT result.onCloseCalled = false
END FOR
```

### Property 4 — onClose called on success (ExpenseForm)

```pascal
FOR ALL X WHERE X.context = "ExpenseForm.onSubmit" AND X.mutationSucceeds = true DO
  result ← onSubmit'(X)
  ASSERT result.onCloseCalled = true
  ASSERT result.mutationError IS NULL
END FOR
```

### Property 5 — Fallback behavior preserved (useCreateOrderV2)

```pascal
FOR ALL X WHERE X.edgeFnConnectionFails = true DO
  ASSERT F(X).orderCreated = F'(X).orderCreated
  ASSERT F(X).usedDirectInsert = F'(X).usedDirectInsert
END FOR
```

---

## Risk Assessment

| Thay đổi                                       | Risk                               | Mitigation                                     |
| ---------------------------------------------- | ---------------------------------- | ---------------------------------------------- |
| Xóa `console.info` trong `onSuccess`           | Thấp — chỉ mất debug log           | Không ảnh hưởng business logic                 |
| Xóa `console.error` trong `onError`            | Thấp — React Query vẫn track error | Error state vẫn available qua `mutation.error` |
| Wrap `console.warn` với `DEV` guard            | Thấp                               | Fallback logic không thay đổi                  |
| Đổi `mutateAsync` → `mutate` trong ExpenseForm | Trung bình                         | Cần test cả create và update flow              |

Không có thay đổi nào ảnh hưởng đến database operations, API calls, hoặc business validation logic.
