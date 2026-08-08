# Icon System Context & Source Code Policy

## 1. Source Code Policy (Architecture Guard)

VinhPhatERP sử dụng cơ chế bảo vệ 3 tầng (Developer -> ESLint Architecture Guard -> CI/CD) để ngăn chặn các vi phạm về cấu trúc source code.

### 🚫 Emoji: FORBIDDEN

**TUYỆT ĐỐI KHÔNG SỬ DỤNG Emoji trực tiếp trong source code** (bao gồm Literal, JSXText, TemplateLiteral).

- Áp dụng cho MỌI loại Emoji (Unicode Extended Pictographic).
- Áp dụng cho cả các Emoji sequence phức tạp (chứa ZWJ, skin-tone modifiers, variation selectors).
- _Lý do: Đảm bảo tính nhất quán của UI, không phụ thuộc vào hệ điều hành render, và giữ codebase sạch sẽ chuyên nghiệp._

### 🎨 Icons: REQUIRED

- Bắt buộc sử dụng component `<Icon />` (lucide-react) cho mọi nhu cầu hiển thị biểu tượng.
- Xem chi tiết ở phần Usage Rule.

### 🔴 Status/Badges: REQUIRED

- KHÔNG dùng Emoji để biểu diễn trạng thái (ví dụ 🔴, 🟢).
- Bắt buộc sử dụng các component chuẩn hóa (VD: `<VPStatusBadge />`).

---

## 2. Icon Library

We use: **lucide-react**

### DO NOT

- Do NOT use heroicons
- Do NOT use fontawesome
- Do NOT inline SVG icons

### Usage Rule

- ALWAYS use `<Icon />` component from: `src/components/ui/Icon.tsx`
- NEVER import directly from `lucide-react` (đã bị chặn bởi ESLint `no-restricted-imports`).

### Default Style

- size: 20
- strokeWidth: 1.5
- color: currentColor

---

## 3. Semantic Mapping

| Feature   | Icon name |
| --------- | --------- |
| dashboard | home      |
| orders    | package   |
| products  | layers    |
| customers | users     |
| reports   | bar-chart |
| settings  | settings  |

---

## 4. Examples

✅ **Preferred (Architecture Guard passed):**

```tsx
<span>
  <Icon name="package" /> Nhập kho
</span>

<VPStatusBadge domain="INVENTORY" status="PENDING" />

<Button>
  <Icon name="save" />
  Lưu
</Button>
```

❌ **Forbidden (Bị chặn bởi ESLint Error):**

```tsx
<span>📦 Nhập kho</span>
<span>🔴 Chưa xử lý</span>
<button>💾 Lưu</button>
import { Package } from "lucide-react";
<Package />
```
