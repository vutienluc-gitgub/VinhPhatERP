---
trigger: always_on
---

---

## trigger: always_on

# 🧩 Clean Code & Architecture Rules (ERP Vĩnh Phát)

## 📌 Mục lục

1. [Core Principles](#core-principles)
2. [Folder Structure](#folder-structure)
3. [Centralized Schema (Level 9)](#centralized-schema)
4. [Naming Conventions](#naming-conventions)
5. [Component Rules](#component-rules)
6. [API & Data Fetching](#api--data-fetching)
7. [State Management](#state-management)
8. [Error Handling](#error-handling)
9. [Anti-patterns](#anti-patterns)
10. [Checklist trước khi commit](#checklist-trước-khi-commit)

---

## 🎯 Core Principles

- Follow existing project structure — không tự ý tạo folder mới nếu chưa thảo luận
- Do not over-engineer — giải pháp đơn giản nhất là giải pháp tốt nhất
- Keep code simple, readable, and maintainable
- Optimize for long-term scalability (not short-term speed)
- **Scope rõ ràng:** Frontend và Backend áp dụng chung các nguyên tắc này, trừ khi được ghi chú riêng (`[FE]` / `[BE]`)

---

## 🗂️ Folder Structure

```
src/
├── app/                    # Pages / Routes (Next.js App Router hoặc Pages Router)
├── components/
│   ├── ui/                 # Shared UI primitives (Button, Input, Modal...)
│   └── modules/            # Feature-specific components (e.g. InvoiceTable)
├── lib/
│   ├── schemas/            # ✅ Centralized Zod schemas & enums (xem Level 9 bên dưới)
│   ├── api/                # API client, axios instance, endpoints
│   ├── hooks/              # Custom React hooks
│   └── utils/              # Pure utility functions
├── stores/                 # Zustand / Jotai stores
├── types/                  # Global TypeScript types (nếu không dùng Zod inference)
└── constants/              # App-wide constants (routes, config keys...)
```

> **Rule:** Mỗi file chỉ làm **một việc**. Nếu file > 300 dòng, xem xét tách nhỏ.

---

## 🔒 Centralized Schema (Level 9 Strict)

> Đây là rule QUAN TRỌNG NHẤT. Mọi vi phạm đều phải được refactor trước khi merge.

### Nguyên tắc

Tất cả dữ liệu mang tính:

- **Phân loại** (enum, status, category)
- **Validation** (Zod schema)
- **Business constraints** (min/max, required fields, format)

👉 **BẮT BUỘC phải đặt tại:** `src/lib/schemas/`

### Cấu trúc thư mục schema

```
src/lib/schemas/
├── index.ts                # Re-export tất cả schemas
├── common.ts               # Shared primitives (phoneVN, dateVN, money...)
├── product.schema.ts
├── order.schema.ts
├── invoice.schema.ts
├── customer.schema.ts
└── user.schema.ts
```

### Ví dụ đúng ✅

```typescript
// src/lib/schemas/order.schema.ts

import { z } from 'zod'

export const OrderStatusEnum = z.enum([
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
])

export type OrderStatus = z.infer<typeof OrderStatusEnum>

export const OrderSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(1, 'Mã đơn hàng không được để trống'),
  status: OrderStatusEnum,
  customerId: z.string().uuid(),
  totalAmount: z.number().nonnegative('Tổng tiền không được âm'),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive(),
      unitPrice: z.number().nonnegative(),
    })
  ).min(1, 'Đơn hàng phải có ít nhất 1 sản phẩm'),
  createdAt: z.coerce.date(),
})

export type Order = z.infer<typeof OrderSchema>
export type CreateOrderDto = z.infer<typeof OrderSchema.omit({ id: true, createdAt: true })>
```

```typescript
// src/lib/schemas/common.ts — Shared primitives dùng lại được

import { z } from 'zod';

export const phoneVNSchema = z
  .string()
  .regex(/^(0[3|5|7|8|9])+([0-9]{8})$/, 'Số điện thoại không hợp lệ');

export const moneyVNSchema = z
  .number()
  .nonnegative()
  .multipleOf(1000, 'Số tiền phải là bội số của 1.000đ');

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
});
```

### Ví dụ SAI ❌

```typescript
// ❌ KHÔNG được define enum/validation inline trong component
function OrderForm() {
  const statuses = ['pending', 'confirmed', 'cancelled'] // ❌ hardcode inline
  const schema = z.object({ amount: z.number() })        // ❌ schema trong component
  ...
}

// ❌ KHÔNG được define type trùng lặp ở nhiều file
// file-a.ts: type Status = 'pending' | 'confirmed'
// file-b.ts: type OrderStatus = 'pending' | 'confirmed'  ← duplicate
```

---

## 🏷️ Naming Conventions

| Loại            | Convention               | Ví dụ                          |
| --------------- | ------------------------ | ------------------------------ |
| Component       | PascalCase               | `InvoiceTable.tsx`             |
| Hook            | camelCase + `use` prefix | `useOrderDetail.ts`            |
| Schema file     | camelCase + `.schema.ts` | `order.schema.ts`              |
| Utility         | camelCase                | `formatCurrency.ts`            |
| Store           | camelCase + `Store`      | `useOrderStore.ts`             |
| Constant        | SCREAMING_SNAKE_CASE     | `MAX_ITEMS_PER_PAGE`           |
| API endpoint fn | camelCase + verb         | `fetchOrders`, `createInvoice` |
| Type/Interface  | PascalCase               | `Order`, `CreateOrderDto`      |

### Quy tắc đặt tên biến

```typescript
// ✅ Tên rõ nghĩa, đủ context
const pendingOrderList = orders.filter(o => o.status === 'PENDING')
const isSubmitting = form.formState.isSubmitting

// ❌ Tên mơ hồ
const data = orders.filter(...)
const flag = form.formState.isSubmitting
const temp = calculateTotal()
```

---

## 🧱 Component Rules

### Cấu trúc 1 component file

```typescript
// 1. Imports (external → internal → relative)
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { OrderSchema } from '@/lib/schemas/order.schema'
import { OrderStatusBadge } from './OrderStatusBadge'

// 2. Types (nếu không dùng Zod inference)
type Props = {
  orderId: string
  onSuccess?: () => void
}

// 3. Component
export function OrderDetail({ orderId, onSuccess }: Props) {
  // 3a. Hooks
  // 3b. Derived state
  // 3c. Handlers
  // 3d. JSX
}

// 4. Subcomponents nhỏ (nếu chỉ dùng trong file này)
function OrderLineItem({ ... }) { ... }
```

### `[FE]` Component size

- **< 100 dòng JSX:** OK
- **100–200 dòng:** xem xét tách subcomponent
- **> 200 dòng JSX:** **BẮT BUỘC** tách nhỏ

### `[FE]` Props

```typescript
// ✅ Tránh prop drilling quá 2 cấp — dùng Context hoặc store
// ✅ Destructure props ngay tại tham số
function ProductCard({ name, price, stock }: ProductCardProps) { ... }

// ❌ Không dùng any
function Form({ data }: { data: any }) { ... }
```

---

## 🌐 API & Data Fetching

### Tổ chức API layer

```
src/lib/api/
├── client.ts           # Axios instance với interceptors
├── endpoints.ts        # Tất cả API URL constants
├── order.api.ts        # Các hàm gọi API liên quan order
└── invoice.api.ts
```

### Ví dụ đúng ✅

```typescript
// src/lib/api/client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10_000,
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// src/lib/api/order.api.ts
import { apiClient } from './client';
import { Order, CreateOrderDto } from '@/lib/schemas/order.schema';

export async function fetchOrders(params?: {
  status?: string;
}): Promise<Order[]> {
  const { data } = await apiClient.get('/orders', { params });
  return data;
}

export async function createOrder(payload: CreateOrderDto): Promise<Order> {
  const { data } = await apiClient.post('/orders', payload);
  return data;
}
```

### `[FE]` React Query keys

```typescript
// src/lib/api/queryKeys.ts — tập trung query keys
export const queryKeys = {
  orders: {
    all: ['orders'] as const,
    list: (filters?: object) => ['orders', 'list', filters] as const,
    detail: (id: string) => ['orders', 'detail', id] as const,
  },
  invoices: {
    all: ['invoices'] as const,
    detail: (id: string) => ['invoices', 'detail', id] as const,
  },
};
```

---

## 🗄️ State Management

### Nguyên tắc

| Loại state                | Dùng gì                   |
| ------------------------- | ------------------------- |
| Server data (fetch/cache) | React Query / SWR         |
| Global UI state           | Zustand                   |
| Local component state     | `useState` / `useReducer` |
| Form state                | React Hook Form + Zod     |

### Ví dụ Zustand store

```typescript
// src/stores/useCartStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type CartItem = { productId: string; quantity: number; unitPrice: number };

type CartStore = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  totalAmount: () => number;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => set((state) => ({ items: [...state.items, item] })),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),
      clearCart: () => set({ items: [] }),
      totalAmount: () =>
        get().items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0),
    }),
    { name: 'erp-cart' },
  ),
);
```

---

## 🚨 Error Handling

### `[FE]` Hiển thị lỗi

```typescript
// ✅ Validate bằng Zod trước khi gọi API
const result = CreateOrderSchema.safeParse(formData);
if (!result.success) {
  const messages = result.error.flatten().fieldErrors;
  // Hiển thị lỗi per-field
  return;
}

// ✅ Xử lý lỗi API tập trung qua interceptor
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) redirectToLogin();
    if (error.response?.status === 403)
      toast.error('Bạn không có quyền thực hiện hành động này');
    return Promise.reject(error);
  },
);
```

### `[BE]` Error response format

```typescript
// Luôn trả về cùng format
type ApiError = {
  code: string; // e.g. "VALIDATION_ERROR", "NOT_FOUND"
  message: string; // User-friendly message (tiếng Việt)
  details?: unknown; // Zod errors hoặc stack trace (chỉ dev)
};
```

---

## 🚫 Anti-patterns

Những điều **TUYỆT ĐỐI KHÔNG LÀM:**

### Schema & Types

```typescript
// ❌ Define enum/status inline trong component hoặc service
const STATUS = { PENDING: 'pending', DONE: 'done' } // trong component

// ❌ Validate thủ công thay vì dùng Zod
if (!data.name || data.name.length < 2) { ... }

// ❌ Dùng `any`
const handleSubmit = (data: any) => { ... }

// ❌ Copy-paste type thay vì dùng z.infer<>
type Order = { id: string; status: string; ... } // trùng với OrderSchema
```

### Component & Logic

```typescript
// ❌ Business logic trong JSX
return (
  <div>
    {orders
      .filter(o => o.status !== 'CANCELLED' && new Date(o.createdAt) > new Date('2024-01-01'))
      .map(...)}
  </div>
)
// ✅ Tách ra biến/hook: const activeOrders = useActiveOrders()

// ❌ Fetch data trực tiếp trong useEffect mà không có cleanup
useEffect(() => {
  fetch('/api/orders').then(r => r.json()).then(setOrders) // không abort, không error handling
}, [])

// ❌ Hardcode string tiếng Việt ở nhiều nơi
toast.error('Đơn hàng không tồn tại') // nên tập trung vào constants/messages.ts
```

### API

```typescript
// ❌ Gọi API thẳng trong component (không qua api layer)
const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${id}`)

// ❌ Không handle loading/error state
const { data } = useQuery({ queryKey: ['orders'], queryFn: fetchOrders })
return <Table data={data} /> // crash nếu data undefined
```

---

## ✅ Checklist trước khi commit

Trước mỗi PR, tự kiểm tra:

- [ ] Không có `any` mới được thêm vào
- [ ] Enum/status mới đã được đặt trong `src/lib/schemas/`
- [ ] Validation dùng Zod, không viết thủ công
- [ ] API function mới nằm trong `src/lib/api/`
- [ ] Component không quá 200 dòng JSX
- [ ] Query keys dùng từ `queryKeys` constants
- [ ] Không có `console.log` sót lại
- [ ] Error state được xử lý (loading, empty, error)
- [ ] Types được infer từ Zod schema, không viết tay song song

---

> 📝 **Cập nhật lần cuối:** 2025 — Mọi thay đổi rule phải được team review và đồng thuận trước khi áp dụng.
