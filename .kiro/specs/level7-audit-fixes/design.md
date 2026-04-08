# Design — Level 7 Audit Fixes

## Overview

Spec này là **tech debt / bugfix**, không phải feature mới. Mục tiêu là đưa codebase về trạng thái sạch:

- TypeScript build: 0 lỗi (`tsc --noEmit -p tsconfig.app.json`)
- Test suite: 100% pass (`vitest run`)
- ESLint: 0 errors, 0 warnings trong các file được liệt kê
- Không còn known vulnerabilities trong `npm audit`

Design này tập trung vào **file nào cần sửa**, **sửa gì cụ thể**, và **thứ tự thực hiện** để tránh dependency issues.

---

## Architecture

Không có thay đổi kiến trúc. Tất cả fixes đều là:

1. Thêm re-export vào barrel files
2. Thêm type annotations vào callbacks
3. Sửa giá trị sai trong object literals
4. Cập nhật test mocks để match interface thực tế
5. Thêm Zod parse vào API layer
6. Refactor cross-feature imports về shared layer
7. Thêm business validation vào schema

```
src/
├── features/*/
│   └── *.module.ts        ← CRITICAL-01-A: thêm type re-exports
├── features/*/
│   └── use*.ts / *Form.tsx ← CRITICAL-01-B: thêm callback type annotations
├── features/*/
│   └── *.module.ts        ← CRITICAL-01-C: sửa group values, fix duplicates
├── features/orders/
│   └── useCreateOrderV2.ts ← CRITICAL-01-D: đã OK (CreateOrderInput extends OrdersFormValues)
├── core/registry/
│   └── moduleRegistry.ts  ← CRITICAL-02-A: kiểm tra createModule export
├── app/router/
│   └── ProtectedRoute.test.tsx ← CRITICAL-02-B: fix mock
├── features/dashboard/
│   └── DashboardPage.test.tsx  ← CRITICAL-02-C: fix assertion
├── api/
│   └── *.api.ts           ← MAJOR-01: thêm Zod parse
├── schema/
│   └── payment.schema.ts  ← MAJOR-03: thêm overpayment validation
└── .eslintrc.cjs           ← MAJOR-02: thêm boundaries config
```

---

## Components and Interfaces

### CRITICAL-01-A: Missing Exports trong Module Files

**Root cause**: Các file trong `src/features/*/` import `FormValues` types từ module barrel (e.g., `import type { PaymentsFormValues } from '@/features/payments/payments.module'`), nhưng module chưa re-export các types đó.

**Pattern cần áp dụng** cho mỗi module file:

```typescript
// Thêm vào phần export type của module file
export type {
  PaymentsFormValues,
  AccountFormValues,
  ExpenseFormValues,
} from '@/schema/payment.schema';
```

**Danh sách thay đổi cụ thể:**

| File                        | Types cần thêm                                                 | Source schema                     |
| --------------------------- | -------------------------------------------------------------- | --------------------------------- |
| `payments.module.ts`        | `PaymentsFormValues`, `AccountFormValues`, `ExpenseFormValues` | `@/schema/payment.schema`         |
| `orders.module.ts`          | `OrdersFormValues`                                             | `@/schema/order.schema`           |
| `shipments.module.ts`       | `ShipmentsFormValues`, `DeliveryConfirmFormValues`             | `@/schema/shipment.schema`        |
| `raw-fabric.module.ts`      | `RawFabricFormValues`, `BulkInputFormValues`                   | `@/schema/raw-fabric.schema`      |
| `finished-fabric.module.ts` | `FinishedFabricFormValues`, `BulkFinishedInputFormValues`      | `@/schema/finished-fabric.schema` |
| `work-orders.module.ts`     | `CreateWorkOrderInput`, `CompleteWorkOrderInput`               | `@/schema/work-order.schema`      |
| `fabric-catalog.module.ts`  | `FabricCatalogFormValues`                                      | `@/schema/fabric-catalog.schema`  |
| `yarn-catalog.module.ts`    | `YarnCatalogFormValues`                                        | `@/schema/yarn-catalog.schema`    |
| `yarn-receipts.module.ts`   | `YarnReceiptsFormValues`                                       | `@/schema/yarn-receipt.schema`    |
| `quotations.module.ts`      | `QuotationsFormValues`                                         | `@/schema/quotation.schema`       |
| `shipping-rates.module.ts`  | `ShippingRateFormValues`                                       | `@/schema/shipping-rate.schema`   |
| `suppliers.module.ts`       | `SupplierFormValues`                                           | `@/schema/supplier.schema`        |

