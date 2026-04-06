import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

import { LazyPage } from '@/app/router/LazyPage'
import type { UserRole } from '@/services/supabase/database.types'

/* ── Lazy-loaded page components (code-split per route) ── */
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const AuthPage = lazy(() => import('@/features/auth').then((m) => ({ default: m.AuthPage })))
const CustomersPage = lazy(() => import('@/features/customers').then((m) => ({ default: m.CustomersPage })))
const FinishedFabricPage = lazy(() => import('@/features/finished-fabric').then((m) => ({ default: m.FinishedFabricPage })))
const InventoryPage = lazy(() => import('@/features/inventory').then((m) => ({ default: m.InventoryPage })))
const OrderProgressPage = lazy(() => import('@/features/order-progress').then((m) => ({ default: m.OrderProgressPage })))
const OrdersPage = lazy(() => import('@/features/orders').then((m) => ({ default: m.OrdersPage })))
const QuotationsPage = lazy(() => import('@/features/quotations').then((m) => ({ default: m.QuotationsPage })))
const QuotationPrintPage = lazy(() => import('@/features/quotations').then((m) => ({ default: m.QuotationPrint })))
const PaymentsPage = lazy(() => import('@/features/payments').then((m) => ({ default: m.PaymentsPage })))
const RawFabricPage = lazy(() => import('@/features/raw-fabric').then((m) => ({ default: m.RawFabricPage })))
const ReportsPage = lazy(() => import('@/features/reports').then((m) => ({ default: m.ReportsPage })))
const SettingsPage = lazy(() => import('@/features/settings').then((m) => ({ default: m.SettingsPage })))
const ShipmentsPage = lazy(() => import('@/features/shipments').then((m) => ({ default: m.ShipmentsPage })))
const ShippingRatesPage = lazy(() => import('@/features/shipping-rates').then((m) => ({ default: m.ShippingRatesPage })))
const SuppliersPage = lazy(() => import('@/features/suppliers').then((m) => ({ default: m.SuppliersPage })))
const YarnCatalogPage = lazy(() => import('@/features/yarn-catalog').then((m) => ({ default: m.YarnCatalogPage })))
const FabricCatalogPage = lazy(() => import('@/features/fabric-catalog').then((m) => ({ default: m.FabricCatalogPage })))
const YarnReceiptsPage = lazy(() => import('@/features/yarn-receipts').then((m) => ({ default: m.YarnReceiptsPage })))
const BomPage = lazy(() => import('@/features/bom').then((m) => ({ default: m.BomPage })))
const WorkOrdersPage = lazy(() => import('@/features/work-orders').then((m) => ({ default: m.WorkOrdersPage })))
const OrderKanbanPage = lazy(() => import('@/features/order-kanban').then((m) => ({ default: m.OrderKanbanPage })))
const WeavingInvoicesPage = lazy(() => import('@/features/weaving-invoices/WeavingInvoicesPage').then((m) => ({ default: m.WeavingInvoicesPage })))

export type NavigationItem = {
  path: string
  label: string
  shortLabel: string
  description: string
  primaryMobile?: boolean
  /** Nếu có, chỉ hiển thị và cho phép truy cập với các role này. */
  requiredRoles?: UserRole[]
}

