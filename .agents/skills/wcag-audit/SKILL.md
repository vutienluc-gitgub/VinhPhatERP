---
name: wcag-audit
description: 'Automated WCAG 2.1 AA/AAA accessibility and contrast audit for VinhPhatERP. Use when evaluating color contrast, inspecting live browser DOM contrast ratios, detecting low-opacity text, or fixing accessibility regressions.'
---

# WCAG Accessibility & Contrast Audit Skill

## Overview

Skill này trang bị cho AI Agent năng lực tự động thẩm định, đo lường và khắc phục các vấn đề về khả năng tiếp cận (Accessibility - a11y) và độ tương phản màu sắc theo tiêu chuẩn **W3C WCAG 2.1 AA/AAA** trên toàn bộ hệ thống **ERP Dệt May Vĩnh Phát**.

---

## 1. Tiêu Chuẩn & Công Thức Tính Toán Độ Tương Phản

Tỷ lệ tương phản được tính toán dựa trên **Độ chói tương đối (Relative Luminance - $L$)** theo công thức W3C:

$$R_{\text{linear}} = \begin{cases} \frac{R}{12.92} & \text{nếu } R \le 0.03928 \\ \left(\frac{R + 0.055}{1.055}\right)^{2.4} & \text{ngược lại} \end{cases}$$

$$L = 0.2126 \cdot R_{\text{linear}} + 0.7152 \cdot G_{\text{linear}} + 0.0722 \cdot B_{\text{linear}}$$

$$\text{Contrast Ratio} = \frac{L_{\text{sáng}} + 0.05}{L_{\text{tối}} + 0.05}$$

### Bảng chuẩn nghiệm thu:

- **Văn bản thông thường (< 18pt / 24px hoặc < 14pt / 18.66px đậm)**: $\ge 4.5 : 1$ (AA), $\ge 7.0 : 1$ (AAA).
- **Văn bản lớn ($\ge 18\text{pt}$ hoặc $\ge 14\text{pt}$ đậm)**: $\ge 3.0 : 1$ (AA).
- **Thành phần đồ họa, viền ô nhập, icon, chỉ báo active**: $\ge 3.0 : 1$ (AA).

---

## 2. Quy Trình Rà Soát Toàn Bộ Source Code (Audit Runbook)

### Bước 1: Quét tĩnh mã nguồn (Static AST Scanner)

Chạy lệnh kiểm tra nhanh để tìm các class phản tác dụng:

```bash
npm run a11y:check
```

_Bắt các lỗi:_

- `text-*/10`, `text-*/20`, `text-*/30`, `text-*/40` (opacity quá thấp).
- `text-gray-300`, `text-slate-400` trên nền sáng.
- `focus:outline-none` không có focus ring.

### Bước 2: Đo lường thực tế trên trình duyệt (Browser Computed Styles)

Sử dụng `browser_subagent` để mở các trang trọng yếu (`/settings/print`, `/orders`, `/inventory`, `/shipments`) và thực thi script đo độ chói thực tế của text so với nền:

```javascript
// Đo màu chữ thực tế và màu nền cha gần nhất
function getEffectiveBgColor(el) {
  let cur = el;
  while (cur && cur !== document.body) {
    const bg = window.getComputedStyle(cur).backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
    cur = cur.parentElement;
  }
  return (
    window.getComputedStyle(document.body).backgroundColor ||
    'rgb(255, 255, 255)'
  );
}
```

### Bước 3: Phân Loại Ma Trận Tương Phản (Contrast Matrix)

- 🔴 **Critical (< 3.0:1)**: Mờ mắt, không đọc được $\rightarrow$ Khắc phục ngay.
- 🟡 **Warning (3.0:1 - 4.49:1)**: Chưa đạt chuẩn AA cho chữ nhỏ $\rightarrow$ Chuyển sang `text-muted`.
- 🟢 **Compliant ($\ge 4.5:1$)**: Đạt chuẩn WCAG AA/AAA.

### Bước 4: Khắc Phục Sang Semantic Tokens

- Chữ phụ: Sử dụng `text-muted` (được bảo vệ bằng `var(--muted-foreground)`, đạt > 7:1).
- Chữ chính: Sử dụng `text-foreground` (đạt > 14:1).
- Trạng thái active: Luôn bổ sung viền gạch chân (`scaleX(1)`) hoặc icon.

---

## 3. Checklist Tự Kiểm Tra Trước Khi Hoàn Tất

- [ ] Chạy `npm run a11y:check` đạt 0 lỗi.
- [ ] Kiểm tra cả Light Mode và Dark Mode (`npm run theme:check` PASS).
- [ ] Chạy `npm run lint:css` đạt 0 lỗi.
- [ ] Chạy `npm run typecheck` đạt 0 lỗi.
- [ ] Chạy `npm run test` đạt 100% pass.
