# Implementation Plan: Portal Realtime Notifications

## Overview

Tích hợp Supabase Realtime vào Customer Portal để khách hàng nhận thông báo tức thì khi trạng thái đơn hàng, tiến độ sản xuất hoặc phiếu giao hàng thay đổi. Triển khai theo thứ tự: types → pure functions → state store → service → UI components → tích hợp hooks → tích hợp layout.

## Tasks

- [x] 1. Tạo types và pure functions
  - [x] 1.1 Tạo `notifications/types.ts` với `NotificationItem`, `PortalDataEvent`, `PortalEvent`
    - Định nghĩa interface `NotificationItem` (id, type, title, body, orderId, shipmentId, createdAt, isRead)
    - Định nghĩa union type `PortalDataEvent` (order_status_changed | progress_stage_updated | shipment_created)
    - Tái sử dụng `OrderStatus`, `ProductionStage`, `StageStatus` từ `customer-portal/types.ts`
    - _Requirements: 2.1, 3.1, 4.1_

  - [x] 1.2 Tạo `notifications/notificationMappers.ts` với các pure functions ánh xạ enum → tiếng Việt
    - Implement `mapOrderStatus(status: OrderStatus): string`
    - Implement `mapProductionStage(stage: ProductionStage): string`
    - Implement `mapStageStatus(status: StageStatus): string`
    - _Requirements: 2.2, 3.2, 3.3_

  - [x]\* 1.3 Viết property test cho enum mapping (Property 3)
    - **Property 3: Enum mapping trả về nhãn tiếng Việt không rỗng**
    - **Validates: Requirements 2.2, 3.2, 3.3**

- [x] 2. Implement notification state logic (pure functions)
  - [x] 2.1 Tạo các pure functions quản lý state trong `notifications/notificationStore.ts`
    - `addWithCapacity(items, newItem, cap=50)`: prepend + trim cũ nhất
    - `sortNotifications(items)`: sort theo `createdAt` mới nhất trước
    - `computeUnreadCount(items)`: đếm `isRead === false`
    - `markAllRead(items)`: trả về array mới với tất cả `isRead = true`
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

  - [x]\* 2.2 Viết property test cho sorting (Property 7)
    - **Property 7: Danh sách thông báo luôn sắp xếp mới nhất trước**
    - **Validates: Requirements 5.1**

  - [x]\* 2.3 Viết property test cho badge count (Property 8)
    - **Property 8: Badge count bằng số thông báo chưa đọc**
    - **Validates: Requirements 5.2**

  - [x]\* 2.4 Viết property test cho mark all read (Property 9)
    - **Property 9: Mark all read đặt tất cả isRead = true**
    - **Validates: Requirements 5.3**

  - [x]\* 2.5 Viết property test cho capacity limit (Property 10)
    - **Property 10: Giới hạn 50 thông báo — xóa cũ nhất khi vượt quá**
    - **Validates: Requirements 5.5**

- [x] 3. Implement notification creation logic
  - [x] 3.1 Tạo `notifications/notificationFactory.ts` với các factory functions
    - `createOrderNotification(payload)`: tạo `NotificationItem` từ order UPDATE payload
    - `createProgressNotification(payload, orderNumber)`: tạo từ order_progress payload
    - `createShipmentNotification(payload)`: tạo từ shipments INSERT payload
    - `processPayload(payload, currentCustomerId)`: validate `customer_id` trước khi xử lý
    - Bỏ qua khi `new.status === old.status` (deduplication)
    - _Requirements: 2.1, 2.3, 3.1, 3.4, 4.1, 7.3_

  - [x]\* 3.2 Viết property test cho deduplication (Property 2)
    - **Property 2: Deduplication — bỏ qua khi status không thay đổi**
    - **Validates: Requirements 2.3, 3.4**

  - [x]\* 3.3 Viết property test cho order notification creation (Property 4)
    - **Property 4: Tạo notification đúng từ order event**
    - **Validates: Requirements 2.1, 2.2**

  - [x]\* 3.4 Viết property test cho progress notification creation (Property 5)
    - **Property 5: Tạo notification đúng từ order_progress event**
    - **Validates: Requirements 3.1, 3.2, 3.3**

  - [x]\* 3.5 Viết property test cho shipment notification creation (Property 6)
    - **Property 6: Tạo notification đúng từ shipment event**
    - **Validates: Requirements 4.1**

  - [x]\* 3.6 Viết property test cho security filter (Property 11)
    - **Property 11: Security filter — bỏ qua payload của customer khác**
    - **Validates: Requirements 7.3**

