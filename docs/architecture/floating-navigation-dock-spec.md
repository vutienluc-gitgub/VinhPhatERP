# Floating Navigation Dock + Integrated FAB — Đặc tả chuẩn VinhPhatERP

> **Nguồn:** Issue [#40](https://github.com/vutienluc-gitgub/VinhPhatERP/issues/40) + bản nháp `floating_navigation_bar_implementation_guide.md`.
> **Trạng thái:** Đặc tả đã hiệu chỉnh theo chuẩn dự án. Chưa triển khai — phải qua Gate.
> **Phạm vi:** Thành phần điều hướng nổi dùng chung (`src/shared/`) cho mobile.

Bản nháp gốc là template của một dự án khác (có module `glucose`, dùng `lucide-react` trực tiếp, màu `slate/rose/emerald`). Tài liệu này giữ lại **ý tưởng thiết kế** (dock nổi + FAB + bottom sheet) và viết lại phần triển khai cho khớp:

- **Kiến trúc Level 7 (Domain Pattern)** — luồng dữ liệu 1 chiều: View → use-case hook → Domain → API → cache/UI.
- **Kiến trúc Level 9 (Plugin & Feature Independence)** — **zero cross-feature import**: thành phần chung nằm ở `src/shared/`, nghiệp vụ nằm trong `src/features/`.

Đối chiếu quy tắc: [`.erp-rules.md`](../../.erp-rules.md) · [`.agents/context/icon-system.md`](../../.agents/context/icon-system.md) · [`docs/coding-rules.md`](../coding-rules.md).

---

## 1. Delta: bản nháp → chuẩn dự án

| #   | Bản nháp (SAI)                                                     | Chuẩn VinhPhatERP                                                                                                                                  | Rule        |
| --- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| 1   | Tạo mới `src/shared/components/AdaptiveSheet.tsx`                  | **Tái dùng** `src/shared/components/AdaptiveSheet.tsx` (đã có: `open`, `header`, `subHeader`, `footer`, `stepInfo`, `size`, portal, swipe-dismiss) | 1, 12       |
| 2   | `import { LucideIcon } from "lucide-react"`, render `<Icon />` thô | **Cấm** import trực tiếp lucide (ESLint `no-restricted-imports`). Dùng `<Icon name={IconName} />`, icon là **chuỗi**                               | icon-system |
| 3   | `bg-white/95`, `slate-*`, `emerald-*`, `#142d25`                   | Chỉ **semantic token**: `bg-surface-strong`, `border-border`, `text-primary`, `bg-primary/10`…                                                     | 17          |
| 4   | Badge `bg-rose-500 text-white` (3.67:1 — **FAIL** AA)              | `bg-danger text-inverse-foreground` (`#c0392b`, **5.44:1 — PASS**)                                                                                 | 21          |
| 5   | Tạo mới `src/shared/types/navigation.ts`                           | **Dùng lại** `NavigationItem` (`src/app/router/routes.tsx`) + `BottomTabItem` (`src/app/layouts/MobileBottomNav.tsx`)                              | 1           |
| 6   | `src/app/AppShell.tsx`                                             | `src/app/layouts/AppShell.tsx`                                                                                                                     | —           |
| 7   | `console.log("Submit reading payload:", values)`                   | Cấm log debug production                                                                                                                           | 18          |
| 8   | Nhãn tiếng Anh (`Home`, `Log`, `Insight`)                          | Chuỗi tập trung + tiếng Việt: `APP_SHELL_LABELS`, `UI_LABELS`                                                                                      | 2           |
| 9   | Module mẫu `features/glucose/` (đường huyết)                       | **Không có domain này**. Thay bằng quick-action ERP thật: `QUICK_ACTIONS`                                                                          | 5, 15       |
| 10  | Không có test                                                      | Bắt buộc regression test                                                                                                                           | 22          |
| 11  | Dock luôn hiển thị                                                 | Phải `md:hidden` (nếu không sẽ nổi đè desktop)                                                                                                     | 17, 21      |

---

## 2. Thành phần đã có — KHÔNG tạo lại

| Thành phần                         | Đường dẫn                                 | Vai trò trong tính năng                                                           |
| ---------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------- |
| `AdaptiveSheet`                    | `src/shared/components/AdaptiveSheet.tsx` | Bottom sheet (mobile) / modal (desktop). **Container duy nhất được dùng.**        |
| `Icon`                             | `src/shared/components/Icon.tsx`          | Render mọi icon qua `<Icon name="..." />`                                         |
| `NavigationItem`                   | `src/app/router/routes.tsx`               | Contract điều hướng (path, label, shortLabel, icon, requiredRoles, primaryMobile) |
| `MobileBottomNav`                  | `src/app/layouts/MobileBottomNav.tsx`     | Nav mobile hiện tại (fixed đáy full-width, badge, haptics)                        |
| `AppLauncher` + `QuickCreateModal` | `src/app/layouts/`                        | FAB "tạo nhanh" đã có, dùng `AdaptiveSheet` + `QUICK_ACTIONS`                     |
| `QUICK_ACTIONS`                    | `src/shared/constants/layout.ts`          | Danh sách tác vụ nhanh (Nhập Sợi, Nhập Mộc, Nhập Vải…)                            |

> **Kết luận thiết kế:** dock nổi chỉ là **biến thể trình bày** của `MobileBottomNav`. FAB chỉ là **lối vào** `QuickCreateModal`. Không sinh component song song.

---

## 3. Contract dữ liệu

Không tạo file type mới. Mở rộng type sẵn có:

```ts
// src/app/layouts/MobileBottomNav.tsx (đã có)
export interface BottomTabItem extends NavigationItem {
  badge?: number | string;
  hasDot?: boolean;
}
```

Dock nổi tái dùng chính `BottomTabItem[]`, nên `AppShell` truyền dữ liệu như hiện tại — **không đổi tầng dữ liệu**.

---

## 4. Triển khai

### 4.1 `FloatingDock` (presentational, `src/shared/components/FloatingDock.tsx`)

Yêu cầu:

- Chỉ hiển thị mobile: `md:hidden`.
- Neo đáy giữa màn hình, tôn trọng safe-area iOS.
- Icon qua `<Icon name>`, màu qua token.
- Cô lập render: bọc `React.memo`; không nhận state của trang nội dung.

```tsx
import React, { useCallback } from 'react';
import { Icon } from '@/shared/components/Icon';
import type { IconName } from '@/shared/components/Icon';

export interface FloatingDockItem {
  id: string;
  label: string;
  icon: IconName;
  badge?: number | string;
}

interface FloatingDockProps {
  items: FloatingDockItem[];
  activeId?: string;
  onSelect: (id: string) => void;
  onAction?: () => void;
  actionIcon?: IconName;
  actionLabel?: string;
}

export const FloatingDock = React.memo(function FloatingDock({
  items,
  activeId,
  onSelect,
  onAction,
  actionIcon = 'Plus',
  actionLabel,
}: FloatingDockProps) {
  const handleSelect = useCallback(
    (id: string) => () => onSelect(id),
    [onSelect],
  );

  return (
    <nav aria-label="Điều hướng nhanh" className="floating-dock md:hidden">
      <div className="floating-dock__surface">
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={handleSelect(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`floating-dock__tab${isActive ? ' is-active' : ''}`}
            >
              <Icon
                name={item.icon}
                size={24}
                strokeWidth={isActive ? 2.4 : 1.7}
                aria-hidden
              />
              <span className="floating-dock__label">{item.label}</span>
              {item.badge ? (
                <span
                  className="floating-dock__badge"
                  aria-label={`${item.label}: ${item.badge}`}
                >
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}

        {onAction ? (
          <button
            type="button"
            onClick={onAction}
            aria-label={actionLabel}
            className="floating-dock__action"
          >
            <Icon name={actionIcon} size={24} strokeWidth={2.2} aria-hidden />
          </button>
        ) : null}
      </div>
    </nav>
  );
});
```

CSS (semantic token, có `@architecture-exception` như quy ước repo — xem `src/features/customer-portal/portal.css`):

```css
/* src/styles/layout/floating-dock.css */
.floating-dock {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  /* Safe area iOS */
  bottom: calc(env(safe-area-inset-bottom, 0px) + 1rem);
  pointer-events: auto;
}

.floating-dock__surface {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  border-radius: 9999px;
  border: 1px solid var(--border);
  /* Fallback đủ tương phản khi backdrop-filter không hỗ trợ */
  background: color-mix(in srgb, var(--surface-strong) 95%, transparent);
  backdrop-filter: blur(12px);
  box-shadow: 0 10px 35px rgb(0 0 0 / 8%);
}

.floating-dock__tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  width: 3.5rem;
  padding: 0.25rem 0;
  border: 0;
  background: none;
  color: var(--muted-foreground);
  cursor: pointer;
  transition: color 0.15s;
}

.floating-dock__tab.is-active {
  color: var(--primary);
}

.floating-dock__label {
  font-size: 0.625rem;
  font-weight: 500;
  white-space: nowrap;
}

.floating-dock__badge {
  position: absolute;
  top: 0.25rem;
  right: 0.5rem;
  min-width: 1rem;
  height: 1rem;
  padding: 0 0.25rem;
  border-radius: 9999px;
  background: var(--danger);
  color: var(--inverse-foreground);
  font-size: 0.625rem;
  font-weight: 700;
  line-height: 1rem;
  text-align: center;
  box-shadow: 0 0 0 2px var(--surface-strong);
}

.floating-dock__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  margin-left: 0.25rem;
  border: 0;
  border-radius: 9999px;
  background: var(--primary);
  color: var(--inverse-foreground);
  cursor: pointer;
  transition: transform 0.15s;
}

.floating-dock__action:active {
  transform: scale(0.95);
}

/* Focus ring bắt buộc (Rule 21) — không dùng outline: none trần */
.floating-dock__tab:focus-visible,
.floating-dock__action:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
```

### 4.2 Bottom sheet — tái dùng, KHÔNG viết mới

```tsx
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';

<AdaptiveSheet
  open={isOpen}
  onClose={onClose}
  title={APP_SHELL_LABELS.QUICK_CREATE}
  size="md"
>
  {/* form */}
</AdaptiveSheet>;
```

> Bản nháp tự viết lại `AdaptiveSheet` với prop `isOpen` + `document.body.style.overflow`. **Không làm** — component hiện tại đã xử lý portal, khoá scroll, swipe-dismiss, a11y (`role="dialog"`, `aria-labelledby`).

### 4.3 Tích hợp `AppShell`

```tsx
// src/app/layouts/AppShell.tsx — phần cuối
<MobileBottomNav
  bottomTabs={bottomTabs}
  isDrawerActive={isDrawerActive}
  onOpenMore={() => setShowMore(true)}
  menuBadge={totalDeviceBadgeCount > 0 ? totalDeviceBadgeCount : undefined}
  menuHasDot={totalDeviceBadgeCount > 0}
/>
```

Nếu chuyển sang dock nổi, thay bằng `FloatingDock` với cùng nguồn `bottomTabs`, và:

- bù padding đáy cho `<main className="route-content">`;
- chỉnh offset AI Chat FAB (`AIChatWidget`) để không chồng lên dock;
- giữ nguyên `MobileMoreDrawer`, haptics, badge.

---

## 5. Checklist chất lượng

1. **Safe area**: `env(safe-area-inset-bottom, 0px)` cho cả dock và sheet.
2. **Bù padding đáy**: `paddingBottom ≥ dock_height + offset + safe_area` (≈ 5–6rem) để item cuối không bị che.
3. **Fallback backdrop-blur**: nền vẫn đạt tương phản khi không hỗ trợ `backdrop-filter`.
4. **Cô lập state**: `React.memo`; mở/đóng sheet không re-render nội dung trang.
5. **Icon**: chỉ `<Icon name>`, không import lucide.
6. **Màu**: chỉ semantic token; badge dùng `--danger` (5.44:1).
7. **A11y**: `aria-label`, `aria-current`, `focus-visible` ring; không `outline: none` trần.
8. **Chỉ mobile**: `md:hidden`.
9. **Không log debug**, không chuỗi hardcode — dùng `APP_SHELL_LABELS` / `UI_LABELS`.
10. **Test**: render + tab select + FAB aria-label + badge.

---

## 6. Kiểm thử

```bash
npm run test              # unit test (Vitest)
npm run typecheck         # tsc frontend
npm run lint              # ESLint (chặn import lucide, màu hardcode)
npm run lint:css          # stylelint
npm run theme:check       # theme contract
npm run build             # build production
```

- Test đặt cạnh source: `src/shared/components/FloatingDock.test.tsx`.
- Nếu đụng `AppShell`/nav: bổ sung test cho `resolveRoleBottomTabs` nếu hành vi đổi.
- Xem mẫu: `src/app/layouts/__tests__/MobileBottomNav.test.tsx`.

---

## 7. Quy trình áp dụng

Theo [`AI_WORKFLOW.md`](../../AI_WORKFLOW.md), mọi thay đổi phải qua trạm gác:

1. **Phase 0** — Context & Impact Map (read-only).
2. **Phase 1** — Audit 22 rule (read-only). → 🛑 **Gate 1** `APPROVE PHASE 2`
3. **Phase 2** — Core/domain (không đụng UI/CSS). → 🛑 **Gate 2** `APPROVE PHASE 3`
4. **Phase 3** — UI/UX, token. → 🛑 **Gate 3** `APPROVE PHASE 4 & 5`
5. **Phase 4** — Cleanup. → 🛑 **Gate 4** `APPROVE MERGE`
6. **Phase 5** — Test & verification.

Không có token chính xác thì **không mở gate**; nhánh làm việc `feat/floating-dock` hoặc `fix/<scope>`, không commit thẳng `main`.

---

## 8. Việc cần quyết trước khi code

| #   | Câu hỏi                         | Phương án                                                                                                                                                   |
| --- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Thay hay mở rộng nav mobile?    | **(A)** Thay `MobileBottomNav` bằng dock nổi · **(B)** Thêm `variant="floating" \| "edge"` · **(C)** Tạo `FloatingDock` ở `shared/` nhưng chưa gắn AppShell |
| 2   | FAB làm gì?                     | Tái dùng `QuickCreateModal` + `QUICK_ACTIONS` (khuyến nghị)                                                                                                 |
| 3   | Icon/token nào?                 | Bảng semantic mapping trong `.agents/context/icon-system.md`                                                                                                |
| 4   | Có đưa file này vào repo không? | `docs/architecture/floating-navigation-dock-spec.md` (khuyến nghị)                                                                                          |
