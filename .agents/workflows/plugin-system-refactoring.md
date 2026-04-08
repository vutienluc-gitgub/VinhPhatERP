---
description: Implement Level 7 Architecture Plugin System & Feature Registry
---

# Workflow: Triển khai Kiến trúc Plugin & Feature Registry (Level 7)

Workflow này hướng dẫn các bước tiêu chuẩn để chuyển đổi cấu trúc ứng dụng từ "Hard-coded Router & Sidebar Menu" sang hệ thống Plugin Registry phi tập trung (Decentralized Feature Modules).

Mỗi tính năng (vd: shipments, orders, customers) sẽ tự đóng gói toàn bộ logic (Route, Menu Item, Hooks) của riêng nó.

## Pre-requisites

- [ ] Ứng dụng React đang rảnh, mọi luồng chức năng quan trọng (Nhập/Xuất/Tài chính) đều đã hoạt động trơn tru.

## Step 1: Khởi tạo Core Registry

Thiết lập thư viện cốt lõi (`FeatureRegistry`) để lưu trữ và quản lý quyền hoạt động của các module độc lập.

1. Khởi tạo interface tiêu chuẩn cho Feature:
   - `id`: Tên module định danh (vd: `feature-orders`)
   - `name`: Tên tiếng Việt để hiển thị Menu
   - `icon`: Lucide icon component.
   - `routes`: Mảng định tuyến (React Router data objects).
2. Viết file `src/app/plugins.ts` làm bộ chứa Singleton (Registry Class / Hoặc Array Export) để khai báo các plugins.
3. Tạo file `src/app/types/plugin.ts` để lưu `interface ERPPlugin`.

## Step 2: Cấu hình Menu Động (Dynamic Sidebar)

1. Truy cập `src/app/layouts/Sidebar.tsx` hoặc file cấu hình layout tương đương.
2. Xoá mảng tĩnh `MENU_ITEMS` hiện hữu.
3. Cập nhật Sidebar để duyệt qua toàn bộ biến `plugins` đã đăng ký ở Bước 1. Lọc các plugins rỗng rồi hiển thị `name` và `icon` tương ứng của plugins đó lên Sidebar. Chèn đường link bằng `routes[0].path`.

## Step 3: Đóng Gói (Encapsulate) Các Feature

Đây là phần việc tốn nhiều thời gian nhất. Lặp lại với **TUYỆT ĐỐI TẤT CẢ** các folder bên trong `src/features/*`:

1. Tạo file `[feature_name].plugin.tsx` ngay tại thư mục gốc của feature (Vd: `src/features/orders/orders.plugin.tsx`).
2. Mở file mới này, khởi tạo Plugin object:

   ```ts
   import { BookOpen } from 'lucide-react'
   import type { ERPPlugin } from '@/app/types/plugin'
   import { OrdersPage } from './OrdersPage'

   export const ordersPlugin: ERPPlugin = {
     id: 'module-orders',
     name: 'Đơn hàng',
     icon: BookOpen,
     routes: [
       { path: '/orders', element: <OrdersPage /> },
     ]
   }
   ```

3. Đem file của tính năng vừa đóng gói import vào hàm khởi tạo của `src/app/plugins.ts`.

## Step 4: Cơ Sở Chuyển Đổi Router

1. Trong file `src/app/router/routes.tsx` (hoặc `App.tsx` tùy kiến trúc):
2. Load danh sách routes từ `FeatureRegistry.getAllRoutes()`.
3. Ghép vào cây DOM `<Routes>` hoặc cây `createBrowserRouter()` động.

## Step 5: Dọn dẹp & Xác Vận

1. Xoá mọi liên kết rác ở Sidebar.
2. Trải nghiệm bằng cách ngắt bình luận comment (disable) biến đăng ký của một Feature bất kì (ví dụ `// ordersPlugin`). Nếu Sidebar mất biểu tượng "Đơn hàng" và URL `localhost:5173/orders` báo lỗi 404 Not Found thì tức là Hệ thống Decoupling đã hoạt động 100% chuẩn xác.

> **Note cho AI**: Khi kích hoạt `/plugin-system`, hãy thực hiện làm mẫu đúng 1 module đầu tiên (vd: Customer) để User nắm được đường lối thiết kế, sau đó tiến hành hàng loạt theo xác nhận.
