# Epic: Giải quyết Cross-Feature Imports bằng Global Modal Store

**Mục tiêu:**
Loại bỏ hoàn toàn sự phụ thuộc (trực tiếp import component) giữa các phân hệ tính năng độc lập (ví dụ: gọi `PaymentForm` từ `OrdersPage`). Đảm bảo hệ thống tuân thủ nghiêm ngặt rule kiến trúc **Level 7 (Decoupling Features)** bằng cách thiết lập một Global Modal Dispatcher tại Root.

---

## Task 1: [INFRA-01] Xây dựng hạ tầng Global Modal Store

- [x] **1.1:** Khởi tạo store quản lý trạng thái toàn cục `src/shared/hooks/useGlobalModal.ts` (sử dụng Context hoặc Zustand tuỳ dự án). Store phải bao gồm kiểu dữ liệu nghiêm ngặt `modalType` (tên form) và `payload` (dữ liệu truyền vào Form, vd: `orderId`).
- [ ] **1.2:** Cập nhật cơ chế đăng ký trong `src/app/plugins.ts` / `FeatureRegistry.ts` để từng Feature có thể khai báo những Component Modal nào nó "publish" ra ngoài (vd: `paymentPlugin` cung cấp `PaymentForm` với id `PAYMENT_FORM`).
- [x] **1.3:** Tạo compoent tổng `src/app/components/GlobalModalDispatcher.tsx`. Nhiệm vụ của component này là lắng nghe store và lazy-load / render đúng Component Form tương ứng.
- [x] **1.4:** Nhúng `<GlobalModalDispatcher />` vào Root Component (thường là `App.tsx` hoặc `MainLayout`).

## Task 2: [REFACTOR-01] Gỡ bỏ Dependencies tại Orders Feature

- [x] **2.1:** Tại `src/features/orders/OrdersPage.tsx` và `OrderDetail.tsx`, loại bỏ các đoạn code dùng `useState` điều khiển form (`showPaymentForm`, `showShipmentForm`, v.v.).
- [x] **2.2:** Gán action gọi thay thế: Khi bấm các nút "Thu Tiền", "Xuất Kho" -> Gọi hàm `openModal('PAYMENT_FORM', { orderId: 123 })` thay vì setState.
- [x] **2.3:** Xóa tất cả các lệnh `import` trỏ tới `@/features/payments/...` và `@/features/shipments/...`.
- [x] **2.4:** Xóa bỏ comment bypass linter `// eslint-disable-next-line boundaries/element-types, boundaries/dependencies` vừa chèn ban nãy.

## Task 3: [REFACTOR-02] Gỡ bỏ Dependencies ở các tính năng khác (Nếu có)

- [ ] **3.1:** Rà soát tính năng **Work Orders** và **Inventory/Nhập-Xuất kho**: Đảm bảo toàn bộ form liên quan đến gọi chéo module đều dùng Global Modal.
- [ ] **3.2:** Đảm bảo các form vẫn nằm trong `AdaptiveSheet` (Quy định Bottom Sheet duy trì ngữ cảnh người dùng).
- [ ] **3.3:** Kiểm thử toàn bộ User Flow: Bấm nút ở trang A -> Hiện Bottom Sheet tính năng B -> Thao tác cập nhật thành công C.

## Task 4: [AUDIT-01] Bật chặn Lint tuyệt đối

- [ ] **4.1:** Reset cấu hình của `boundaries/element-types` hoặc `boundaries/dependencies` trong `.eslintrc.cjs` trở lại mức `error` tuyệt đối và không để sót ngoại lệ cho thư mục con của `src/features/`.
- [x] **4.2:** Chạy `npm run lint` để xác thực rule đã siết chặt và không còn lỗi.
- [ ] **4.3:** Chạy `npm run typecheck` để đảm bảo cơ chế `payload` truyền qua Modal Store hoàn toàn Type-safe.
