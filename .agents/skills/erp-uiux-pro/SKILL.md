---
name: erp-uiux-pro
description: 'B2B UI/UX design intelligence and ergonomics standards tailored for VinhPhatERP. Use when designing, building, or refactoring pages, data grids, high-density forms, color tokens, typography, accessibility, and micro-interactions for textile & apparel manufacturing ERP.'
---

# ERP UI/UX Pro (VinhPhatERP Design Intelligence)

## Overview

Adapted from the industry-proven **UI/UX Pro Max** intelligence framework and custom-tailored for **VinhPhatERP v3** (Hệ thống điều hành Dệt May Vĩnh Phát).
The mission: **Eliminate "AI Slop"** (generic, unaligned, low-contrast, or overly flashy AI-generated layouts) and enforce **High-Density B2B Ergonomics** built for long-duration, high-precision industrial data entry and management.

---

## When to Apply

- **Thiết kế màn hình mới**: Bảng kê vải, Ma trận đóng gói (A5 Packing Matrix), Kế hoạch sản xuất, Sổ kho, Báo cáo công nợ.
- **Refactor UI/UX**: Tinh gọn bảng biểu, giảm độ trễ thị giác, tối ưu mật độ hiển thị (High-Density).
- **Kiểm thử nghiệm thu (Quality Gates)**: Rà soát khả năng tiếp cận (Accessibility), độ tương phản màu sắc, responsive và micro-interactions trước khi bàn giao.

---

## 1. The ERP Design Dials (Con Xoay B2B Đặc Thù)

Hệ thống ERP sản xuất dệt may đòi hỏi sự chuẩn xác, rõ ràng và tải thông tin đậm đặc thay vì trang trí rườm rà. Luôn giữ bộ tham số sau trong tư duy thiết kế:

| Thiết lập Dial                 |  Giá trị tối ưu  | Ý nghĩa & Quy chuẩn áp dụng                                                                                                                                                                                             |
| :----------------------------- | :--------------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Density (Mật độ thông tin)** | **`8 - 9 / 10`** | **Cao (High-Density)**: Table padding gọn gàng (`py-1.5 px-2.5` hoặc `py-2 px-3`), compact form fields, font size cơ sở 13-14px cho dữ liệu bảng, header cố định (sticky header), tận dụng tối đa chiều ngang màn hình. |
| **Variance (Đột phá bố cục)**  | **`2 - 3 / 10`** | **Ổn định, nhất quán**: Cấu trúc lưới (grid) chuẩn mực, dạng cột rõ ràng, không phá cách bất đối xứng, vị trí nút bấm và thanh tìm kiếm có tính dự đoán cao (predictable).                                              |
| **Motion (Hoạt họa)**          |   **`2 / 10`**   | **Tối giản, thực dụng**: Thời lượng transition nhanh (100ms - 150ms), chỉ dùng cho hover, active, dropdown mở ra, modal fade-in. Cấm hiệu ứng chuyển động phức tạp gây trễ thao tác nhập liệu.                          |

---

## 2. Token Màu Sắc Ngữ Nghĩa (Semantic Design Tokens)

Tuân thủ nghiêm ngặt **Architecture Guard (`no-hardcoded-colors`)**. Tuyệt đối không dùng mã hex tĩnh (`#10b981`, `#ef4444`) hay Tailwind color không có ngữ nghĩa (`text-gray-900`, `bg-blue-500`).

### Bảng tra cứu Semantic Tokens chuẩn VinhPhatERP:

| Trạng thái / Ngữ cảnh                       | Token Text / Foreground            | Token Background / Container | Token Border     |
| :------------------------------------------ | :--------------------------------- | :--------------------------- | :--------------- |
| **Văn bản chính / Tiêu đề**                 | `text-foreground` / `text-primary` | `bg-surface`                 | `border-default` |
| **Văn bản phụ / Chú thích**                 | `text-muted`                       | `bg-surface-secondary`       | `border-subtle`  |
| **Thành công / Hoàn thành / Đạt kiểm định** | `text-success`                     | `bg-success-soft`            | `border-success` |
| **Nguy hiểm / Lỗi / Hủy / Âm kho**          | `text-danger`                      | `bg-danger-soft`             | `border-danger`  |
| **Cảnh báo / Tồn kho thấp / Chờ duyệt**     | `text-warning`                     | `bg-warning-soft`            | `border-warning` |
| **Thông tin / Điều độ / Đang xử lý**        | `text-info` / `text-link`          | `bg-info-soft`               | `border-info`    |

---

## 3. Quy Chuẩn Bảng Dữ Liệu & Ma Trận (High-Density Data Grid)

Đặc thù ngành Dệt May Vĩnh Phát làm việc liên tục với bảng kê cuộn vải, cây mộc, tỷ lệ kích thước/màu sắc (Size-Color Matrix):

### Căn lề dữ liệu chuẩn (Text Alignment Rules):