- [x] 4. Checkpoint — Đảm bảo tất cả tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement useNotifications hook và NotificationProvider
  - [x] 5.1 Tạo `notifications/useNotifications.ts` với React context và hook
    - Tạo `NotificationContext` với `NotificationState & NotificationActions`
    - Implement `NotificationProvider` nhận `customerId` prop
    - Expose `addNotification`, `markAllRead`, `clearAll`, `setConnectionWarning`
    - State không persist vào localStorage/sessionStorage
    - _Requirements: 5.1, 5.2, 5.3, 5.5, 5.6_

- [x] 6. Implement RealtimeService
  - [x] 6.1 Tạo `notifications/RealtimeService.ts` singleton
    - Implement `start(config)`: subscribe 3 channels (orders, order_progress, shipments)
    - Channel `orders`: filter `customer_id=eq.{customerId}`, lắng nghe UPDATE
    - Channel `order_progress`: filter `order_id=in.(...)`, lắng nghe INSERT + UPDATE
    - Channel `shipments`: filter `customer_id=eq.{customerId}`, lắng nghe INSERT
    - Implement `stop()`: unsubscribe tất cả channels, reset state
    - Implement retry logic: tối đa 3 lần, delay 5 giây mỗi lần
    - Gọi `onNotification` và `onDataUpdate` callbacks sau khi validate
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 7.1, 7.2, 7.4_

  - [ ]\* 6.2 Viết property test cho retry logic (Property 1)
    - **Property 1: Retry logic dừng đúng sau 3 lần thất bại**
    - **Validates: Requirements 1.3, 1.4**

- [x] 7. Implement UI components
  - [x] 7.1 Tạo `notifications/NotificationBadge.tsx`
    - Icon chuông + badge số (ẩn khi `unreadCount === 0`)
    - Click toggle `NotificationCenter` dropdown
    - Đọc state từ `NotificationContext`
    - _Requirements: 5.2_

  - [x] 7.2 Tạo `notifications/NotificationCenter.tsx`
    - Dropdown danh sách tối đa 50 items, scroll nếu nhiều hơn
    - Khi mở: gọi `markAllRead()`
    - Click item: navigate đến `/portal/orders/:orderId`
    - Empty state khi không có thông báo
    - _Requirements: 5.1, 5.3, 5.4_

- [x] 8. Mở rộng hooks hiện có để nhận realtime updates
  - [x] 8.1 Mở rộng `usePortalOrders` thêm `updateOrderStatus` và `updateProgressStage` callbacks
    - `updateOrderStatus(orderId, newStatus)`: cập nhật state `orders` và `order` tại chỗ
    - `updateProgressStage(stageId, newStatus)`: cập nhật state `stages` tại chỗ
    - _Requirements: 6.1, 6.2_

  - [x] 8.2 Mở rộng `usePortalShipments` thêm `prependShipment` callback
    - `prependShipment(shipment)`: thêm vào đầu state `shipments`
    - _Requirements: 6.3_

  - [ ]\* 8.3 Viết property test cho prepend shipment (Property 12)
    - **Property 12: Prepend shipment mới vào đầu danh sách**
    - **Validates: Requirements 6.3**

- [x] 9. Tích hợp vào CustomerPortalLayout
  - [x] 9.1 Wrap `CustomerPortalLayout` với `NotificationProvider`
    - Truyền `customerId` từ `profile.customer_id`
    - Khởi động `RealtimeService` trong `NotificationProvider` sau khi có `customerId`
    - Dispatch `PortalDataEvent` đến hooks đang active qua React context hoặc event emitter
    - _Requirements: 1.1, 1.2, 6.4_

  - [x] 9.2 Thêm `NotificationBadge` vào header của `CustomerPortalLayout`
    - Đặt bên cạnh tên người dùng trong `portal-header-user`
    - _Requirements: 5.2_

- [x] 10. Final checkpoint — Đảm bảo tất cả tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks đánh dấu `*` là optional, có thể bỏ qua để triển khai MVP nhanh hơn
- Property tests dùng **fast-check** (TypeScript-native), tối thiểu 100 iterations mỗi property
- `RealtimeService` là singleton — không tạo nhiều instance
- State thông báo không persist — xóa khi tải lại trang (Requirements 5.6)
- Không có thay đổi database — RLS đã được thiết lập trong spec `customer-portal`
