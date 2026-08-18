import type { ComponentType, ReactNode } from 'react';

import type { UserRole } from '@/shared/types/database.models';

// ─── Plugin Groups ─────────────────────────────────────────────────────────────

export type PluginGroup =
  | 'sales'
  | 'production'
  | 'warehouse'
  | 'finance'
  | 'master-data'
  | 'system'
  | (string & {});

// ─── Plugin Lifecycle States ────────────────────────────────────────────────────

export type PluginLifecycleState =
  | 'registered'
  | 'initializing'
  | 'initialized'
  | 'failed'
  | 'blocked';

// ─── Route Definition ──────────────────────────────────────────────────────────

export interface PluginRouteDefinition {
  path?: string;
  component?: () => Promise<{ default: ComponentType }>;
  children?: PluginRouteDefinition[];

  // Legacy RouteObject compat (bom.plugin, settings.plugin use these)
  /** @deprecated Use component instead */
  element?: ReactNode;
  /** @deprecated Use path instead */
  index?: boolean;
}

// ─── Plugin Contract ────────────────────────────────────────────────────────────

/**
 * ERPPlugin — Level 9 Plugin Contract.
 *
 * Mỗi feature tự mô tả toàn bộ routes, RBAC, navigation metadata,
 * lifecycle hooks, và business dependencies.
 *
 * Registry chỉ orchestrate lifecycle — KHÔNG phụ thuộc React rendering.
 */
export interface ERPPlugin {
  /** Unique technical key (e.g. 'customers', 'orders', 'work-orders') */
  key: string;

  /** Tên hiển thị đầy đủ trên menu */
  label: string;

  /** Tên ngắn gọn cho mobile navigation */
  shortLabel: string;

  /** Mô tả nghiệp vụ */
  description: string;

  /** Icon identifier (lucide icon name) */
  icon?: string;

  /** Phân nhóm nghiệp vụ trên Sidebar */
  group: PluginGroup;

  /** Thứ tự sắp xếp trong group (nhỏ hơn = ưu tiên cao hơn) */
  order: number;

  /** Đường dẫn chính của feature (dành cho menu link, e.g. '/customers') */
  entryPath?: string;

  /**
   * Business Feature Lifecycle Dependencies.
   *
   * CHỈ khai báo khi onInit() của plugin này bắt buộc plugin khác
   * phải khởi tạo thành công trước. KHÔNG dùng cho TypeScript type imports.
   */
  dependencies?: string[];

  /**
   * Coarse-grained RBAC: User cần có >= 1 role trong mảng này.
   * Nếu undefined -> tất cả authenticated users.
   *
   * Accepts string[] for backward compat during migration.
   */
  requiredRoles?: UserRole[] | string[];

  /**
   * Fine-grained RBAC: User cần có >= 1 permission trong mảng này.
   *
   * Khi kết hợp với requiredRoles:
   *   SEMANTICS = (Role Match) AND (Permission Match)
   */
  requiredPermissions?: string[];

  /** Route-level guard enforcement (chặn URL ở router) */
  routeGuard?: 'manager' | 'admin';

  /** Hiển thị trên mobile bottom bar ưu tiên */
  primaryMobile?: boolean;

  /** Khai báo mạng routes của feature (hỗ trợ nested) */
  routes?: PluginRouteDefinition[];

  /** Print routes chuyên dụng */
  printRoutes?: Array<{
    path: string;
    component: () => Promise<{ default: ComponentType }>;
  }>;

  /**
   * Lifecycle hook bất đồng bộ.
   *
   * Chạy một lần duy nhất khi khởi động theo thứ tự dependency.
   * Nếu throw, plugin = 'failed', dependents = 'blocked'.
   */
  onInit?: () => Promise<void>;

  // ─── Legacy Fields (backward compat, will be removed after migration) ──────

  /**
   * @deprecated Use `entryPath` instead. Kept during migration.
   * Single route path for legacy plugin format.
   */
  route?: string;

  /**
   * @deprecated Use `routes` array instead. Kept during migration.
   * Single lazy component for legacy plugin format.
   */
  component?: () => Promise<{ default: ComponentType }>;

  /**
   * @deprecated Use `routes` with nested children instead. Kept during migration.
   */
  subRoutes?: Array<{
    path: string;
    component: () => Promise<{ default: ComponentType }>;
  }>;
}
