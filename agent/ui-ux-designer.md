---
name: ui-ux-designer
description: UI/UX design rules cho VinhPhat App V2. Invoke khi: thiết kế UI, tạo component mới, viết CSS, đánh giá UX, hỏi về design system, accessibility.
---

# UI/UX Design — VinhPhat App V2

File duy nhất, chuẩn mực cho mọi quyết định thiết kế trong dự án.
Áp dụng cho mọi `component`, `page`, `form`, `modal` trong `src/`.

---

## Nguyên tắc cốt lõi

- **User first** — mọi quyết định phải có lý do từ lợi ích người dùng
- **Accessible** — WCAG 2.1 AA tối thiểu, không thương lượng
- **Mobile-first** — thiết kế cho màn nhỏ trước, mở rộng ra desktop
- **Dệt may thực tế** — ưu tiên mật độ thông tin và đọc tốt dưới ánh sáng xưởng, không ưu tiên thẩm mỹ
- **Consistent** — dùng design system có sẵn, không tạo style một lần

---

## Design Tokens — CSS Variables (KHÔNG dùng Tailwind)

Dự án dùng **thuần CSS variables**, định nghĩa trong `src/styles/global.css`.

```css
:root {
  /* Màu sắc */
  --primary: #0b6bcb; /* Nút chính, active state */
  --primary-strong: #084f97; /* Hover trên primary */
  --accent: #0fa67a; /* Badge thành công, trạng thái OK */
  --text: #10233d; /* Chữ chính — navy đậm */
  --muted: #61758f; /* Chữ phụ, label, placeholder */
  --surface: rgba(255, 255, 255, 0.86); /* Nền card (legacy) */
  --surface-strong: #ffffff; /* Nền đặc — dùng thay --surface */
  --border: rgba(16, 35, 61, 0.1); /* Viền mềm */

  /* Bo góc */
  --radius-lg: 24px;
  --radius-md: 18px;
  --radius-sm: 12px;

  /* Bóng */
  --shadow: 0 16px 40px rgba(16, 35, 61, 0.08);

  /* Font */
  font-family: "Segoe UI", "Helvetica Neue", sans-serif;
  font-size: 16px;
  line-height: 1.5;
}
```

### Quy tắc bắt buộc khi dùng token

```css
/* ✅ Đúng */
color: var(--primary);
background: var(--surface-strong);

/* ❌ Sai — không hardcode màu hex trong component/feature */
color: #0b6bcb;
```

---

## Responsive Breakpoints

```
Mobile:   320px – 767px    ← thiết kế ở đây trước
Tablet:   768px – 1023px
Desktop:  1024px+
Max width content: min(1120px, 100%)
```

---

## CSS Class Conventions

Dùng đúng class có sẵn trong `data-ui.css` và `app-shell.css`. **Không** tạo inline style cho spacing, color, border-radius:

```tsx
// ✅
<div className="form-field">
<div className="data-table-wrap">
<button className="primary-button">
<button className="btn-secondary">

// ❌
<div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
```

Các class chính:
| Class | Dùng cho |
|---|---|
| `.primary-button` | Nút hành động chính |
| `.btn-secondary` | Nút phụ |
| `.btn-icon` | Nút chỉ có icon |
| `.form-field` | Wrapper label + input |
| `.field-input` / `.field-select` / `.field-textarea` | Input fields |
| `.field-error` | Thông báo lỗi dưới field |
| `.data-table` / `.data-table-wrap` | Bảng dữ liệu |
| `.filter-bar` | Thanh bộ lọc |
| `.modal-overlay` / `.modal-sheet` | Modal |
| `.panel-card` | Card nội dung chính |
| `.table-empty` | Trạng thái rỗng / loading |

---

## CRITICAL — Accessibility

### color-contrast

Tương phản tối thiểu **4.5:1** (WCAG AA). Kiểm tra tại https://webaim.org/resources/contrastchecker/

- ✅ `--text` (`#10233d`) trên trắng → ~14:1
- ⚠ `--muted` (`#61758f`) trên trắng → kiểm tra trước khi dùng cho text nhỏ
- ❌ Không dùng màu hex tự chọn ngoài token cho text nội dung

### focus-states

Mọi phần tử tương tác PHẢI có focus ring. Pattern dự án:

```css
/* Đã có trong data-ui.css — không xóa */
.field-input:focus,
.field-select:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(11, 107, 203, 0.12);
}

/* Thêm cho button/link nếu tạo mới */
:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
```

### form-labels

Mọi `<input>`, `<select>`, `<textarea>` phải có `<label>` với `htmlFor` trỏ đúng `id`:

```tsx
// ✅
<label htmlFor="fabric_type">Loại vải <span className="field-required">*</span></label>
<input id="fabric_type" ... />

// ❌ — placeholder không thay thế được label
<input placeholder="Loại vải" ... />
```

### keyboard-nav

- Thứ tự Tab: trái → phải, trên → xuống
- Modal/drawer khi mở: trap focus bên trong
- Modal/drawer khi đóng: trả focus về trigger
- `Escape` phải đóng modal/drawer
- ARIA đã dùng: `role="dialog" aria-modal="true" aria-labelledby` — giữ nguyên

### alt-text & ARIA

- `<img>` có nội dung: `alt="mô tả"`; ảnh trang trí: `alt=""`
- Icon đơn độc không có text: `aria-label="Xóa"` hoặc `aria-hidden="true"` kèm text ẩn
- Status messages: `role="status"` hoặc `role="alert"`

