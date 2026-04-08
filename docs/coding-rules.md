# Coding Rules (Single Source of Truth)

This is the ONLY file that defines coding standards.
Do not use any other file for code rules.

# VinhPhat App V2 — Quy tắc lập trình

> Tài liệu này định nghĩa các quy tắc bắt buộc và khuyến nghị cho dự án.
> Mọi thành viên và AI assistant đều phải tuân theo.

---

## Priority

This file has higher priority than any other coding-related document.

All code must follow this file strictly.

## 1. TypeScript — tránh lỗi kiểu dữ liệu

**Bắt buộc bật trong `tsconfig.app.json`:**

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
  },
}
```

| Quy tắc                                               | Lý do                                         |
| ----------------------------------------------------- | --------------------------------------------- |
| Không dùng `any`                                      | Mất hoàn toàn lợi ích của TypeScript          |
| Không dùng `as` ép kiểu tuỳ tiện                      | Che giấu lỗi, gây crash runtime               |
| Khai báo kiểu rõ ràng cho props, params, return value | Dễ đọc, dễ refactor                           |
| Xử lý trường hợp `null` / `undefined` trước khi dùng  | Tránh lỗi "Cannot read property of undefined" |

---

## 2. ESLint — bắt lỗi logic và style

**Các rule bắt buộc:**

```js
rules: {
  "no-console": "warn",
  "no-unused-vars": "error",
  "@typescript-eslint/no-explicit-any": "error",
  "react-hooks/rules-of-hooks": "error",
  "react-hooks/exhaustive-deps": "warn",
  "eqeqeq": ["error", "always"],
}
```

- Chạy `npm run lint` trước mỗi lần commit
- Không tắt ESLint rule bằng `// eslint-disable` mà không có lý do ghi rõ

---

## 3. Git — tránh mất code và commit lỗi

**Đặt tên branch:**

```
feat/ten-tinh-nang      # thêm tính năng mới
fix/mo-ta-loi           # sửa lỗi
chore/ten-viec          # cập nhật dep, config, tài liệu
```

**Quy tắc commit:**

- Mỗi commit chỉ làm **một việc** duy nhất
- Tiêu đề commit ngắn gọn, rõ ý (ví dụ: `feat: thêm màn hình danh sách khách hàng`)
- Không commit file `.env.local`, `node_modules`, build output

**Dùng Husky để chặn commit lỗi:**

```bash
npm install -D husky lint-staged
```

Cấu hình: trước mỗi `git commit` → chạy `typecheck` + `lint` tự động → nếu lỗi thì không cho commit.

---

## 4. Cấu trúc file — tránh rối loạn khi dự án lớn

| Quy tắc                                | Đúng                                               | Sai                                              |
| -------------------------------------- | -------------------------------------------------- | ------------------------------------------------ |
| 1 file = 1 component                   | `CustomerList.tsx`                                 | nhiều component trong 1 file                     |
| Tên file = tên component chính         | `CustomerCard.tsx`                                 | `card.tsx`                                       |
| Không import chéo giữa các `features/` | —                                                  | `features/orders` import từ `features/customers` |
| Dùng `index.ts` làm barrel export      | `features/customers/index.ts` re-export public API | import tận file con từ bên ngoài                 |
| Tách logic khỏi UI                     | hook riêng, component chỉ render                   | fetch API trực tiếp trong JSX                    |

**Cấu trúc chuẩn mỗi feature:**

```
features/customers/
├── index.ts               # public API của module
├── CustomerListPage.tsx   # trang (route-level component)
├── CustomerCard.tsx        # UI component
├── useCustomers.ts         # hook dữ liệu (React Query)
├── customers.schema.ts     # Zod schemas
└── customers.types.ts      # TypeScript types
```

---

## 5. Xử lý dữ liệu — tránh lỗi runtime

- **Luôn validate dữ liệu từ bên ngoài bằng Zod** — dù từ API, form, URL params, hay localStorage
- **Không tin tưởng kiểu trả về của Supabase** — luôn parse qua Zod schema sau khi fetch
- **Không mutate state trực tiếp** — dùng spread `{ ...obj }` hoặc `[...arr]`
- **Xử lý đủ 3 trạng thái cho mọi async call**: loading / error / success
- **Không để số tiền là `float`** — dùng `numeric` ở DB, xử lý bằng số nguyên (đồng) ở frontend nếu cần

---

## 6. Bảo mật — OWASP Top 10

