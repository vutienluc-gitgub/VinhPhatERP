---
name: ui-ux-designer
description: UI/UX design rules cho VinhPhat App V2. Invoke khi: thiết kế UI, tạo component mới, viết CSS, đánh giá UX, hỏi về design system, accessibility.
---

# UI/UX Design — VinhPhat ERP

# VinhPhat ERP — UI/UX Rules (Mobile-first App System)

> Mục tiêu: đảm bảo toàn bộ UI/UX giống app thực sự (nhanh, rõ, dễ dùng),
> tối ưu cho nhân viên vận hành trên mobile.

---

## Rules

- **No overflow** — Tuyệt đối không cuộn ngang, không vỡ layout trên mọi màn hình.
- **Must be mobile-first** — Mọi thiết kế bắt đầu từ màn hình nhỏ nhất (320px).
- **Must use bottom sheet** — Dùng mô hình trượt từ đáy thay cho Modal truyền thống trên mobile.
- **User first** — mọi quyết định phải có lý do từ lợi ích người dùng
- **Accessible** — WCAG 2.1 AA tối thiểu, không thương lượng
- **Dệt may thực tế** — ưu tiên mật độ thông tin và đọc tốt dưới ánh sáng xưởng.
- **Consistent** — dùng design system có sẵn, không tạo style một lần.

## Design Tokens — CSS Variables & Tailwind CSS (Hybrid)

Dự án sử dụng mô hình **Hybrid**:
- **CSS Variables (Source of Truth)**: Định nghĩa các giá trị cốt lõi (màu sắc, bo góc, bóng) trong `src/styles/global.css`.
- **Tailwind CSS (Utilities)**: Dùng cho layout (flex, grid), spacing (padding, margin) và các tinh chỉnh nhanh.

### 1. CSS Variables (Design Tokens)
Định nghĩa trong `src/styles/global.css`:

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

### 2. Tailwind CSS Usage Guidelines

Dùng Tailwind để tăng tốc độ phát triển nhưng phải tuân thủ token hệ thống:

```tsx
// ✅ Đúng — Dùng tiện ích layout/spacing của Tailwind
<div className="flex flex-col gap-4 p-6 bg-[var(--surface-strong)]">

// ✅ Đúng — Dùng màu từ CSS variable qua bracket notation nếu cần màu cụ thể
<span className="text-[var(--primary)] font-semibold">

// ❌ Sai — Không dùng màu hex ngẫu nhiên của Tailwind hoặc hardcode
<div className="bg-blue-500 text-[#0b6bcb]">
```

### 3. Quy tắc bắt buộc khi dùng token
Dù dùng CSS thuần hay Tailwind, luôn phải tham chiếu đến Variable:

