import type { UserRole } from '@/services/supabase/database.types'

/**
 * FeaturePlugin — Interface chuẩn cho mỗi module/plugin trong hệ thống.
 *
 * Mỗi feature đăng ký vào FeatureRegistry thông qua interface này.
 * Hệ thống sẽ tự động generate routes, navigation menu và phân quyền.
 */
export interface FeaturePlugin {
  /** Unique key, dùng làm identifier. Ví dụ: 'work-orders' */
  key: string

  /** Route path (không có '/'), ví dụ: 'work-orders' */
  route: string

  /** Tên hiển thị đầy đủ trên menu. Ví dụ: 'Lệnh Sản Xuất' */
  label: string

  /** Tên ngắn cho mobile bottom nav. Ví dụ: 'Lệnh SX' */
  shortLabel: string

  /** Mô tả ngắn cho tooltip/subtitle */
  description: string

  /** Icon key theo lucide-react naming. Ví dụ: 'package' */
  icon?: string

  /** Roles được phép thấy trên menu. Nếu undefined → tất cả authenticated users */
  requiredRoles?: UserRole[]

  /**
   * Route-level access control group.
   * - undefined: route nằm trong appRoutes (tất cả authenticated users)
   * - 'manager': route cần ProtectedRoute(admin, manager)
   * - 'admin': route cần ProtectedRoute(admin)
   *
   * Phân biệt với requiredRoles: requiredRoles chỉ ẩn menu,
   * routeGuard thực sự block truy cập ở tầng router.
   */
  routeGuard?: 'manager' | 'admin'

  /** Hiển thị trên mobile bottom bar */
  primaryMobile?: boolean

  /** Lazy-loaded page component */
  component: () => Promise<{ default: React.ComponentType }>

  /** Thứ tự hiển thị trên menu (nhỏ = ưu tiên cao) */
  order?: number

  /** Nhóm menu: sales, production, master-data, system */
  group?: 'sales' | 'production' | 'master-data' | 'system'

  /** Print routes */
  printRoutes?: Array<{
    path: string
    component: () => Promise<{ default: React.ComponentType }>
  }>

  /** Sub-routes (ví dụ: detail page) */
  subRoutes?: Array<{
    path: string
    component: () => Promise<{ default: React.ComponentType }>
  }>
}

/**
 * FeatureRegistry — Singleton quản lý tất cả plugins đã đăng ký.
 *
 * Thay vì hardcode routes và navigation trong AppRouter,
 * mỗi feature tự đăng ký vào Registry khi app khởi động.
 *
 * Usage:
 *   registry.register(workOrdersPlugin)
 *   registry.register(bomPlugin)
 *   const routes = registry.getRoutes()
 *   const navItems = registry.getNavItems('admin')
 */
class FeatureRegistryClass {
  private plugins: Map<string, FeaturePlugin> = new Map()

  /** Đăng ký một plugin vào hệ thống */
  register(plugin: FeaturePlugin): void {
    if (this.plugins.has(plugin.key)) {
      console.warn(`[FeatureRegistry] Plugin "${plugin.key}" đã được đăng ký, sẽ bị ghi đè.`)
    }
    this.plugins.set(plugin.key, plugin)
  }

  /** Đăng ký nhiều plugins cùng lúc */
  registerAll(plugins: FeaturePlugin[]): void {
    for (const plugin of plugins) {
      this.register(plugin)
    }
  }

  /** Lấy tất cả plugins đã đăng ký */
  getAll(): FeaturePlugin[] {
    return Array.from(this.plugins.values())
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
  }

  /** Lấy plugin theo key */
  get(key: string): FeaturePlugin | undefined {
    return this.plugins.get(key)
  }

  /** Kiểm tra plugin có tồn tại không */
  has(key: string): boolean {
    return this.plugins.has(key)
  }

  /** Lấy danh sách navigation items, lọc theo role */
  getNavItems(userRole?: UserRole): FeaturePlugin[] {
    return this.getAll().filter((plugin) => {
      if (!plugin.requiredRoles) return true
      if (!userRole) return false
      return plugin.requiredRoles.includes(userRole)
    })
  }

  /** Lấy danh sách app routes (cho authenticated users) */
  getAppRoutes(): FeaturePlugin[] {
    return this.getAll().filter((p) => !p.requiredRoles)
  }

  /** Lấy routes có yêu cầu quyền cao (manager/admin) */
  getRoleRoutes(roles: UserRole[]): FeaturePlugin[] {
    return this.getAll().filter((p) =>
      p.requiredRoles && p.requiredRoles.some((r) => roles.includes(r)),
    )
  }

  /** Lấy routes theo nhóm */
  getByGroup(group: FeaturePlugin['group']): FeaturePlugin[] {
    return this.getAll().filter((p) => p.group === group)
  }

  /** Lấy danh sách print routes từ tất cả plugins */
  getPrintRoutes(): Array<{ path: string; component: () => Promise<{ default: React.ComponentType }> }> {
    const routes: Array<{ path: string; component: () => Promise<{ default: React.ComponentType }> }> = []
    for (const plugin of this.getAll()) {
      if (plugin.printRoutes) {
        routes.push(...plugin.printRoutes)
      }
    }
    return routes
  }

  /** Xóa plugin (dùng cho hot-reload hoặc disable feature) */
  unregister(key: string): void {
    this.plugins.delete(key)
  }

  /** Reset toàn bộ registry (dùng cho testing) */
  clear(): void {
    this.plugins.clear()
  }
}

/** Singleton instance */
export const FeatureRegistry = new FeatureRegistryClass()