| Rủi ro                | Quy tắc bắt buộc                                                  |
| --------------------- | ----------------------------------------------------------------- |
| SQL Injection         | Dùng Supabase client — **tuyệt đối không nối chuỗi SQL thủ công** |
| XSS                   | Không dùng `dangerouslySetInnerHTML`                              |
| Broken Access Control | Mọi bảng đều phải bật RLS và có policy rõ ràng                    |
| Secrets lộ            | Không commit `.env*`, chỉ dùng `VITE_` prefix cho biến public     |
| Phụ thuộc lỗi thời    | Chạy `npm audit` định kỳ, cập nhật dep mỗi sprint                 |
| Service key lộ        | **Không bao giờ** dùng `service_role` key ở frontend              |

---

## 7. Supabase — quy tắc riêng

- **Migration là one-way**: không sửa file migration đã chạy, tạo file mới để thay đổi schema
- **Đặt tên migration rõ ràng**: `0002_add_fabric_color_index.sql`
- **Mọi thay đổi schema đều qua migration** — không dùng Supabase Dashboard để sửa trực tiếp
- **Tận dụng RLS thay vì filter ở frontend** — không thay thế policy bằng `.eq('user_id', uid)` ở client
- **Không expose anon key lên Git** nếu project là public repo

---

## 8. Quy tắc khi dùng AI để viết code

- **Đọc hiểu toàn bộ code trước khi chấp nhận** — AI hay bỏ sót edge cases
- **Chạy `npm run typecheck` sau mỗi lần AI sửa code**
- **Không copy khối code lớn mà không hiểu** — chia nhỏ, kiểm tra từng phần
- **Yêu cầu AI giải thích** nếu có đoạn không rõ trước khi chạy
- **AI không được phép xoá file hoặc thay đổi schema** mà không có xác nhận rõ ràng
- **Luôn trả lời và ghi vào các file trong docs bằng tiếng việt có dấu và phong cách dễ hiểu cho người non-tech**
- **Luôn suy luận logic theo flow, theo nghiệp vụ sản xuất, thương mại B2B ngành dệt may**
- **Không dùng màu Tailwind trực tiếp (gray-_, blue-_)**
- **Chỉ dùng design token (border-border, bg-background…)**
- **Không viết raw input/button → dùng component system**
- **Mọi UI phải mobile-first**

---

## 9. UI & CSS Standards (Anti-guessing Layout)

- **CSS Framework**: Tuyệt đối KHÔNG dùng TailwindCSS, Bootstrap hay đoán utility classes (như `p-4`, `space-y`).
- **Audit Requirement**: Trước khi code UI, Model PHẢI dùng `view_file` xem `src/index.css` để lấy mã màu (`--primary`, `--surface`, `--border-color`) và các class chuẩn.
- **Allowed Components/Classes**:
  - **Inputs**: Bắt buộc dùng `.field-input`.
  - **Buttons**: Dùng `.primary-button` (nút chính), `.btn-secondary` (nút phụ), `.btn-icon`.
  - **Cards**: Dùng `.surface`, `.border-color` để tạo khối.
- **AdaptiveBottomSheet**:
  - Không thiết kế ad-hoc trong sheet.
  - Sử dụng `.modal-content` cho phần nội dung chính.
  - Phải dùng `display: flex/grid` với `gap` rõ ràng để layout cân đối trên Mobile.
- **Touch Targets**: Các Card có thể click (như chọn vải) phải có padding tối thiểu `12px` và border rõ ràng.
- **Rules Over Style**: Ưu tiên tính nhất quán của hệ thống UI hiện tại hơn là tự sáng tạo style mới.

---

## 10. Thứ tự ưu tiên triển khai

```
✅ Đã làm    strict TypeScript config
✅ Đã làm    Schema database với RLS đầy đủ

🔜 Tiếp theo
  Tuần 1     ESLint + no-any rule
  Tuần 1     Husky + lint-staged (chặn commit lỗi)
  Tuần 2     Zod schemas cho mọi Supabase response
  Sau MVP    Vitest unit tests cho logic nghiệp vụ
  Sau MVP    npm audit tự động trong CI
```

---

## 10. Lệnh kiểm tra nhanh

```bash
# Kiểm tra lỗi TypeScript
npm run typecheck

# Kiểm tra lỗi ESLint
npm run lint

# Kiểm tra lỗ hổng bảo mật trong dependencies
npm audit

# Chạy toàn bộ tests
npx vitest run
```
