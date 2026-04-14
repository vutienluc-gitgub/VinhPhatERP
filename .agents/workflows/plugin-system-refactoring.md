---
description: Implement Level 9 Architecture Plugin System & Feature Registry
---

# Workflow: Triển khai Kiến trúc Plugin & Feature Registry (Level 9)

Workflow này hướng dẫn các bước tiêu chuẩn để chuyển đổi cấu trúc ứng dụng từ "Hard-coded Router & Sidebar Menu" sang hệ thống Plugin Registry phi tập trung (Decentralized Feature Modules).

Mỗi tính năng (vd: shipments, orders, customers) sẽ tự đóng gói toàn bộ logic (Route, Menu Item, Hooks) của riêng nó.

## Pre-requisites

- [ ] Ứng dụng React đang rảnh, mọi luồng chức năng quan trọng (Nhập/Xuất/Tài chính) đều đã hoạt động trơn tru.

## Step 1: Khởi tạo Core Registry

Thiết lập thư viện cốt lõi (`FeatureRegistry`) để lưu trữ và quản lý quyền hoạt động của các module độc lập.

1. Khởi tạo interface tiêu chuẩn cho Feature:
   - `id`: Tên module định danh (vd: `feature-orders`).
   - `name`: Tên tiếng Việt để hiển thị Menu.
   - `icon`: Lucide icon component.
   - `requiredRoles`: Mảng các quyền được phép truy cập (RBAC) (vd: `['admin', 'sale']`).
   - `group`: Nhóm menu (vd: `sales`, `production`, `inventory`) để Sidebar tự động gom nhóm, tránh danh sách phẳng lộn xộn.
   - `order`: Số thứ tự ưu tiên hiển thị trên Sidebar.
   - `routes`: Mảng định tuyến (React Router data objects - có khả năng chứa cấu trúc nested routes).
2. Viết file `src/app/plugins.ts` làm bộ chứa Singleton (Registry Class / Hoặc Array Export) để khai báo các plugins.
3. Tạo file `src/app/types/plugin.ts` để lưu `interface ERPPlugin`.

## Step 2: Cấu hình Menu Động (Dynamic Sidebar)

1. Truy cập `src/app/layouts/Sidebar.tsx` hoặc file cấu hình layout tương đương.
2. Xoá mảng tĩnh `MENU_ITEMS` hiện hữu.
3. Cập nhật Sidebar để duyệt qua toàn bộ biến `plugins` đã đăng ký ở Bước 1.
   - Lọc các plugins theo quyền (Roles) của user hiện tại.
   - Group (Gom nhóm) các tính năng đồng dạng theo thuộc tính `group`.
   - Sắp xếp (Sort) theo thuộc tính `order`.
   - Hiển thị `name` và `icon` tương ứng lên Sidebar. Chèn đường link dẫn vào trang chủ của module bằng `routes[0].path`.

## Step 3: Đóng Gói (Encapsulate) Các Feature (TUYỆT ĐỐI CẦN LAZY LOADING)

Đây là phần việc tốn nhiều thời gian nhất. Lặp lại với **TUYỆT ĐỐI TẤT CẢ** các folder bên trong `src/features/*`:

1. Tạo file `[feature_name].plugin.tsx` ngay tại thư mục gốc của feature (Vd: `src/features/orders/orders.plugin.tsx`).
2. Mở file mới này, khởi tạo Plugin object bằng kỹ thuật **Lazy Loading** (Nhằm tối ưu hoá Bundle Size, tránh việc tải toàn bộ code cùng một lúc làm đứng app):

   ```tsx
   import { BookOpen } from 'lucide-react';
   import { lazy } from 'react';
   import type { ERPPlugin } from '@/app/types/plugin';

   // BẮT BUỘC SỬ DỤNG LAZY ĐỂ TRÁNH VI PHẠM "BUNDLE SIZE" LAZY LOADING
   const OrdersPage = lazy(() => import('./OrdersPage'));
   const OrderDetail = lazy(() => import('./OrderDetail'));
   const OrderCreate = lazy(() => import('./OrderCreate'));

   export const ordersPlugin: ERPPlugin = {
     id: 'module-orders',
     name: 'Đơn hàng',
     icon: BookOpen,
     requiredRoles: ['admin', 'sale'],
     group: 'sales',
     order: 1,
     routes: [
       { path: '/orders', element: <OrdersPage /> },
       { path: '/orders/create', element: <OrderCreate /> },
       { path: '/orders/:id', element: <OrderDetail /> },
     ],
   };
   ```

3. Đem file của tính năng vừa đóng gói import vào biến cấu hình chính trong `src/app/plugins.ts`.

## Step 4: Cơ Sở Chuyển Đổi Router & Xử lý Nested Routes

1. Trong file `src/app/router/routes.tsx` (hoặc `App.tsx` tùy kiến trúc):
2. Bọc các khu vực hiển thị Content bởi một thẻ `<Suspense fallback={<LoadingIndicator />}>` để đảm bảo tương thích với Lazy Loading.
3. Load danh sách routes từ `FeatureRegistry.getAllRoutes()`.
4. Vì mảng routes của Plugin sẽ chứa nhiều objects rời rạc (cả list, chi tiết, tạo mới), bộ chuyển đổi Router cần phải lặp qua danh sách mảng phẳng (flat array) một cách trơn tru để tương thích mượt mà với React Router, nhằm lồng nó dưới thẻ `<Outlet />` (hoặc layout chính).

## Step 5: Dọn dẹp & Xác Vận

1. Xoá mọi liên kết rác, routes tĩnh dư thừa đi.
2. Trải nghiệm bằng cách ngắt bình luận comment (disable) biến đăng ký của một Feature bất kì (ví dụ `// ordersPlugin`). Nếu Sidebar mất biểu tượng "Đơn hàng" và URL `localhost:5173/orders` báo lỗi 404 Not Found thì tức là Hệ thống Plugin Decouple đã hoạt động 100% chuẩn xác.

> **Note cho AI**: Khi kích hoạt `/plugin-system-refactoring`, hãy thực hiện làm mẫu đúng 1 module đầu tiên (vd: Customer) để User nắm được đường lối thiết kế, sau đó đợi User xác nhận rồi mới tiến hành hàng loạt.