```css
/* ✅ Đúng trong file .css */
color: var(--primary);
background: var(--surface-strong);
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
| `.modal-overlay` / `.modal-sheet` | Bottom Sheet (Mobile) / Modal (Desktop) |
| `.sheet-header` / `.sheet-body` / `.sheet-footer` | Cấu trúc Bottom Sheet |
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

- **Khoảng cách an toàn**: Mọi phần tử click được (button, input) phải cách nhau tối thiểu **8px** (`gap: 0.5rem`) để tránh bấm nhầm khi tay to hoặc đang đeo găng tay.

---

## Form & Input (Step-based & Bottom Sheet)

### Quy tắc cơ bản
- **Bắt buộc dùng Bottom Sheet**: Đối với mọi phân hệ nhập liệu trên mobile.
- **Giới hạn 1 màn hình**: Form không được dài quá chiều cao màn hình di động. 
- **Chia để trị (Divide & Conquer)**: Form nhiều dữ liệu PHẢI chia thành các bước (VD: Bước 1: Thông tin chung; Bước 2: Kỹ thuật; Bước 3: Nguồn gốc).

### Tương tác Phân bước (Step-based Interaction)
- **Nút "Tiếp tục" (Next)**: Dùng cho các bước trung gian (`btn-primary` ở góc phải).
- **Nút "Quay lại" (Back)**: Luôn hiển thị ở bên trái (`btn-secondary`) khi từ Bước 2 trở đi.
- **Nút "Lưu/Xác nhận"**: Chỉ xuất hiện ở bước cuối cùng để hoàn tất giao dịch.
- **Xác thực từng bước**: Phải kiểm tra lỗi (validation) của bước hiện tại TRƯỚC KHI cho phép nhấn "Tiếp tục".
- **Chỉ báo tiến trình (Progress Indicator)**: Bắt buộc có (Ví dụ: "Bước 2/3" hoặc thanh Progress Bar mỏng trên đỉnh Sheet).

---

## Select & Dropdown (Searchable Combobox)

### Nguyên tắc bắt buộc
- **Cấm dùng `<select>` HTML**: Trừ phi tập dữ liệu cực kỳ nhỏ (< 5 mục ổn định như Yes/No, Gender).
- **Phải có Tìm kiếm (Searchable)**: Mọi dropdown chứa dữ liệu nghiệp vụ (Khách hàng, Sợi, Vải...) đều phải có ô tìm kiếm.
- **Thư viện tiêu chuẩn**: Sử dụng **shadcn/ui Combobox** (kết hợp Radix UI Popover + Command).

### Quy tắc Tìm kiếm (Filtering)
Lọc kết quả ĐỒNG THỜI theo:
- **Tên** (Name)
- **Mã** (Code / ID)
- **Số điện thoại** (Phone) — nếu là khách hàng/nhà cung cấp.
- **Highlight**: In đậm các ký tự khớp với từ khóa trong danh sách kết quả.

### Tương tác & Mobile
- **Quick Create**: Nếu tìm kiếm không ra kết quả (`No results found`), hiển thị nút **"+ Thêm mới [Tên đang gõ]"** ngay dưới đáy để mở Bottom Sheet tạo nhanh.
- **Mobile optimization**: Trên màn hình nhỏ, Combobox Popover phải hành xử như một **Bottom Sheet** (trượt từ đáy lên) để dễ dàng thao tác bằng một tay, thay vì treo lơ lửng giữa màn hình.

---

## ADVANCED — Mobile Interaction (App-like Experience)

### Swipe & Pull Gestures
- **Pull-to-refresh**: Phải có trên mọi danh sách dữ liệu quan trọng (Đơn hàng, Kho).
- **Swipe Actions**: Hỗ trợ vuốt trái/phải trên các thẻ danh sách (List items) cho các hành động nhanh.

### Visual States
- **Skeleton Screens (Shimmer)**: Dùng thay cho icon loading xoay tròn truyền thống. Phải mô phỏng được cấu trúc của nội dung thật.
- **Empty States**: Không hiển thị màn hình trống không; phải có icon minh họa và một nút hành động kèm theo.

### Feedback
- **Haptic Feedback**: Sử dụng bộ rung hệ thống (Vibration API) để xác nhận khi quét mã vạch đúng hoặc lưu form thành công.
- **Infinite Scroll**: Ưu tiên tải dữ liệu tự động thay cho phân trang kiểu cũ khi chạm đáy màn hình.

---

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

---

## Navigation

### Mobile (📱)
- **Bắt buộc dùng Bottom Navigation**: Luôn hiển thị ở đáy màn hình cho các mục chính.
- **Fixed bottom**: Vị trí luôn cố định, không trôi theo nội dung.
- **Không dùng top menu**: Header chỉ dành cho tên trang và các hành động ngữ cảnh (Contextual actions).
- **Z-Index**: Phải cao hơn mọi nội dung khác (`z-index: 100`).

### Desktop (💻)
- **Sidebar bên trái**: Chứa danh mục chức năng phân tầng.
- **Có thể collapse**: Thu gọn sidebar để tối ưu không gian cho các bảng dữ liệu chuyên sâu.
- **Micro-animations**: Hiển thị text nhãn khi rê chuột qua (tooltip) nếu sidebar đang ở trạng thái thu gọn.

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
- Bottom Sheet / Modal mở: **250–320ms** (dùng `cubic-bezier(0.16, 1, 0.3, 1)`)
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

| `backdrop-filter: blur()`               | Tốn CPU — máy cũ tại xưởng dệt |
| Hardcode màu hex (ngoài token)         | Phá vỡ design system           |
| `outline: none` không có focus thay thế | Vi phạm accessibility          |
| Cuộn ngang trên mobile                  | Trải nghiệm người dùng tệ      |
| Animate `width`/`height`/`margin`       | Gây reflow, giật               |
| Emoji icon đơn không có `aria-label`    | Không accessible               |
| Placeholder thay label                  | Vi phạm WCAG                   |

---

## Checklist trước khi commit UI mới

- [ ] Không tràn ngang
- [ ] Dùng được bằng 1 tay
- [ ] Có feedback cho mọi action
- [ ] Form không quá dài
- [ ] UI rõ ràng, không gây nhầm lẫn
- [ ] Mọi input có `<label htmlFor>` kèm
- [ ] Nút submit có `disabled={isPending}` và text loading
- [ ] Lỗi validation hiện dưới field, không phải toast
- [ ] Table bọc trong `.data-table-wrap`
- [ ] Không có `backdrop-filter` hay màu hex hardcode
- [ ] Emoji icon đơn độc có `aria-label`
- [ ] Test Tab navigation qua form
- [ ] Kiểm tra trên mobile 375px
