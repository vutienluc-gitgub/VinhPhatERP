# Workflow: Operational UI (Ops UI) & Tactical Roster Implementation

## Objective

This workflow guides the AI Agent and Developers in building or refactoring UI components into the **Operational UI (Ops UI)** standard. This standard replaces traditional data-entry tables with a map/slot-based visual roster system (Tactical Map) for resource allocation modules (e.g., Fleet Dispatch, Work Order Scheduling, Warehouse Racking).

## 7 Lõi Áp Dụng (Core Pillars)

1. Kéo thả thực tế (True Drag & Drop)
2. Logic Nghiệp vụ Lõi (Real Business Logic)
3. Ràng buộc Tự động (Constraint System)
4. Tối ưu Gợi ý (Auto-Optimization)
5. Đồng bộ Thời gian thực (Realtime Sync)
6. Trạng thái Phái sinh (Derived State)
7. Định vị Ops UI (Operational Strategy)

---

## Các Bước Triển Khai Dành Cho AI Agent

Khi nhận được yêu cầu tạo hoặc sửa một Module theo chuẩn Ops UI, AI Agent **BẮT BUỘC** tuân theo các bước sau:

### Lần 1: Khởi Tạo Tầng Domain (Constraint System & Badges)

- **Hành động:** Xác định các giới hạn vật lý. Xe tải chở được bao nhiêu cuộn? Lô vải này thuộc Hạng (Grade) nào? Máy dệt nào hợp lệ?
- **Ngôn ngữ Màu Sắc (Visual Tokens):**
  - `Đạt chuẩn / Xong`: Emerald (Xanh ngọc lấp lánh).
  - `Cảnh báo / Lỗi nhẹ`: Amber (Vàng năng lượng).
  - `Hàng Lỗi Kém / Gấp / Tắc Nghẽn`: Rose (Đỏ gắt).
  - `Khóa / Trống / Chờ`: Slate (Xám/Xanh nhạt bóng mờ).
- Định nghĩa Zod Schema cho thao tác "Gán" (Assign/Dispatch).

### Lần 2: Xây Dựng Use-Case Hook (Bơm Não / Real Business)

- **Hành động:** Tạo một custom hook riêng (VD: `useFleetCommander.ts` hoặc `useSlotDispatcher.ts`).
- Hook này không quản lý CSS, chỉ quản lý não bộ:
  - Hàm `handleDragEnd(event)` chứa thuật toán phát hiện Xung đột tính chất (Lỗi lô/Lỗi khách).
  - Tính toán **Derived State**: Tính tổng trọng lượng giỏ hàng/xe tải từ danh sách `Slots` ngay bằng `useMemo` mà không đợi API cấp lại.

### Lần 3: Dựng Skeleton Vật Lý (Draggables & Droppables)

- Áp dụng cấu trúc thư viện kéo thả (ưu tiên `@dnd-kit/core`).
- **EntityBlock (Vật phẩm):** Bắt buộc bọc bằng `useDraggable`. Trạng thái có bóng hắt `shadow-sm`, khi kéo lên dùng `scale-105` mượt. Thay vì chữ viết, dùng màu và 1 Icon đại diện (chuẩn `lucide-react`) để nhận diện.
- **ResourceBay (Lỗ cắm/Xe/Máng):** Bắt buộc bọc bằng `useDroppable`. Có khung viền `border-dashed` và nền sáng nhẹ để mô phỏng "Vùng rỗng chờ lấp". Giới hạn cứng số Slot.

### Lần 4: Xử Lý Realtime Sync & Edge Case

- Áp dụng Atomic Locks thông qua RPC của Supabase nếu thả item xuống để tránh 2 admin cùng ném 1 cuộn vải vào 2 xe khác nhau (Race condition).
- Nếu User dùng Điện thoại (Mobile-First): Kích hoạt tính năng _Tap-to-move_ để bù trừ cho Kéo thả nếu Drag trên màn cảm ứng không tối ưu. Hệ thống không bao giờ phụ thuộc hoàn toàn vào Desktop Hover (`<RULE[no-hover-dependency.md]>`).

## Tiêu Chí Hoàn Thành (Definition of Done)

- Cảm giác **Game-hóa (Gamified)**: UI phải tạo đủ độ sướng và trơn tru. Thả sai slot là bắn ngược lại êm ái. Không popup đỏ chói. Không Data-grid khô khan.
- Trải nghiệm phải kích thích tư duy chiến thuật, tiết kiệm 50% thời gian bấm và dò chữ.
