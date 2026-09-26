# Delta Specification: Nâng cấp Toàn diện Trải nghiệm Mobile Bottom Navigation

Tài liệu này ghi nhận sự khác biệt (Delta) giữa đặc tả điều hướng di động hiện tại và các yêu cầu cải tiến công thái học mới.

---

## 1. Yêu cầu Bổ sung (Added Requirements)

### REQ-NAV-01: Tích hợp Safe Area Inset Toàn diện cho Container & Drawer

- **GIVEN**: Người dùng truy cập ERP trên thiết bị di động iOS có tai thỏ / Dynamic Island hoặc Android sử dụng cử chỉ vuốt Home.
- **WHEN**: Trang nội dung được cuộn xuống cuối cùng hoặc khi mở ngăn kéo `MobileMoreDrawer`.
- **THEN**:
  - Container `.content-shell` tự động tính toán khoảng cách an toàn `calc(5.5rem + env(safe-area-inset-bottom, 0px))`, không để phần tử cuối cùng bị che khuất bởi thanh nav đáy.
  - Ngăn kéo `MobileMoreDrawer` có lề đáy an toàn ngăn chặn việc thao tác vuốt nhầm vào thanh cử chỉ hệ điều hành.

### REQ-NAV-02: Phân bổ Tab Bottom Nav Động theo Vai trò Người dùng (Role-Aware Tabs)

- **GIVEN**: Người dùng đăng nhập với một vai trò cụ thể (`sales`, `accountant`, `warehouse`, `production`, `admin`...).
- **WHEN**: Giao diện `AppShell` trên màn hình nhỏ (< 768px) hiển thị thanh bottom navigation.
- **THEN**:
  - Hệ thống tự động phân giải danh sách 3 tab nghiệp vụ cốt lõi phù hợp nhất cho vai trò đó (ví dụ Sales: Khách hàng, Báo giá, Đơn hàng; Thủ kho: Sợi, Vải mộc, Vải thành phẩm...).
  - Vẫn giữ nguyên tab đầu tiên là `Trang chủ (/)` và tab cuối cùng là `Menu (More Drawer)`.
  - Ngăn kéo `MobileMoreDrawer` tự động loại bỏ các tab đang hiển thị ở bottom nav để tránh trùng lặp.

### REQ-NAV-03: Phản hồi Xúc giác (Haptic Feedback) và Huy hiệu Thông báo (Badges)

- **GIVEN**: Người dùng chạm vào một tab điều hướng ở bottom nav.
- **WHEN**: Thiết bị phần cứng hỗ trợ Vibration API và người dùng không bật tùy chọn `prefers-reduced-motion`.
- **THEN**:
  - Phát sinh phản hồi xúc giác nhẹ (10ms) để xác nhận thao tác.
  - Các tab có công việc cần xử lý (ví dụ đơn hàng mới / chờ duyệt) hiển thị huy hiệu số lượng hoặc chấm đỏ cảnh báo trực quan với thuộc tính trợ năng `aria-label` tương ứng.

---

## 2. Yêu cầu Chỉnh sửa (Modified Requirements)

- **Quy chuẩn CŨ**:
  - Bottom navigation gán cứng danh sách cố định: `['/', '/orders', '/raw-fabric', '/finished-fabric']` cho toàn bộ tài khoản bất kể vai trò.
  - Khoảng cách padding đáy của `.content-shell` là `5.5rem` tĩnh, chưa cộng bù `safe-area-inset-bottom`.
- **Quy chuẩn MỚI**:
  - Danh sách tab bottom nav được phân giải động theo vai trò người dùng kết hợp quyền truy cập (`hasAccess`), đảm bảo hiển thị đúng công cụ hàng ngày của từng vị trí làm việc.
  - Khoảng cách đáy được bù tự động theo `env(safe-area-inset-bottom)`.
- **Lý do kinh doanh (Business Justification)**:
  - Tối ưu hóa năng suất làm việc của công nhân viên tại hiện trường nhà máy, nhân viên kinh doanh ngoài thị trường và kế toán viên khi dùng điện thoại/tablet.

---

## 3. Yêu cầu Loại bỏ (Deprecated / Removed Requirements)

- Loại bỏ mảng cố định `BOTTOM_TAB_PATHS` gán cứng duy nhất trong `AppShell.tsx`.

---

## 4. Xác nhận An toàn ERP (ERP Safety Confirmation)

- **NO BUSINESS BEHAVIOR CHANGE** đối với luồng dữ liệu nghiệp vụ, không thay đổi công nợ, hao hụt dệt nhuộm, giá cả hay số lượng tồn kho.