**Lưu ý**: Một số module đã import schema values (e.g., `payments.module.ts` đã import `paymentsSchema`) nhưng chưa re-export type. Chỉ cần thêm `export type { ... }` — không cần thêm import mới nếu schema đã được import.

---

### CRITICAL-01-B: Implicit Any trong Callbacks

**Root cause**: TypeScript strict mode (`"strict": true` trong `tsconfig.app.json`) yêu cầu tất cả tham số phải có type tường minh. Các callback trong `.map()`, `.filter()`, `.reduce()` đang để TypeScript infer là `any`.

**Pattern cần áp dụng:**

```typescript
// Trước (lỗi TS7006)
const names = orders.map((o) => o.customer_name);

// Sau
import type { Order } from '@/features/orders/orders.module';
const names = orders.map((o: Order) => o.customer_name);
```

**Danh sách files cần sửa:**

| File                                                      | Vị trí tìm                      |
| --------------------------------------------------------- | ------------------------------- |
| `src/features/orders/useOrders.ts`                        | `.map()`, `.filter()` callbacks |
| `src/features/shipments/useShipments.ts`                  | `.map()`, `.filter()` callbacks |
| `src/features/yarn-receipts/useYarnReceipts.ts`           | `.map()`, `.filter()` callbacks |
| `src/features/work-orders/WorkOrderYarnTable.tsx`         | `.map()` callbacks              |
| `src/features/finished-fabric/FinishedFabricBulkForm.tsx` | `.map()`, `.reduce()` callbacks |
| `src/features/raw-fabric/RawFabricBulkForm.tsx`           | `.map()`, `.reduce()` callbacks |
| `src/features/orders/OrderForm.tsx`                       | `.map()`, `.filter()` callbacks |
| `src/features/shipments/ShipmentForm.tsx`                 | `.map()` callbacks              |
| `src/features/yarn-receipts/YarnReceiptForm.tsx`          | `.map()` callbacks              |
| `src/features/quotations/useQuotations.ts`                | `.map()`, `.filter()` callbacks |
| `src/features/orders/useCreateOrderV2.ts`                 | `.map()`, `.reduce()` callbacks |

**Cách xác định type đúng**: Dùng type từ `@/models` hoặc từ module barrel tương ứng. Ví dụ: `Payment` từ `@/models`, `OrdersFormValues` từ `orders.module`.

---

### CRITICAL-01-C: Type Mismatch và Duplicate Exports

**1. Group values sai** — `FeaturePlugin['group']` chỉ chấp nhận `'sales' | 'production' | 'master-data' | 'system'`:

| File                   | Giá trị hiện tại | Giá trị đúng |
| ---------------------- | ---------------- | ------------ |
| `customers.module.tsx` | `'partners'`     | `'sales'`    |
| `reports.module.ts`    | `'admin'`        | `'system'`   |
| `settings.module.ts`   | `'admin'`        | `'system'`   |

**2. Unused imports trong `customers.module.tsx`**:

```typescript
// Xóa các dòng này (lazy và LazyPage không được dùng)
import { lazy } from 'react';
import { LazyPage } from '@/app/router/LazyPage';
```

**3. `FeatureScaffoldPage.tsx`** — `highlights` và `resources` là `string[] | undefined` trong `FeatureDefinition` nhưng `PagePlaceholder` yêu cầu `string[]` (non-optional):

```typescript
// Sửa trong FeatureScaffoldPage.tsx
<PagePlaceholder
  highlights={feature.highlights ?? []}
  resources={feature.resources ?? []}
  // ... các props khác
/>
```

**4. Duplicate exports** — cần kiểm tra và loại bỏ:

