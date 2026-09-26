# Đề xuất Thay đổi: Nâng cấp Toàn diện Trải nghiệm Mobile Bottom Navigation (Mobile Nav Enhancements)

- **Slug:** `mobile-nav-enhancements`
- **Author:** AI Resident Agent & Tech Lead
- **Trạng thái:** COMPLETED
- **Domain:** `layout` / `navigation`
- **Design Intelligence Standard:** `erp-uiux-pro` (Mobile Ergonomics & Responsive B2B: Ergonomics 10/10, Density 8/10, Motion 3/10)

---

## 1. Bối cảnh & Lý do thay đổi (Context & Why)

Sau quá trình rà soát công thái học trên thiết bị di động thực tế (iPhone có tai thỏ / Dynamic Island, thiết bị Android cử chỉ vuốt Home), hệ thống phát hiện 3 điểm nghẽn và hạn chế cốt lõi cần giải quyết:

### 1. Chưa xử lý triệt để Safe Area Inset (iOS Home Indicator & Android Navigation Gesture Bar)

- **Vấn đề**:
  - Trên các dòng smartphone hiện đại, mép đáy màn hình có thanh chỉ báo vuốt Home (`Home Indicator`).
  - Thanh navigation đáy (`.mobile-nav`) hiện đã có padding đáy nhưng container nội dung chính (`.content-shell`) ở `src/styles/layout/app-shell.css` chỉ dùng `padding-bottom: 5.5rem` cố định. Khi cộng thêm `env(safe-area-inset-bottom)` (~34px trên iPhone), chiều cao thực tế của thanh nav đáy đạt gần 90px, khiến nội dung và các nút hành động cuối cùng của trang (ví dụ nút Lưu, nút Phê duyệt) bị thanh bar che khuất hoặc ép sát mép.
  - Tương tự, ngăn kéo điều hướng (`MobileMoreDrawer`) cần bảo đảm toàn bộ vùng vuốt cử chỉ đáy và nội dung cuộn bên trong kết thúc cách ly an toàn với Home Indicator.
- **Hành vi kỳ vọng**:
  - Chuẩn hóa CSS Token an toàn: Khai báo `--safe-area-bottom: env(safe-area-inset-bottom, 0px)` dùng chung cho hệ thống.
  - Cập nhật `.content-shell` với `padding-bottom: calc(5.5rem + env(safe-area-inset-bottom, 0px))`.
  - Tối ưu hóa padding đáy của `MobileBottomNav` và `MobileMoreDrawer` để tuyệt đối không bị đè lên icon/chữ hoặc gây chạm nhầm cử chỉ hệ điều hành.

### 2. Tab Bottom Nav bị gán cứng tĩnh (Hardcoded Core Tabs)

- **Vấn đề**:
  - `AppShell.tsx` hiện đang gán cứng 4 tab: `['/', '/orders', '/raw-fabric', '/finished-fabric']`.
  - Đây là luồng nghiệp vụ của bộ phận Quản lý / Sản xuất dệt may. Đối với các vai trò chuyên biệt khác:
    - **Nhân viên Kinh doanh (Sales)**: Cần theo dõi Khách hàng (`/customers`), Báo giá (`/quotes`) và Đơn hàng (`/orders`). Tab Vải mộc (`/raw-fabric`) không mang giá trị hàng ngày.
    - **Kế toán (Accountant)**: Cần theo dõi Thu chi, Hóa đơn (`/invoices`), Công nợ (`/debt`), Báo cáo tài chính.
    - **Thủ kho Sợi/Vải**: Cần Sợi (`/yarn`), Vải mộc (`/raw-fabric`), Vải thành phẩm (`/finished-fabric`).
- **Hành vi kỳ vọng**:
  - Tận dụng `NavigationResolver` và cấu trúc `primaryMobile` từ Plugin Registry / Role Mapping.
  - Xây dựng cơ chế xác định tab ưu tiên theo vai trò (`getRoleDefaultBottomTabs(role)`), tự động hiển thị 3 tab quan trọng nhất của vai trò đó (kẹp giữa Home `/` và nút Menu Drawer).
  - Tự động lọc trừ để drawer không bị trùng lặp các tab đã xuất hiện ở đáy màn hình.

### 3. Thiếu phản hồi xúc giác & Badge thông báo tức thì (Haptic Feedback & Badges)

- **Vấn đề**:
  - Người dùng thao tác chạm tab trên điện thoại không có phản hồi xúc giác nhẹ (Haptic), tạo cảm giác giao diện web phẳng và kém phản hồi.
  - Các tab điều hướng đáy không hiển thị trạng thái động (badges / chấm đỏ). Ví dụ: Đơn hàng (`/orders`) có 3 đơn chờ duyệt, hoặc nút Menu Drawer có tin nhắn / thông báo mới chưa đọc.
