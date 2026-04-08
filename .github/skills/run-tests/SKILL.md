---
name: run-tests
description: 'Viết và chạy unit test cho VinhPhat App V2. Dùng khi: viết test, tạo test file, chạy test, fix test fail, test schema, test component, test hook, kiểm tra logic, coverage. Framework: Vitest + Testing Library.'
argument-hint: 'Tên feature hoặc file cần test, ví dụ: customers, suppliers, DashboardPage'
---

# Run Tests — VinhPhat App V2

## Khi nào dùng

- Viết unit test cho Zod schema, module logic, hoặc component React
- Chạy test suite hoặc test từng file
- Fix test bị fail
- Kiểm tra test coverage

---

## Stack & Config

| Item             | Chi tiết                                       |
| ---------------- | ---------------------------------------------- |
| **Framework**    | Vitest v2.1.9                                  |
| **DOM**          | jsdom + @testing-library/react v16.3.2         |
| **Matchers**     | @testing-library/jest-dom (toBeInTheDocument…) |
| **Config**       | Inline trong `vite.config.ts` → `test: {}`     |
| **Setup file**   | `src/test/setup.ts`                            |
| **Test pattern** | `src/**/*.test.{ts,tsx}`                       |

---

## Lệnh chạy test

```bash
npm run test           # Chạy tất cả test 1 lần
npm run test:watch     # Watch mode — tự chạy lại khi file thay đổi
npx vitest run src/features/customers/customers.module.test.ts  # Chạy 1 file
npx vitest run --reporter=verbose   # Output chi tiết từng test case
```

---

## Quy trình viết test

### 1. Xác định loại test

| Loại               | File đặt ở đâu                                               | Dùng khi                          |
| ------------------ | ------------------------------------------------------------ | --------------------------------- |
| **Schema test**    | `src/features/<name>/<name>.module.test.ts`                  | Test Zod schema, defaults, labels |
| **Component test** | `src/features/<name>/<Entity>Page.test.tsx` hoặc cùng folder | Test render, interaction          |
| **Hook test**      | `src/features/<name>/use<Entity>s.test.ts`                   | Test React Query hooks            |

### 2. Viết test file

#### Quy tắc đặt tên

- File test đặt **cùng folder** với file được test
- Tên: `<tên-file-gốc>.test.ts` hoặc `.test.tsx`

#### Import chuẩn

```typescript
// Schema test
import { describe, expect, it } from 'vitest';

// Component test
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
```

### 3. Chạy test & fix

```bash
npm run test           # Chạy toàn bộ
npx vitest run <path>  # Chạy 1 file cụ thể
```

Nếu test fail → đọc error message → sửa code hoặc test → chạy lại.

### 4. Verify không lỗi TypeScript

```bash
npm run typecheck
```

---

## Pattern mẫu

### Pattern 1: Schema Validation Test

Dùng cho file `*.module.ts` chứa Zod schema.

```typescript
import { describe, expect, it } from 'vitest';
import {
  STATUS_LABELS,
  entityDefaults,
  entitySchema,
} from '@/features/<name>/<name>.module';

describe('<name>.module', () => {
  it('accepts valid data', () => {
    const result = entitySchema.parse({
      code: 'XX-001',
      name: 'Tên hợp lệ',
      status: 'active',
      // ... các field bắt buộc
    });
    expect(result.code).toBe('XX-001');
  });

  it('trims whitespace on string fields', () => {
    const result = entitySchema.parse({
      code: '  XX-001  ',
      name: '  Tên  ',
      status: 'active',
    });
    expect(result.code).toBe('XX-001');
    expect(result.name).toBe('Tên');
  });

  it('accepts empty optional fields', () => {
    const result = entitySchema.parse({
      code: 'XX-002',
      name: 'Test',
      phone: '',
      email: '',
      status: 'active',
    });
    expect(result.phone).toBe('');
  });

  it('rejects missing required fields', () => {
    const result = entitySchema.safeParse({
      code: '',
      name: '',
    });
    expect(result.success).toBe(false);
  });

  it('validates enum fields', () => {
    const result = entitySchema.safeParse({
      ...entityDefaults,
      code: 'T1',
      name: 'Test',
      status: 'invalid_status',
    });
    expect(result.success).toBe(false);
  });

  it('keeps stable defaults and labels', () => {
    expect(entityDefaults.status).toBe('active');
    expect(STATUS_LABELS).toEqual({
      active: 'Hoạt động',
      inactive: 'Ngừng hoạt động',
    });
  });
});
```

### Pattern 2: Component Render Test

Dùng cho React component, cần mock Supabase.

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

// Mock Supabase — PHẢI đặt TRƯỚC import component
vi.mock('@/services/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({ count: 0, data: [], error: null }),
        data: [],
        error: null,
      }),
    }),
  },
  hasSupabaseEnv: () => true,
}))

import { MyPage } from '@/features/<name>/MyPage'

// Helper: wrap component trong providers cần thiết
function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  )
}

describe('MyPage', () => {
  it('renders the page heading', () => {
    renderWithProviders(<MyPage />)
    expect(
      screen.getByRole('heading', { name: 'Tiêu đề' }),
    ).toBeInTheDocument()
  })
})
```

---

## Quy tắc bắt buộc

- **Không dùng `any`** trong test — khai báo type rõ ràng
- **`vi.mock()` phải đặt TRƯỚC import** của module bị mock (Vitest hoists mock nhưng vẫn cần đúng thứ tự)
- **Mỗi `it()` test 1 hành vi** — không gộp nhiều assertion không liên quan
- **Dùng `safeParse`** khi test case lỗi (expect `success === false`), dùng `parse` khi test case hợp lệ
- **QueryClient mới cho mỗi test** — tránh cache ảnh hưởng giữa các test
- **`retry: false`** khi khởi tạo QueryClient trong test — không retry query thất bại
- **Tên test bằng tiếng Anh** — mô tả ngắn gọn hành vi đang test
- **Không mock quá sâu** — chỉ mock ở boundary (Supabase client), không mock internal function

---

## Checklist hoàn thành

- [ ] File test đặt cùng folder với file được test
- [ ] Import `describe, expect, it` (và `vi` nếu cần mock) từ `vitest`
- [ ] Tên describe = tên module/component
- [ ] Mỗi `it()` mô tả 1 hành vi cụ thể
- [ ] Test cả happy path và edge case (empty, invalid, missing)
- [ ] `vi.mock()` đặt trước import component (nếu có)
- [ ] `renderWithProviders` dùng `QueryClient({ defaultOptions: { queries: { retry: false } } })`
- [ ] Chạy `npm run test` pass hết
- [ ] Chạy `npm run typecheck` không lỗi
