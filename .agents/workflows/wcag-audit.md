---
description: Quy trình kiểm toán và khắc phục độ tương phản (WCAG 2.1 AA/AAA) toàn diện cho VinhPhatERP
---

# Quy Trình Kiểm Toán Độ Tương Phản & Khả Năng Tiếp Cận (WCAG 2.1 AA/AAA)

> Kích hoạt bằng lệnh: `/wcag-audit` hoặc khi người dùng yêu cầu rà soát khả năng tiếp cận / độ tương phản của ứng dụng web.

---

## 1. Mục Tiêu & Tiêu Chuẩn Nghiệm Thu

Đảm bảo 100% giao diện người dùng (UI) trong VinhPhatERP tuân thủ tiêu chuẩn **W3C WCAG 2.1**:

- **Chữ thông thường (< 18pt)**: Tỷ lệ tương phản $\ge 4.5 : 1$ (chuẩn AA) và hướng tới $\ge 7.0 : 1$ (chuẩn AAA).
- **Chữ lớn ($\ge 18\text{pt}$)**: Tỷ lệ tương phản $\ge 3.0 : 1$.
- **Thành phần đồ họa, viền ô nhập, icon, chỉ báo active**: Tỷ lệ tương phản $\ge 3.0 : 1$.
- **Hoạt động hoàn hảo trên cả 2 giao diện**: Light Mode và Dark Mode.

---

## 2. Quy Trình Thực Thi 4 Bước (Execution Loop)

### Bước 1: Quét Tĩnh Toàn Bộ Mã Nguồn (Static Code Scan)

Chạy script kiểm tra tĩnh tự động:

```bash
npm run a11y:check
```

_Mục đích:_ Quét toàn bộ cây thư mục `src/` tìm các class có độ mờ thấp (`text-*/10`, `text-*/20`, `text-*/30`), màu xám nhạt (`text-gray-300`, `text-slate-400`), hoặc `focus:outline-none` thiếu focus ring.

### Bước 2: Đo Lường Trực Quan Trên Trình Duyệt (Browser Measurement)

Triệu hồi `browser_subagent` để mở các trang trọng yếu:

- `/settings/print?tab=config`
- `/orders`
- `/inventory`
- `/shipments`

Thực thi script đo đạc độ chói tương đối theo chuẩn W3C trên từng phần tử DOM:
$$L = 0.2126 \cdot R_{\text{linear}} + 0.7152 \cdot G_{\text{linear}} + 0.0722 \cdot B_{\text{linear}}$$
$$\text{Contrast Ratio} = \frac{L_{\text{sáng}} + 0.05}{L_{\text{tối}} + 0.05}$$

Chụp ảnh màn hình lưu vào thư mục artifacts làm bằng chứng thực tế.

### Bước 3: Phân Loại Rủi Ro & Lập Bảng Ma Trận Tương Phản

Lập bảng ma trận đo lường:

- 🔴 **Critical (< 3.0:1)**: Mờ mắt, không đọc được $\rightarrow$ Bắt buộc fix ngay.
- 🟡 **Warning (3.0:1 - 4.49:1)**: Chưa đạt chuẩn AA cho chữ nhỏ $\rightarrow$ Chuyển sang `text-muted` hoặc `text-foreground`.
- 🟢 **Compliant ($\ge 4.5:1$)**: Đạt chuẩn WCAG AA/AAA.

### Bước 4: Khắc Phục Sang Semantic Tokens & Kiểm Định Hồi Quy

1. Thay thế các màu vi phạm bằng Semantic Tokens:
   - Chữ phụ: `text-muted` (được bảo vệ bằng `var(--muted-foreground)`, đạt $\ge 7.6 : 1$).
   - Chữ chính: `text-foreground` (đạt $\ge 14 : 1$).
   - Viền ô nhập: `border-default`.
   - Trạng thái active: Bổ sung chỉ báo trực quan `scaleX(1)` hoặc icon.
2. Kiểm tra chất lượng (Verification Loop):
   ```bash
   npm run a11y:check
   npm run theme:check
   npm run lint:css
   npm run typecheck
   npm run test
   ```

---

## 3. Báo Cáo Nghiệm Thu Mẫu

Khi hoàn tất, xuất báo cáo đo lường:

- Bảng tỷ lệ tương phản Trước / Sau của các phần tử được tối ưu.
- Kết quả kiểm định của 5 lệnh Quality Gates.
- Xác nhận không thay đổi logic kinh doanh (Business Behavior Unchanged).
