# WCAG 2.1 AA/AAA Accessibility & Contrast Standards

**Owner:** Architecture & UI/UX Guild | **Scope:** VinhPhatERP v3 (`src/`)

---

## 1. Core Principles & Thresholds

Mọi giao diện người dùng (UI) trong VinhPhatERP phải tuân thủ nghiêm ngặt chuẩn tiếp cận **W3C Web Content Accessibility Guidelines (WCAG) 2.1**:

| Loại phần tử                                            | Ngưỡng tối thiểu (WCAG 2.1 AA) | Ngưỡng khuyến nghị (WCAG AAA) | Ghi chú                                                            |
| :------------------------------------------------------ | :----------------------------: | :---------------------------: | :----------------------------------------------------------------- |
| **Văn bản thông thường** (`< 18pt` hoặc `< 14pt` đậm)   |         **`4.5 : 1`**          |         **`7.0 : 1`**         | Tiêu đề phụ, nhãn nhập liệu, mô tả, nội dung bảng, badge           |
| **Văn bản kích thước lớn** (`≥ 18pt` hoặc `≥ 14pt` đậm) |         **`3.0 : 1`**          |         **`4.5 : 1`**         | Tiêu đề chính trang, số liệu thống kê KPI lớn                      |
| **Thành phần giao diện & Đồ họa**                       |         **`3.0 : 1`**          |         **`4.5 : 1`**         | Viền ô input, icon chức năng, chỉ báo tab đang chọn, toggle switch |
| **Trạng thái Focus (Focus Ring)**                       |         **`3.0 : 1`**          |         **`4.5 : 1`**         | Viền hiển thị khi điều hướng bằng phím Tab                         |

---

## 2. Forbidden Patterns (Nghiêm Cấm)

1. **Cấm dùng class opacity thấp trên chữ**:
   - ❌ `text-foreground/20`, `text-foreground/30`, `text-foreground/40`
   - ❌ `text-black/30`, `text-white/30`, `text-white/40`
   - _Lý do_: Opacity dưới 50% làm giảm tương phản xuống dưới 3:1 trên nền thông thường.

2. **Cấm dùng màu xám tĩnh có độ sáng cao trên nền sáng**:
   - ❌ `text-gray-300`, `text-gray-400`, `text-slate-400` trên nền `bg-surface` hoặc `bg-background`.
   - _Lý do_: Đạt tỷ lệ tương phản chưa tới 2.5:1, gây mỏi mắt và không đọc được.

3. **Cấm dùng placeholder thay thế cho `<label>`**:
   - ❌ `<input placeholder="Họ và tên..." />` không có label đi kèm.
   - _Quy chuẩn_: Luôn có `<label>` rõ ràng hoặc `aria-label` cho trình đọc màn hình.

4. **Cấm loại bỏ viền Focus mà không có thay thế**:
   - ❌ `focus:outline-none` đơn lẻ.
   - _Quy chuẩn_: Bắt buộc dùng `focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none`.

---

## 3. Required Patterns (Bắt Buộc Sử Dụng)

1. **Semantic Design Tokens**:
   - Chữ chính, tiêu đề: `text-foreground` (Light: `#101e34`, Dark: `#eef7ff`).
   - Chữ phụ, mô tả, chú thích: `text-muted` hoặc `text-muted-foreground` (Light: `#475569` - contrast 7.61:1; Dark: `#9eb4ce` - contrast 7.87:1).
   - Chữ vô hiệu hóa: `text-disabled` (Light: `#64748b`; Dark: `#8fa1b8`).

2. **Chỉ báo Trực quan Hai Tầng (Dual Visual Indicators)**:
   - Các trạng thái active (tab đang chọn, bộ lọc đang bật, nút toggle) không được chỉ dựa vào màu sắc đơn thuần.
   - Bắt buộc có thêm chỉ báo hình học: gạch chân (`underline`, `scaleX(1)`), icon check, hoặc viền nổi bật.

3. **Kiểm Định Hai Chế Độ (Dual-Theme Verification)**:
   - Mọi màn hình mới phải được kiểm tra hiển thị rõ ràng trên cả **Light Mode** (`:root`) và **Dark Mode** (`[data-theme='dark']`).

---

## 4. Verification Command

Chạy công cụ kiểm tra tự động trước khi commit code:

```bash
npm run a11y:check    # 0 lỗi tương phản nghiêm trọng
npm run theme:check   # Đối xứng token hai chế độ sáng/tối
npm run lint:css      # 0 lỗi Stylelint
```