---

## CRITICAL — Touch & Tương tác

### touch-target

Vùng chạm tối thiểu **44×44px**:

```css
.primary-button {
  min-height: 48px;
} /* ✅ */
.btn-secondary {
  min-height: 40px;
} /* ⚠ chấp nhận */
.btn-icon {
  min-width: 44px;
  min-height: 44px;
} /* ✅ bắt buộc */
```

### cursor-pointer

Mọi phần tử click được phải có `cursor: pointer`. Button HTML tự có — cần thêm cho `div`/`span` click được.

### hover-feedback

Mọi nút/card tương tác phải có transition:

```css
transition: 160ms ease; /* Pattern chuẩn — không thay đổi */
```

### loading-buttons

Khi form đang submit:

```tsx
<button disabled={isPending}>
  {isPending ? "Đang lưu..." : "Lưu thay đổi"}
</button>
```

### error-feedback

- Lỗi validation → `.field-error` ngay dưới field
- Lỗi server (`mutation.error`) → text đỏ trên form, trước nút submit
- **Không** dùng toast cho lỗi nghiệp vụ quan trọng — user phải thấy ngay

---

## HIGH — Layout & Responsive

### no-horizontal-scroll

Không bao giờ để trang cuộn ngang trên mobile:

- Table nhiều cột: bọc trong `.data-table-wrap` (`overflow-x: auto`)
- Tránh `width` cố định vượt viewport

### loading & empty state

Mọi async UI cần 3 trạng thái:

```tsx
// 1. Loading
{
  isLoading && <p className="table-empty">Đang tải...</p>;
}

// 2. Empty
{
  !isLoading && data.length === 0 && (
    <p className="table-empty">
      Chưa có dữ liệu. Nhấn "+ Thêm mới" để bắt đầu.
    </p>
  );
}

// 3. Error
{
  error && <p className="error-inline">Lỗi: {error.message}</p>;
}
```

### Navigation

- Max **7 items** trên nav (Miller's Law) — hiện tại đã đạt giới hạn
- Mobile: bottom tab bar — đang dùng `.mobile-nav`
- Active state: class `.is-active` trên `.nav-link` / `.mobile-nav-link`

---

## HIGH — Typography

### font-weight hierarchy

```
Heading:       font-weight: 700
Label/UI text: font-weight: 600
Body:          font-weight: 400
```

### font-size rules

- Body text tối thiểu **16px** (`html { font-size: 16px }`)
- Table cell: `0.9rem` (14.4px) — chấp nhận trong bảng dữ liệu dày
- Hint/meta text: tối thiểu `0.78rem` — không nhỏ hơn

### line-height

- Body text: `1.5` (đã set ở `:root`)
- Heading: `1.1–1.2`

### line-length

Đoạn văn mô tả dài: `max-width: 65ch`

---

## MEDIUM — Animation

### duration

- Micro-interaction (hover, focus): **150–200ms**
- Modal/drawer mở: **200–280ms**
- Không vượt **350ms** cho animation UI thường

### transform-only

Chỉ animate `transform` và `opacity`:

```css
/* ✅ */
transform: translateY(8px); opacity: 0;

/* ❌ — gây reflow, giật trên mobile yếu */
height: 0 → height: auto;
```

### reduced-motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## MEDIUM — Icon & Hình ảnh

### icon-system

- Emoji (`✏️`, `🗑`, `📊`) được dùng trong dự án — nếu thêm icon mới phải cùng style
- Nếu chuyển sang SVG icon: dùng **Lucide React** làm thư viện duy nhất
- Không trộn emoji + SVG icon + icon font trong cùng một màn hình

### emoji làm icon

```tsx
// ✅ — emoji kèm text label
<button>📊 Excel</button>

// ❌ — emoji đơn không có text, không accessible
<button>🗑</button>

// ✅ — sửa lại
<button aria-label="Xóa">🗑</button>
```

### image-optimization

- Dùng WebP cho ảnh nội dung
- `loading="lazy"` cho ảnh dưới fold
- Logo và icon: SVG

---

## Quy tắc cấm tuyệt đối

| Cấm                                     | Lý do                          |
| --------------------------------------- | ------------------------------ |
| `backdrop-filter: blur()`               | Tốn CPU — máy cũ tại xưởng dệt |
| Hardcode màu hex trong component        | Phá vỡ design system           |
| `outline: none` không có focus thay thế | Vi phạm accessibility          |
| Cuộn ngang trên mobile                  | Trải nghiệm người dùng tệ      |
| Animate `width`/`height`/`margin`       | Gây reflow, giật               |
| Emoji icon đơn không có `aria-label`    | Không accessible               |
| Placeholder thay label                  | Vi phạm WCAG                   |

---

## Checklist trước khi commit UI mới

- [ ] Mọi input có `<label htmlFor>` kèm
- [ ] Nút submit có `disabled={isPending}` và text loading
- [ ] Lỗi validation hiện dưới field, không phải toast
- [ ] Table bọc trong `.data-table-wrap`
- [ ] Không có `backdrop-filter` hay màu hex hardcode
- [ ] Emoji icon đơn độc có `aria-label`
- [ ] Test Tab navigation qua form
- [ ] Kiểm tra trên mobile 375px
