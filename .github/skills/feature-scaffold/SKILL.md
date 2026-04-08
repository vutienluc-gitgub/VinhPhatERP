---
name: feature-scaffold
description: 'Tạo module feature mới theo chuẩn VinhPhat App V2. Dùng khi: scaffold feature, tạo tính năng mới, thêm module, viết feature từ đầu, tạo page mới trong features/. Bao gồm: types, Zod schema, React Query hook, Form, List, Page, index barrel.'
argument-hint: 'Tên feature, ví dụ: yarn-receipts, raw-fabric, suppliers'
---

# Feature Scaffold — VinhPhat App V2

## Khi nào dùng

- Tạo module business mới dưới `src/features/<feature-name>/`
- Thêm route mới vào ứng dụng
- Cần scaffold nhanh đủ bộ file theo chuẩn project

---

## Quy trình (thực hiện lần lượt)

### 1. Thu thập yêu cầu

Hỏi hoặc xác nhận:

- `featureName` — tên kebab-case (ví dụ: `yarn-receipts`)
- `EntityName` — tên PascalCase entity chính (ví dụ: `YarnReceipt`)
- `tableName` — tên bảng trong Supabase (ví dụ: `yarn_receipts`)
- Các trường/fields chính của entity

### 2. Tạo file theo đúng thứ tự

Tạo đủ **6 file** sau trong `src/features/<featureName>/`:

| File                      | Mục đích                                         |
| ------------------------- | ------------------------------------------------ |
| `types.ts`                | TypeScript type cho entity từ DB                 |
| `<featureName>.module.ts` | Zod schema, form defaults, `FeatureDefinition`   |
| `use<EntityName>s.ts`     | React Query hooks (list, create, update, delete) |
| `<EntityName>Form.tsx`    | Modal/drawer form với React Hook Form            |
| `<EntityName>List.tsx`    | Danh sách có search, filter, empty state         |
| `<EntityName>Page.tsx`    | Route-level page, kết hợp List + Form            |
| `index.ts`                | Barrel export tất cả public API                  |

### 3. Đăng ký route

- Mở `src/app/router/routes.tsx` (hoặc `AppRouter.tsx`)
- Thêm import lazy và route path `/<featureName>`

### 4. Kiểm tra lỗi

Chạy hoặc gọi `get_errors` trên `src/` để đảm bảo không có lỗi TypeScript.

---

## Cấu trúc file chi tiết

Xem [templates](./references/file-templates.md) để biết nội dung mẫu từng file.

---

## Quy tắc bắt buộc (từ CODING_RULES.md)

- **Không dùng `any`** — khai báo kiểu rõ ràng cho tất cả props, params, return
- **1 file = 1 component** — không gộp nhiều component vào 1 file
- **Không import chéo** giữa các `features/` — chỉ import từ `shared/` hoặc `services/`
- `index.ts` là **barrel export duy nhất** được import từ bên ngoài feature
- **Tách logic khỏi UI**: React Query hook riêng, component chỉ render

---

## Pattern mẫu — customers feature

Tham khảo `src/features/customers/` làm chuẩn vàng:

```
src/features/customers/
├── index.ts                  ← barrel export
├── types.ts                  ← Customer type từ DB
├── customers.module.ts       ← customersSchema (Zod) + customersFeature
├── useCustomers.ts           ← useCustomerList, useCreateCustomer, ...
├── CustomerForm.tsx          ← form tạo/sửa
├── CustomerList.tsx          ← danh sách + search
└── CustomersPage.tsx         ← route page
```

---

## Checklist hoàn thành

- [ ] `types.ts` có đủ field từ DB (id, created_at, updated_at, ...)
- [ ] Schema Zod cover hết các trường form, có validation message tiếng Việt
- [ ] `defaultValues` cho toàn bộ trường, không để `undefined`
- [ ] `FeatureDefinition` export với `key`, `route`, `title`, `description`
- [ ] Hook dùng `useQuery` + `useMutation` với `queryClient.invalidateQueries`
- [ ] Form dùng `useForm<FormValues>` với `zodResolver`
- [ ] Page render `List` + `Form`, quản lý state `showForm` / `editItem`
- [ ] `index.ts` re-export tất cả public symbols
- [ ] Route đã được thêm vào router
- [ ] `get_errors` trả về 0 lỗi