export const navigationItems: NavigationItem[] = [
  {
    path: '/',
    label: 'Tổng quan',
    shortLabel: 'Home',
    description: 'Tổng quan scaffold, trạng thái hiện tại và các bước tiếp theo.',
    primaryMobile: true,
  },
  {
    path: '/quotations',
    label: 'Báo giá',
    shortLabel: 'Báo giá',
    description: 'Tạo và quản lý báo giá, VAT, chiết khấu, chuyển thành đơn hàng.',
    primaryMobile: true,
    requiredRoles: ['admin', 'manager', 'sale'],
  },
  {
    path: '/orders',
    label: 'Đơn hàng',
    shortLabel: 'Orders',
    description: 'Quản lý đơn hàng, chi tiết dòng hàng, giữ chỗ và ngày giao.',
    primaryMobile: true,
  },
  {
    path: '/order-progress',
    label: 'Tiến độ đơn hàng',
    shortLabel: 'Progress',
    description: 'Timeline và cập nhật tiến độ cho từng dòng hàng.',
    primaryMobile: true,
  },
  {
    path: '/shipments',
    label: 'Xuất kho',
    shortLabel: 'Ship',
    description: 'Tạo phiếu xuất từ đơn hàng và đồng bộ tồn kho.',
    primaryMobile: true,
  },
  {
    path: '/inventory',
    label: 'Tồn kho',
    shortLabel: 'Stock',
    description: 'Tồn khả dụng, tồn giữ chỗ, cảnh báo tồn thấp và truy vết.',
    primaryMobile: true,
  },
  {
    path: '/customers',
    label: 'Khách hàng',
    shortLabel: 'Customers',
    description: 'Quản lý khách hàng, liên hệ và công nợ.',
  },
  {
    path: '/suppliers',
    label: 'Nhà cung cấp',
    shortLabel: 'Suppliers',
    description: 'Quản lý nhà cung cấp sợi, dệt, nhuộm và logistics.',
  },
  {
    path: '/yarn-catalog',
    label: 'Danh mục sợi',
    shortLabel: 'Danh mục',
    description: 'Quản lý danh mục loại sợi — nền cho luồng nhập sợi.',
  },
  {
    path: '/fabric-catalog',
    label: 'Danh mục vải',
    shortLabel: 'Vải',
    description: 'Quản lý danh mục loại vải — dùng chung cho vải mộc và thành phẩm.',
  },
  {
    path: '/yarn-receipts',
    label: 'Nhập sợi',
    shortLabel: 'Yarn',
    description: 'Nhập nguyên liệu sợi và tạo phiếu nhập kho.',
  },
  {
    path: '/bom',
    label: 'Định mức (BOM)',
    shortLabel: 'BOM',
    description: 'Cấu hình định mức nguyên vật liệu sợi cho từng mã vải mộc.',
    requiredRoles: ['admin', 'manager'],
  },
  {
    path: '/work-orders',
    label: 'Lệnh sản xuất',
    shortLabel: 'Lệnh SX',
    description: 'Chỉ đạo sản xuất và tự động phân bổ nguồn lực sợi.',
  },
  {
    path: '/raw-fabric',
    label: 'Nhập vải mộc',
    shortLabel: 'Raw',
    description: 'Theo dõi lô vải mộc và mapping với nguyên liệu, nhà dệt.',
  },
  {
    path: '/weaving-invoices',
    label: 'Phiếu gia công',
    shortLabel: 'Gia công',
    description: 'Quản lý phiếu gia công dệt theo lô — tính công nợ nhà dệt tự động.',
  },
  {
    path: '/finished-fabric',
    label: 'Vải thành phẩm',
    shortLabel: 'Finished',
    description: 'Nhập thành phẩm và cập nhật sản lượng đã xử lý.',
  },
  {
    path: '/payments',
    label: 'Thu Chi',
    shortLabel: 'Thu Chi',
    description: 'Quản lý thu chi, phiếu thu, phiếu chi, dòng tiền và công nợ.',
  },
  {
    path: '/reports',
    label: 'Báo cáo',
    shortLabel: 'Reports',
    description: 'Dashboard KPI, đơn hàng trễ, doanh thu và sức khoẻ kho.',
    requiredRoles: ['admin', 'manager'],
  },
  {
    path: '/shipping-rates',
    label: 'Giá cước vận chuyển',
    shortLabel: 'Cước VC',
    description: 'Quản lý bảng giá cước vận chuyển theo khu vực.',
    requiredRoles: ['admin'],
  },
  {
    path: '/settings',
    label: 'Cài đặt',
    shortLabel: 'Settings',
    description: 'Cấu hình môi trường, phân quyền, đồng bộ và triển khai.',
    requiredRoles: ['admin'],
  },
  {
    path: '/order-kanban',
    label: 'Kanban Đơn Hàng',
    shortLabel: 'Kanban',
    description: 'Quản lý đơn hàng theo trạng thái trực quan.',
    requiredRoles: ['admin', 'manager', 'sale'],
  },
]

export const authRoute: RouteObject = { path: 'auth', element: <LazyPage><AuthPage /></LazyPage> }

/** Routes cho tất cả authenticated user */
export const appRoutes: RouteObject[] = [
  { index: true, element: <DashboardPage /> },
  { path: 'customers', element: <LazyPage><CustomersPage /></LazyPage> },
  { path: 'suppliers', element: <LazyPage><SuppliersPage /></LazyPage> },
  { path: 'yarn-catalog', element: <LazyPage><YarnCatalogPage /></LazyPage> },
  { path: 'fabric-catalog', element: <LazyPage><FabricCatalogPage /></LazyPage> },
  { path: 'yarn-receipts', element: <LazyPage><YarnReceiptsPage /></LazyPage> },
  { path: 'raw-fabric', element: <LazyPage><RawFabricPage /></LazyPage> },
  { path: 'finished-fabric', element: <LazyPage><FinishedFabricPage /></LazyPage> },
  { path: 'quotations', element: <LazyPage><QuotationsPage /></LazyPage> },
  { path: 'orders', element: <LazyPage><OrdersPage /></LazyPage> },
  { path: 'order-progress', element: <LazyPage><OrderProgressPage /></LazyPage> },
  { path: 'shipments', element: <LazyPage><ShipmentsPage /></LazyPage> },
  { path: 'payments', element: <LazyPage><PaymentsPage /></LazyPage> },
  { path: 'inventory', element: <LazyPage><InventoryPage /></LazyPage> },
  { path: 'work-orders', element: <LazyPage><WorkOrdersPage /></LazyPage> },
  { path: 'order-kanban', element: <LazyPage><OrderKanbanPage /></LazyPage> },
  { path: 'weaving-invoices', element: <LazyPage><WeavingInvoicesPage /></LazyPage> },
]

export const printRoutes: RouteObject[] = [
  { path: 'print/quotation/:id', element: <LazyPage><QuotationPrintPage /></LazyPage> },
]

/** Routes chỉ dành cho admin và manager */
export const managerRoutes: RouteObject[] = [
  { path: 'bom', element: <LazyPage><BomPage /></LazyPage> },
  { path: 'reports', element: <LazyPage><ReportsPage /></LazyPage> },
]

/** Routes chỉ dành cho admin */
export const adminRoutes: RouteObject[] = [
  { path: 'settings', element: <LazyPage><SettingsPage /></LazyPage> },
  { path: 'shipping-rates', element: <LazyPage><ShippingRatesPage /></LazyPage> },
]