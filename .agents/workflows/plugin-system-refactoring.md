---
description: Implement Level 9 Architecture Plugin System & Feature Registry
---

---

## description: Implement Level 9 Architecture — Plugin System & Feature Registry

# Plugin System & Feature Registry (Level 9)

Chuyển đổi từ "Hard-coded Router & Sidebar" sang Decentralized Feature Modules.
Mỗi feature tự đóng gói toàn bộ Route, Menu, Hooks của riêng nó.

> **Môi trường:** React SPA (CSR) + React Router v6.4+ + Vite.
> SSR (Next.js/Remix): thay Singleton bằng factory per-request để tránh state leak giữa các request.

---

## Pre-requisites

- [ ] App ổn định, các luồng chính hoạt động trơn tru.
- [ ] React Router v6.4+, `lucide-react` đã cài.

---

## Step 1 — Types & Registry

**`src/app/types/plugin.ts`**

```ts
import type { ComponentType, ReactNode } from 'react';
import type { RouteObject } from 'react-router-dom';

export type PluginGroup =
  | 'sales'
  | 'production'
  | 'inventory'
  | 'finance'
  | 'hr'
  | 'settings'
  | (string & {});

export interface ERPPlugin {
  id: string;
  name: string;
  icon: ComponentType<{ className?: string }>;
  requiredRoles: string[];
  requiredPermissions?: string[]; // granular RBAC — user cần ≥1 permission
  group: PluginGroup;
  order: number;
  entryPath: string; // link Sidebar — KHÔNG dùng routes[0].path
  routes: RouteObject[];
  dependencies?: string[]; // ['module-customers'] — load trước plugin này
  onInit?: () => Promise<void>;
  badge?: () => ReactNode;
}
```

**`src/app/registry/FeatureRegistry.ts`**

```ts
import type { ERPPlugin } from '@/app/types/plugin';
import type { RouteObject } from 'react-router-dom';

class FeatureRegistryClass {
  private plugins = new Map<string, ERPPlugin>();
  private initialized = false;

  register(plugin: ERPPlugin): this {
    if (this.plugins.has(plugin.id))
      throw new Error(`[Registry] Plugin "${plugin.id}" đã tồn tại.`);
    this.plugins.set(plugin.id, plugin);
    return this; // hỗ trợ chaining
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    for (const plugin of this.resolveDependencyOrder()) {
      try {
        await plugin.onInit?.();
      } catch (e) {
        console.error(`[Registry] onInit "${plugin.id}" thất bại:`, e);
      }
    }
    this.initialized = true;
  }

  getVisiblePlugins(roles: string[], perms: string[] = []): ERPPlugin[] {
    return [...this.plugins.values()].filter((p) => {
      if (!p.requiredRoles.some((r) => roles.includes(r))) return false;
      if (p.requiredPermissions?.length)
        return p.requiredPermissions.some((p2) => perms.includes(p2));
      return true;
    });
  }

  getAllRoutes(): RouteObject[] {
    return [...this.plugins.values()].flatMap((p) => p.routes);
  }

  // Topological sort — phát hiện circular dependency
  private resolveDependencyOrder(): ERPPlugin[] {
    const result: ERPPlugin[] = [],
      visited = new Set<string>(),
      visiting = new Set<string>();
    const visit = (id: string) => {
      if (visited.has(id)) return;
      if (visiting.has(id))
        throw new Error(`[Registry] Circular dependency: "${id}"`);
      const p = this.plugins.get(id);
      if (!p) throw new Error(`[Registry] Plugin "${id}" chưa được đăng ký.`);
      visiting.add(id);
      p.dependencies?.forEach(visit);
      visiting.delete(id);
      visited.add(id);
      result.push(p);
    };
    this.plugins.forEach((_, id) => visit(id));
    return result;
  }
}

export const FeatureRegistry = new FeatureRegistryClass();
```

---

## Step 2 — Dynamic Sidebar

Xóa `MENU_ITEMS` tĩnh, thay bằng (`src/app/layouts/Sidebar.tsx`):

```tsx
const GROUP_ORDER = [
  'sales',
  'production',
  'inventory',
  'finance',
  'hr',
  'settings',
];
const GROUP_LABELS: Record<string, string> = {
  sales: 'Bán hàng',
  production: 'Sản xuất',
  inventory: 'Kho hàng',
  finance: 'Tài chính',
  hr: 'Nhân sự',
  settings: 'Cài đặt',
};

export function Sidebar() {
  const { user } = useAuth();
  const plugins = FeatureRegistry.getVisiblePlugins(
    user.roles,
    user.permissions,
  );

  const grouped = plugins.reduce<Record<string, ERPPlugin[]>>((acc, p) => {
    (acc[p.group] ??= []).push(p);
    return acc;
  }, {});
  Object.values(grouped).forEach((g) => g.sort((a, b) => a.order - b.order));
  const sortedGroups = [
    ...GROUP_ORDER.filter((g) => grouped[g]),
    ...Object.keys(grouped).filter((g) => !GROUP_ORDER.includes(g)),
  ];

  return (
    <nav>
      {sortedGroups.map((group) => (
        <div key={group}>
          <span>{GROUP_LABELS[group] ?? group}</span>
          {grouped[group].map((p) => (
            <NavLink key={p.id} to={p.entryPath}>
              <p.icon /> <span>{p.name}</span> {p.badge?.()}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );
}
```