- `src/features/order-progress/index.ts`: kiểm tra xem có symbol nào được export 2 lần không
- `src/features/payments/index.ts`: `Payment`, `Expense`, `PaymentAccount` có thể đã được export qua `payments.module` và qua `types` — cần xóa một trong hai

---

### CRITICAL-01-D: CreateOrderInput Missing Properties

**Phân tích**: Sau khi đọc `useCreateOrderV2.ts`, `CreateOrderInput` được định nghĩa là:

```typescript
export interface CreateOrderInput extends OrdersFormValues {
  managerOverride?: boolean;
}
```

File này truy cập `input.sourceQuotationId` bằng cách cast:

```typescript
sourceQuotationId: (input as CreateOrderInput & { sourceQuotationId?: string }).sourceQuotationId,
```

**Fix**: Thêm `sourceQuotationId` vào interface thay vì dùng type assertion:

```typescript
export interface CreateOrderInput extends OrdersFormValues {
  managerOverride?: boolean;
  sourceQuotationId?: string;
}
```

---

### CRITICAL-02-A: createModule Test Failures

**Phân tích**: `moduleRegistry.ts` export `createModule` như một named export:

```typescript
export function createModule<T>(config: T): T {
  return config;
}
```

Các test files import `createModule` từ module barrel. Lỗi `TypeError: createModule is not a function` thường xảy ra khi:

1. Vitest không resolve được module path đúng
2. Circular dependency trong module graph

**Fix**: Kiểm tra các test files (`orders.module.test.ts`, `quotations.module.test.ts`, `raw-fabric.module.test.ts`, `suppliers.module.test.ts`) — nếu chúng import từ feature barrel (`@/features/orders/orders.module`) thay vì trực tiếp từ `@/core/registry/moduleRegistry`, thì `createModule` được gọi khi module load. Cần mock `createModule` trong test:

```typescript
// Trong test file
vi.mock('@/core/registry/moduleRegistry', () => ({
  createModule: vi.fn((config) => config),
}));
```

Hoặc nếu test chỉ test schema/logic (như `raw-fabric.module.test.ts` hiện tại), không cần mock — chỉ cần đảm bảo import path đúng.

---

### CRITICAL-02-B: ProtectedRoute Test — Mock sai AuthContextValue

**Phân tích**: `AuthContextValue` thực tế (từ `AuthProvider.tsx`) là:

```typescript
export type AuthContextValue = AuthState & AuthActions;
// AuthState: { session, user, profile, loading, isBlocked }
// AuthActions: { signIn, signOut, signUp }
```

Mock hiện tại dùng `isAdmin`, `isManager`, `isStaff` — **không tồn tại** trong interface.

**Fix** — cập nhật mock trong `src/app/router/ProtectedRoute.test.tsx`:

```typescript
const mockAuth: AuthContextValue = {
  user: null,
  session: null,
  profile: null, // thêm
  loading: false,
  isBlocked: false, // thêm, xóa isAdmin/isManager/isStaff
  signIn: vi.fn(),
  signOut: vi.fn(),
  signUp: vi.fn(),
};
```

---

### CRITICAL-02-C: DashboardPage Test — Heading không khớp

**Phân tích**: `DashboardPage.tsx` không render bất kỳ `<h1>` hay heading nào với text "Dashboard". Component chỉ render KPI cards và widgets.

Test hiện tại:

```typescript
expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
expect(screen.getByText('Tổng quan')).toBeInTheDocument();
```

**Hai lựa chọn**:

- Option A: Cập nhật test để kiểm tra những gì component thực sự render (KPI labels như "Đang xử lý", "Trễ hạn")
- Option B: Thêm heading vào `DashboardPage.tsx`

**Quyết định**: Option B — thêm heading vào component vì đây là UX tốt hơn và test có giá trị hơn:

```typescript
// Thêm vào đầu return trong DashboardPage.tsx
<h1 className="sr-only">Dashboard</h1>
// hoặc visible heading nếu design cho phép
```

Sau đó cập nhật test để bỏ assertion `'Tổng quan'` nếu text đó không tồn tại.

---

