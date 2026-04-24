# Responsive Rules — Rule Book

> Bộ quy tắc bắt buộc tuân thủ cho mọi giao diện trong VinhPhatERP.
> Mục tiêu: **Không bao giờ để layout bị tràn ngang (horizontal overflow) trên mobile.**

---

## R1 — Page Container Safety Net

Mọi trang (page-level component) **phải** sử dụng class `.page-container` và kết hợp utility classes:

```tsx
<div className="page-container p-4 md:p-6 overflow-x-hidden">
```

- `p-4` trên mobile, `md:p-6` trên tablet/desktop.
- `overflow-x-hidden` để ngăn bất kỳ child nào vô tình đẩy layout tràn ngang.
- `.page-container` đã được định nghĩa trong `@/styles/data-ui.css` với `min-width: 0` và responsive padding.

---

## R2 — No Fixed Width Without Responsive Fallback

**Cấm** sử dụng width cố định (`w-64`, `w-48`, `w-[300px]`, …) trong layout flex/grid mà không có cơ chế xếp chồng (stacking) hoặc co giãn trên màn hình nhỏ.

❌ **Sai:**

```tsx
<div className="flex items-center">
  <div className="w-64">...</div> {/* Tràn ngang trên mobile */}
  <div className="w-48">...</div>
</div>
```

✅ **Đúng:**

```tsx
<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
  <div className="w-full sm:w-64">...</div>
  <div className="w-full sm:w-48">...</div>
</div>
```

---

## R3 — Flex Row Must Allow Shrinking

Mọi container `display: flex` với nhiều item ngang **phải** có ít nhất một trong các cơ chế:

- `flex-wrap` (cho phép xuống dòng)
- `min-w-0` trên flex item kết hợp `truncate`/`overflow-hidden`
- Chuyển sang `flex-col` ở breakpoint nhỏ (`flex-col sm:flex-row`)

❌ **Sai:**

```tsx
<div className="flex items-center justify-between gap-2">
  <span className="font-bold">{longText}</span>
  <span className="badge">Status</span>
</div>
```

✅ **Đúng:**

```tsx
<div className="flex items-center justify-between gap-2 min-w-0">
  <span className="font-bold truncate min-w-0">{longText}</span>
  <span className="badge shrink-0">Status</span>
</div>
```

---

## R4 — Tab Bars Must Scroll Internally on Mobile

Các thanh tab có nhiều item (`TabSwitcher` variant `premium`, `underline`, `pill`) **phải** có cơ chế scroll ngang nội bộ khi không đủ chỗ, thay vì bị cắt cụt bởi parent `overflow: hidden`.

Yêu cầu CSS:

```css
.tab-bar-x {
  max-width: 100%;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
```

Item tab phải có `flex-shrink: 0` hoặc `white-space: nowrap` phù hợp.

---

## R5 — KPI Cards Must Auto-Fit, Never Overflow

Grid chứa KPI cards **phải** sử dụng `auto-fit` + `minmax()` thay vì fixed columns:

```css
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
}
```

Hoặc nếu dùng Tailwind utility:

```tsx
<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
```

Không bao giờ để card bị đẩy lệch sang phải hoặc tạo scroll ngang.

---

## R6 — Layout Must Not Break with Long Text

Theo `coding-standards.md`, giao diện **phải** chịu được text dài hơn 100 ký tự mà không bị vỡ layout.

Các biện pháp bắt buộc:

- `min-w-0` trên flex/grid item chứa text dài.
- `truncate`, `overflow-hidden text-ellipsis whitespace-nowrap` khi cần.
- `word-break: break-word` cho đoạn text tự do (paragraph, description).
- Test với dummy text "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." (hơn 100 chars).

---

## R7 — Test Checklist Before Commit

Trước khi commit bất kỳ thay đổi UI nào, kiểm tra:

- [ ] Mở Chrome DevTools → Device Toolbar (iPhone SE ~375px).
- [ ] Kiểm tra **không có thanh scroll ngang** (body `overflow-x: hidden` hoạt động).
- [ ] Kiểm tra tab bar có thể vuốt ngang nếu có nhiều tab.
- [ ] Kiểm tra text dài không đẩy layout.
- [ ] Kiểm tra ở `sm` (640px), `md` (768px), `lg` (1024px) — layout không bị vỡ.

---

## Vi phạm nghiêm trọng

Bất kỳ commit nào gây ra **horizontal scroll ngang không chủ đích** trên mobile sẽ bị coi là:

- Vi phạm nguyên tắc **"Layout must not break"**.
- Vi phạm tiêu chuẩn **"Premium / State of the art"**.
- Yêu cầu revert hoặc hot-fix ngay lập tức.