- **Hành vi kỳ vọng**:
  - Bổ sung tiện ích phản hồi xúc giác nhẹ (`triggerHapticFeedback()` qua `navigator.vibrate(10)` với fallback an toàn và tôn trọng `prefers-reduced-motion`).
  - Hỗ trợ `badge?: number | string` và `hasDot?: boolean` trên từng `bottomTab` và nút Menu.
  - Tích hợp số đơn hàng chờ duyệt (`pendingApprovalCount`) cho tab Đơn hàng và `totalUnread` cho nút Menu.

---

## 2. Thiết Kế UI/UX Theo Chuẩn `erp-uiux-pro`

| Tiêu chuẩn                         | Giải pháp triển khai                                                                                                                                                         |
| :--------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Touch Target Ergonomics**        | Chiều cao touch target của mỗi tab đạt tối thiểu 48px x 48px, vùng bấm rộng rãi, không bị dính sát Home Bar.                                                                 |
| **Micro-Interactions & Haptics**   | Rung vi mô 10ms khi người dùng tap chuyển tab trên thiết bị cảm ứng hỗ trợ; Active indicator chuyển động êm ái với `cubic-bezier(0.32, 0.72, 0, 1)`.                         |
| **Badge Semantics**                | Badge số dùng token `bg-danger text-inverse-foreground` với bo tròn mềm mại (`rounded-full min-w-4.5 h-4.5 text-[10px] font-bold px-1 tabular-nums`). Không dùng mã màu thô. |
| **Safe Area Insets (iOS/Android)** | Triệt tiêu hoàn toàn nguy cơ overlap bằng CSS dynamic calculation `calc(... + env(safe-area-inset-bottom, 0px))`.                                                            |
| **Accessibility (a11y)**           | Giữ vững `role="tablist"`, `role="tab"`, `aria-selected`, và bổ sung `aria-label` cho badge thông báo (ví dụ: `aria-label="Đơn hàng, 3 việc cần xử lý"`).                    |

---

## 3. Bản đồ Tác động (Impact Map)

```text
UI Layer:
  ├── src/app/layouts/MobileBottomNav.tsx (Hỗ trợ badge, dot indicator, haptic feedback, safe area padding)
  ├── src/app/layouts/MobileMoreDrawer.tsx (Tối ưu padding đáy với env(safe-area-inset-bottom), đồng bộ loại trừ tabs)
  ├── src/app/layouts/AppShell.tsx (Áp dụng dynamic role-based bottom tabs, truyền badge count vào MobileBottomNav)
  └── src/styles/layout/mobile-nav.css & app-shell.css (Chuẩn hóa safe area inset padding)
       │
       ▼
Domain / Navigation Layer:
  ├── src/app/layouts/resolvers/role-tabs.config.ts (Cấu hình bộ tab tối ưu cho từng vai trò: admin, manager, sales, accountant, warehouse...)
  ├── src/shared/lib/haptics.ts (Utility rung phản hồi xúc giác công thái học an toàn)
  └── src/app/layouts/__tests__/MobileBottomNav.test.tsx (Cập nhật và bổ sung test cases kiểm thử badges & tabs)
       │
       ▼
Database / RPC:
  └── Không thay đổi Database Schema / RPC (Toàn bộ logic nằm ở UI Shell, Router và Client Preference)
```

---

## 4. Rủi ro & Đánh giá An toàn ERP (ERP Safety Assessment)

- [x] **Có thay đổi logic kế toán / công nợ không?**: `KHÔNG`
- [x] **Có thay đổi cách tính tồn kho vải / sợi không?**: `KHÔNG`
- [x] **Có thay đổi định mức dệt / nhuộm không?**: `KHÔNG`
- [x] **Có nguy cơ deadlock hoặc vi phạm RLS Multi-Tenant không?**: `KHÔNG`

---

## 5. Kế hoạch Nghiệm thu (Verification Checklist)

1. `npm run typecheck` — Đạt 0 lỗi TypeScript ở Frontend.
2. `npm run lint -- --max-warnings=0` — Đạt 0 warning/error, tuân thủ Architecture Guard (không emoji, không hardcoded colors).
3. `npm run lint:css` — Đạt 0 lỗi Stylelint.
4. `npm run test` — Toàn bộ test suite bao gồm `MobileBottomNav.test.tsx` pass 100%.
5. Kiểm tra trải nghiệm trực quan: Không bị che khuất nội dung trang khi có thanh Home Bar; chuyển đổi vai trò hiển thị đúng bộ tab tương ứng; badge hiển thị rõ nét và dễ đọc.