### MAJOR-01: Zod Validation cho Supabase API Responses

**Pattern hiện tại** (sai):

```typescript
const { data } = await supabase.from('payments').select('*');
return data as unknown as Payment[];
```

**Pattern đúng**:

```typescript
import { paymentResponseSchema } from '@/schema/payment.schema';

const { data } = await supabase.from('payments').select('*');
return paymentResponseSchema.array().parse(data);
```

**Cần tạo response schemas** trong các schema files. Response schema khác FormValues schema — nó map với DB columns:

```typescript
// Trong payment.schema.ts — thêm response schema
export const paymentResponseSchema = z.object({
  id: z.string().uuid(),
  payment_number: z.string(),
  order_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  payment_date: z.string(),
  amount: z.number(),
  payment_method: z.enum(['cash', 'bank_transfer', 'check', 'other']),
  account_id: z.string().uuid().nullable(),
  reference_number: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type PaymentResponse = z.infer<typeof paymentResponseSchema>;
```

**Thứ tự ưu tiên**: `payments.api.ts` → `orders.api.ts` → `shipments.api.ts` → `customers.api.ts`

---

### MAJOR-02: Cross-Feature Imports + eslint-plugin-boundaries

**Files cần refactor:**

| File vi phạm                              | Import từ                                                              | Fix                                                |
| ----------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------- |
| `work-orders/WorkOrderForm.tsx`           | `src/features/bom/`, `src/features/orders/`, `src/features/suppliers/` | Nhận data qua props hoặc dùng `src/api/` trực tiếp |
| `raw-fabric/RawFabricBulkForm.tsx`        | `src/features/fabric-catalog/`                                         | Nhận `fabricOptions` qua props                     |
| `shipments/ShipmentForm.tsx`              | `src/features/shipping-rates/`                                         | Nhận `shippingRates` qua props                     |
| `weaving-invoices/WeavingInvoiceForm.tsx` | `src/features/fabric-catalog/`                                         | Nhận `fabricOptions` qua props                     |

**Cấu hình `.eslintrc.cjs`** — thêm boundaries plugin:

```javascript
// Thêm vào plugins array
plugins: ['@typescript-eslint', 'react-refresh', 'import', 'boundaries'],

// Thêm vào settings
settings: {
  'import/resolver': { typescript: {} },
  'boundaries/elements': [
    { type: 'feature', pattern: 'src/features/*' },
    { type: 'shared', pattern: 'src/shared/*' },
    { type: 'api', pattern: 'src/api/*' },
    { type: 'schema', pattern: 'src/schema/*' },
    { type: 'models', pattern: 'src/models/*' },
  ],
},

// Thêm vào rules
'boundaries/element-types': [
  'error',
  {
    default: 'allow',
    rules: [
      {
        from: 'feature',
        disallow: ['feature'],
        message: 'Cross-feature imports are not allowed. Use shared/, api/, or props instead.',
      },
    ],
  },
],
```

---

### MAJOR-03: Overpayment Validation

**Thay đổi `paymentsSchema`** — dùng Zod `.superRefine()` với context:

```typescript
// Trong payment.schema.ts
export function createPaymentsSchema(balanceDue?: number) {
  return paymentsSchema.superRefine((data, ctx) => {
    if (balanceDue !== undefined && data.amount > balanceDue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['amount'],
        message: `Số tiền thu không được vượt quá số dư còn lại (${balanceDue.toLocaleString('vi-VN')} đ)`,
      });
    }
  });
}
```

**Thay đổi `PaymentForm.tsx`**:

```typescript
// Nhận balanceDue qua props
const schema = useMemo(() => createPaymentsSchema(balanceDue), [balanceDue]);
const form = useForm<PaymentsFormValues>({ resolver: zodResolver(schema) });

// Hiển thị warning nếu balanceDue <= 0
if (balanceDue !== undefined && balanceDue <= 0) {
  return <Alert>Đơn hàng đã được thanh toán đầy đủ.</Alert>;
}
```

**DB constraint** (cần confirm trước khi thực hiện theo rule `no-db-change-without-confirm`):