---

## Step 3 — Đóng Gói Feature (Lazy Loading bắt buộc)

Tạo `[name].plugin.tsx` trong thư mục gốc của **mỗi** feature:

```tsx
// src/features/orders/orders.plugin.tsx
import { BookOpen } from 'lucide-react';
import { lazy, Suspense } from 'react';
import type { ERPPlugin } from '@/app/types/plugin';

const OrdersPage = lazy(() => import('./OrdersPage'));
const OrderDetail = lazy(() => import('./OrderDetail'));
const OrderCreate = lazy(() => import('./OrderCreate'));

// Wrapper chuẩn: ErrorBoundary + Suspense cho mọi route element
const wrap = (C: ReturnType<typeof lazy>) => (
  <ModuleErrorBoundary>
    <Suspense fallback={<LoadingIndicator />}>
      <C />
    </Suspense>
  </ModuleErrorBoundary>
);

export const ordersPlugin: ERPPlugin = {
  id: 'module-orders',
  name: 'Đơn hàng',
  icon: BookOpen,
  requiredRoles: ['admin', 'sale'],
  requiredPermissions: ['orders.view'],
  group: 'sales',
  order: 1,
  entryPath: '/orders',
  dependencies: ['module-customers'],
  routes: [
    { path: '/orders', element: wrap(OrdersPage) },
    { path: '/orders/create', element: wrap(OrderCreate) },
    { path: '/orders/:id', element: wrap(OrderDetail) },
  ],
  onInit: async () => {
    /* preload config, setup store... */
  },
  badge: () => <OrdersPendingBadge />,
};
```

**`ModuleErrorBoundary`** — bắt lỗi lazy chunk thất bại (`src/components/ui/ModuleErrorBoundary.tsx`):

```tsx
export class ModuleErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(e: Error) {
    console.error('[ModuleErrorBoundary]', e);
  }
  render() {
    return this.state.hasError ? (
      <div>
        <p>Không thể tải module.</p>
        <button onClick={() => this.setState({ hasError: false })}>
          Thử lại
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
```

---

## Step 4 — Đăng ký & Khởi tạo

**`src/app/plugins.ts`** — đăng ký theo thứ tự dependency:

```ts
import { FeatureRegistry } from './registry/FeatureRegistry';
import { customersPlugin } from '@/features/customers/customers.plugin';
import { ordersPlugin } from '@/features/orders/orders.plugin';
// customers trước vì orders depends on it
FeatureRegistry.register(customersPlugin).register(ordersPlugin);
export { FeatureRegistry };
```

**`src/app/router/AppRouter.tsx`**:

```tsx
const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        element: (
          <ModuleErrorBoundary>
            <Suspense fallback={<LoadingIndicator />}>
              <Outlet />
            </Suspense>
          </ModuleErrorBoundary>
        ),
        children: FeatureRegistry.getAllRoutes(),
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);

export const AppRouter = () => <RouterProvider router={router} />;
```

**`src/main.tsx`** — init trước khi render:

```tsx
async function bootstrap() {
  await FeatureRegistry.init();
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
bootstrap().catch(console.error);
```

---

## Step 5 — Dọn dẹp & Xác Vận

**Checklist:**

- [ ] Xóa `MENU_ITEMS` tĩnh trong Sidebar.
- [ ] Xóa routes hard-coded trong `App.tsx`.
- [ ] Xóa import page component trực tiếp (không qua lazy).

**Smoke test:**

```
1. Comment out một plugin: // .register(ordersPlugin)
2. Kết quả kỳ vọng:
   ✅ Sidebar mất mục "Đơn hàng"
   ✅ /orders → 404 Not Found
   ✅ Không có console error liên quan module khác
   ✅ App không crash
```

**Bundle check:**

```bash
npx vite build
# orders-[hash].js, customers-[hash].js → mỗi feature là 1 chunk riêng ✅
```

---

> **Note cho AI:** Khi kích hoạt `/plugin-system-refactoring`, làm mẫu **1 module đầu tiên** (vd: `customers`) để User nắm đường lối, đợi xác nhận rồi mới tiến hành hàng loạt. Ưu tiên tạo `ModuleErrorBoundary` và `FeatureRegistry` trước tất cả các bước khác.
