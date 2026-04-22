---
trigger: business_logic
---

# 🏭 Vĩnh Phát ERP v3 - Business & Domain Rules (Quy tắc Nghiệp vụ)

Tài liệu này định nghĩa các quy tắc nghiệp vụ (Business Logic) **BẮT BUỘC TUÂN THỦ** đối với hệ thống Vĩnh Phát ERP. Mọi AI Agent và Lập trình viên phải đối chiếu với tài liệu này TRƯỚC KHI viết hoặc sửa đổi code liên quan đến tính toán giá thành, báo giá, hoặc xuất nhập tồn.

---

## 1. Định nghĩa Khái niệm (Terminology)

- **`target_weight_kg` (Trọng lượng mục tiêu)**: Là khối lượng VẢI THÀNH PHẨM (vải mộc hoặc vải màu) mong muốn thu được sau quá trình sản xuất.
- **`yarn_requirements` (Nhu cầu sợi)**: Là lượng sợi nguyên liệu đầu vào CẦN PHẢI XUẤT KHO. Giá trị này **LUÔN LUÔN** lớn hơn khối lượng vải thành phẩm vì nó **ĐÃ BAO GỒM** tỷ lệ hao hụt.
  - Công thức: `Lượng sợi cần = Trọng lượng vải / (1 - Tỷ lệ hao hụt / 100)`
- **`directYarnCost` (Chi phí sợi trực tiếp)**: Tiền mua nguyên liệu = `Tổng lượng sợi cần (yarn_requirements) × Đơn giá sợi`.

---

## 2. Quy tắc Tính Giá Vốn (Costing Rules - Chống Double Count)

Đây là những luật thép trong kế toán sản xuất của dự án để tránh tình trạng đội vốn ảo.

### 2.1. Tuyệt đối KHÔNG cộng kép hao hụt (Double Counting)

Vì lượng sợi xuất kho (`yarn_requirements`) đã bao hàm luôn lượng bù hao, nên `directYarnCost` đã mang trong mình số tiền bị hao hụt.

- ❌ **CÔNG THỨC SAI:** `Tổng Giá Vốn = Tiền sợi + Tiền hao hụt + Tiền gia công`
- ✅ **CÔNG THỨC ĐÚNG:** `Tổng Giá Vốn = Tiền sợi (directYarnCost) + Tiền gia công (processingCost)`

### 2.2. Hiển thị "Chi phí hao hụt" (Waste Cost) trên UI

Nếu giao diện yêu cầu hiển thị "Chi phí hao hụt":

- Dữ liệu này chỉ mang tính chất **BÁO CÁO THAM KHẢO** để quản lý biết đã thất thoát bao nhiêu tiền vào hao hụt.
- Tuyệt đối **KHÔNG** dùng giá trị này để cộng dồn vào Tổng Giá Vốn (Total Cost) trong Database hay API.

---

## 3. Tiêu chuẩn Thực thi cho AI Agent

1. **Phân tích trước khi Code (Math Breakdown)**:
   - Trước khi sửa/tạo hàm tính toán, AI bắt buộc phải lập bảng nháp toán học với con số cụ thể (VD: 100kg vải, hao hụt 5%, giá 50k) để chứng minh logic không bị tính trùng (double count).
2. **Quy tắc làm tròn (Rounding)**:
   - Mọi số liệu tiền tệ (VNĐ) phải được làm tròn về số nguyên gần nhất (sử dụng `Math.round()`). Tuyệt đối không lưu giá trị lẻ thập phân đối với VNĐ trong CSDL.
3. **Data Mocking cho Unit Test**:
   - Khi tạo Mock Data cho Test, AI không được "chế" số bừa bãi. Các biến liên quan đến tổng tiền bắt buộc phải khớp đúng với phép tính tay (`Giá bán = Giá vốn × (1 + % Lợi nhuận)`).