- **Căn trái (`text-left`)**: Tên mặt hàng, tên khách hàng, tên màu vải, ghi chú.
- **Căn phải (`text-right`)**: Số lượng (cây, cuộn), chiều dài (mét), khối lượng (kg), đơn giá, thành tiền, tổng cộng.
  - _Bắt buộc kèm:_ `font-mono tabular-nums` để các con số thẳng hàng khi so sánh dọc.
- **Căn giữa (`text-center`)**: Mã vạch, mã cuộn (`ROLL-001`), Size (`S`, `M`, `L`, `XL`), ngày tháng (`DD/MM/YYYY`), Tag trạng thái.

### Công thái học Bảng biểu:

- **Sticky Header & Fixed Columns**: Cố định hàng tiêu đề khi cuộn dọc và cố định cột mã hàng/tên vải khi cuộn ngang.
- **Zebra Striping hoặc Border phân tách nhẹ**: Dùng `divide-y divide-border-subtle` hoặc hàng chẵn `hover:bg-surface-secondary/50` giúp mắt không bị nhảy dòng khi dò dữ liệu.
- **Cấm ngắt dòng lỗi (Truncation)**: Text dài vượt ngưỡng phải có `truncate` và bọc trong `<VPTooltip>` hiển thị đầy đủ, không để text đẩy vỡ chiều cao hàng.

---

## 4. Công Thái Học Nhập Liệu (Form & Data Entry Ergonomics)

1. **Hiển thị nhãn rõ ràng (Explicit Labels)**:
   - Tuyệt đối không dùng `placeholder` để thay thế cho `<label>`. Placeholder biến mất khi nhập, khiến người dùng quên trường dữ liệu.
2. **Báo lỗi tức thì và sát cạnh trường (Inline Field Errors)**:
   - Thông báo validate Zod phải hiển thị ngay dưới trường lỗi, kèm màu `text-danger text-xs mt-1`. Không gom chung tất cả lỗi lên đầu trang dạng popup gây khó định vị.
3. **Phím tắt & Điều hướng bàn phím (Keyboard Flow)**:
   - Trong bảng nhập liệu nhiều ô (như Ma trận đóng gói): hỗ trợ phím `Tab` / `Shift+Tab` hoặc mũi tên để nhảy ô liên tục.
   - Nhấn `Enter` để xác nhận dòng hoặc thêm dòng mới.
   - Nhấn `Esc` để đóng popover/picker hoặc hủy sửa đổi.
4. **Chuẩn hóa Dropdown theo quy mô dữ liệu**:
   - $\le 30$ mục: `<VPSelect />`
   - $> 30$ mục: `<VPCombobox />` (hỗ trợ tìm kiếm)
   - $> 500$ mục: `<VPVirtualCombobox />` (cuộn ảo, không lag DOM)
   - Cấm dùng `<select>` native.

---

## 5. Khả Năng Tiếp Cận (Accessibility & Safety Rules)

- **Cấm Emoji làm Icon**: Vi phạm nghiêm trọng ESLint Architecture Guard. Bắt buộc dùng SVG từ bộ thư viện chuẩn (Lucide React, Phosphor).
- **Icon-Only Buttons**: Bắt buộc có `aria-label` hoặc `<VPTooltip>` (ví dụ: nút thùng rác xóa dòng phải có `aria-label="Xóa dòng"`).
- **Focus Rings**: Luôn giữ trạng thái `focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none`. Cấm xóa focus ring mà không có viền thay thế.
- **Độ tương phản (Contrast Ratio)**: Đảm bảo độ tương phản giữa chữ và nền tối thiểu **4.5:1** cho văn bản thông thường và **3:1** cho tiêu đề/icon.

---

## 6. Pre-Delivery UI/UX Checklist (Nghiệm Thu Trước Khi Bàn Giao)

Mỗi khi hoàn thành một màn hình hoặc component mới, bắt buộc tự kiểm tra 8 tiêu chí sau:

- [ ] **1. No Emoji**: Không chứa bất kỳ emoji nào trong UI (Icon dùng Lucide SVG).
- [ ] **2. No Hardcoded Colors**: 100% sử dụng semantic design tokens, `npm run lint:css` đạt 0 lỗi.
- [ ] **3. Number Alignment**: Cột số/tiền căn phải và có `tabular-nums`; cột mã/ngày căn giữa; cột chữ căn trái.
- [ ] **4. Overflow Protection**: Tên vải, mã đơn dài > 100 ký tự không làm xô lệch hoặc tràn màn hình ngang.
- [ ] **5. Loading Skeleton**: Có skeleton loader tương ứng với bố cục thật khi fetch dữ liệu (không flash giao diện).
- [ ] **6. Empty State**: Khi dữ liệu rỗng, có icon + lời giải thích tiếng Việt thân thiện + nút gợi ý hành động (CTA).
- [ ] **7. Keyboard & Focus**: Có thể dùng phím `Tab` duyệt qua các nút và form field với viền focus rõ ràng.
- [ ] **8. Responsive Breakpoints**: Hiển thị mượt mà trên các độ phân giải: Mobile 375px (kiểm kho), Tablet 768px (xưởng dệt), Laptop 1024px, Desktop 1440px+ (kế toán).