```sql
-- Migration: add overpayment check constraint
ALTER TABLE payments
ADD CONSTRAINT chk_no_overpayment
CHECK (
  amount <= (
    SELECT o.total_amount - o.paid_amount
    FROM orders o
    WHERE o.id = order_id
  )
);
```

---

## Data Models

Không có data model mới. Các thay đổi chỉ là:

- Thêm `sourceQuotationId?: string` vào `CreateOrderInput` interface
- Thêm response schemas (Zod) vào các schema files
- Thêm `createPaymentsSchema(balanceDue?)` factory function

---

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

Sau khi phân tích tất cả acceptance criteria, chỉ có **Requirement 10 (MAJOR-03: Overpayment Validation)** phù hợp với property-based testing. Các requirements còn lại là SMOKE tests (compile-time checks, ESLint checks) hoặc EXAMPLE tests (test mock fixes).

### Property 1: Overpayment luôn bị từ chối

_For any_ payment amount và balance due, nếu `amount > balanceDue` thì `createPaymentsSchema(balanceDue).safeParse({ amount, ... })` SHALL trả về `success: false` với error trên field `amount`.

**Validates: Requirements 10.1, 10.2**

### Property 2: Payment hợp lệ luôn được chấp nhận

_For any_ payment amount và balance due, nếu `0 < amount <= balanceDue` thì `createPaymentsSchema(balanceDue).safeParse({ amount, ... })` SHALL không có error trên field `amount`.

**Validates: Requirements 10.1, 10.7**

---

## Error Handling

### TypeScript Errors (CRITICAL-01)

- Tất cả TS errors phải được fix tại source — không dùng `// @ts-ignore` hay `as unknown as T`
- Sau mỗi nhóm fix, chạy `tsc --noEmit -p tsconfig.app.json` để verify

### Test Failures (CRITICAL-02)

- Fix mock trước khi chạy lại test
- Không thay đổi logic của component chỉ để test pass — test phải reflect behavior thực tế

### Zod Parse Errors (MAJOR-01)

- Khi `schema.parse()` throw, API layer nên wrap lỗi với context rõ ràng:

```typescript
try {
  return paymentResponseSchema.array().parse(data);
} catch (e) {
  throw new Error(`[payments.api] Invalid response shape: ${e}`);
}
```

### Overpayment (MAJOR-03)

- Validation xảy ra ở 3 tầng: form (UX), API (business logic), DB (constraint)
- Nếu DB constraint fail, Supabase trả về error code `23514` — cần handle trong API layer

---

## Testing Strategy

### Unit Tests (Example-based)

**CRITICAL-02-B**: `ProtectedRoute.test.tsx`

- Test case 1: user = null → redirect to login
- Test case 2: user = valid → render children
- Test case 3: isBlocked = true → render blocked message (nếu có)

**CRITICAL-02-C**: `DashboardPage.test.tsx`

- Test case 1: render heading "Dashboard"
- Bỏ assertion `'Tổng quan'` nếu text không tồn tại trong component

**MAJOR-03**: `PaymentForm` validation

- Test case: balanceDue = 0 → hiển thị "đã thanh toán đầy đủ"
- Test case: amount = balanceDue → valid
- Test case: amount > balanceDue → error message

### Property-Based Tests

Dùng **fast-check** (đã có trong devDependencies hoặc cần install):

```typescript
// payment.schema.test.ts
import fc from 'fast-check';
import {
  createPaymentsSchema,
  paymentsDefaultValues,
} from '@/schema/payment.schema';

// Feature: level7-audit-fixes, Property 1: Overpayment luôn bị từ chối
test('overpayment is always rejected', () => {
  fc.assert(
    fc.property(
      fc.float({ min: 0.01, max: 1_000_000 }), // balanceDue
      fc.float({ min: 0.01, max: 2_000_000 }), // amount
      (balanceDue, amount) => {
        fc.pre(amount > balanceDue);
        const schema = createPaymentsSchema(balanceDue);
        const result = schema.safeParse({ ...paymentsDefaultValues, amount });
        return (
          result.success === false &&
          result.error.issues.some((i) => i.path.includes('amount'))
        );
      },
    ),
    { numRuns: 100 },
  );
});

// Feature: level7-audit-fixes, Property 2: Payment hợp lệ luôn được chấp nhận
test('valid payment is always accepted', () => {
  fc.assert(
    fc.property(
      fc.float({ min: 0.01, max: 1_000_000 }), // balanceDue
      fc.float({ min: 0.01, max: 1_000_000 }), // amount
      (balanceDue, amount) => {
        fc.pre(amount <= balanceDue);
        const schema = createPaymentsSchema(balanceDue);
        const result = schema.safeParse({
          ...paymentsDefaultValues,
          amount,
          orderId: '00000000-0000-0000-0000-000000000001',
          customerId: '00000000-0000-0000-0000-000000000002',
          paymentNumber: 'PT-001',
          paymentDate: '2024-01-01',
        });
        // amount field should not have overpayment error
        const amountErrors = result.success
          ? []
          : result.error.issues.filter(
              (i) =>
                i.path.includes('amount') && i.message.includes('vượt quá'),
            );
        return amountErrors.length === 0;
      },
    ),
    { numRuns: 100 },
  );
});
```

### Smoke Tests (CI)

Sau khi hoàn thành tất cả fixes:

```bash
# TypeScript build
tsc --noEmit -p tsconfig.app.json

# Test suite
vitest run

# ESLint
npm run lint

# Security audit
npm audit --audit-level=moderate
```

---

## Thứ tự Thực hiện

Thứ tự này tránh dependency issues — fix compile errors trước, sau đó mới fix tests và features:

**Bước 1 — CRITICAL-01-A** (Module exports): Thêm type re-exports vào 12 module files

- Không có dependency, có thể làm song song
- Verify: `tsc --noEmit` giảm lỗi TS2614

**Bước 2 — CRITICAL-01-C** (Type mismatch): Sửa group values, FeatureScaffoldPage, duplicate exports

- Phụ thuộc vào Bước 1 (một số lỗi TS2322 có thể liên quan đến missing exports)
- Verify: `tsc --noEmit` giảm lỗi TS2322

**Bước 3 — CRITICAL-01-D** (CreateOrderInput): Thêm `sourceQuotationId` vào interface

- Độc lập, có thể làm bất kỳ lúc nào
- Verify: `tsc --noEmit` giảm lỗi TS2339

**Bước 4 — CRITICAL-01-B** (Implicit any): Thêm type annotations vào callbacks

- Phụ thuộc vào Bước 1 (cần types đã được export)
- Verify: `tsc --noEmit` giảm lỗi TS7006

**Bước 5 — CRITICAL-02-A** (createModule tests): Mock `createModule` trong test files

- Độc lập với TypeScript fixes
- Verify: `vitest run` pass 4 test files

**Bước 6 — CRITICAL-02-B** (ProtectedRoute test): Cập nhật mock

- Độc lập
- Verify: `vitest run` pass ProtectedRoute.test.tsx

**Bước 7 — CRITICAL-02-C** (DashboardPage test): Thêm heading + cập nhật test

- Độc lập
- Verify: `vitest run` pass DashboardPage.test.tsx

**Bước 8 — MAJOR-03** (Overpayment): Sửa schema + form

- Độc lập với các bước trên
- Verify: property tests pass

**Bước 9 — MAJOR-01** (Zod API validation): Thêm response schemas + parse calls

- Phụ thuộc vào TypeScript build sạch (Bước 1-4)
- Verify: `tsc --noEmit` không có lỗi mới

**Bước 10 — MAJOR-02** (Cross-feature imports): Refactor + cấu hình boundaries

- Làm sau cùng vì có thể gây nhiều thay đổi nhất
- Verify: `npm run lint` không có boundaries errors

**Bước 11 — MINOR-01** (npm audit): `npm audit fix`

- Độc lập, làm bất kỳ lúc nào
- Verify: `npm audit --audit-level=moderate` = 0 issues

**Bước 12 — MINOR-02** (ESLint warnings): Xóa unused imports, fix import order

- Làm sau cùng để tránh conflict với các bước trước
- Verify: `npm run lint` = 0 warnings
