# Đề xuất Thay đổi (Change Proposal): Floating Navigation Dock

- **Slug:** `floating-navigation-dock`
- **Author:** AI Agent (OpenHands) — theo Issue [#40](https://github.com/vutienluc-gitgub/VinhPhatERP/issues/40)
- **Trạng thái:** ARCHIVED — PR [#41](https://github.com/vutienluc-gitgub/VinhPhatERP/pull/41) đang mở (chờ merge)
- **Domain:** ui-navigation (shared layer — không thuộc domain nghiệp vụ)

---

## 1. Bối cảnh & Lý do thay đổi (Context & Why)

- **Vấn đề:** Thanh điều hướng mobile hiện tại (`MobileBottomNav`) là dải full-width dính sát đáy màn hình. Bản thiết kế mới muốn dạng **pill nổi (Floating Dock)** + **Integrated Action Button** (lối vào Menu), tối ưu vùng ngón tay (thumb zone) và hiện đại hơn.
- **Hành vi mong đợi:** Dưới 768px hiển thị dock nổi neo đáy (tôn trọng safe-area), giữ nguyên tab theo role, badge thông báo, nút Menu và haptics. Desktop không đổi (vẫn Sidebar).
- **Nguồn:** bản nháp ngoài repo `floating_navigation_bar_implementation_guide.md` là template của dự án khác (module `glucose`, import `lucide-react` trực tiếp, màu `slate/rose/emerald`). Đã hiệu chỉnh theo chuẩn VinhPhatERP — xem [`docs/architecture/floating-navigation-dock-spec.md`](../../../../docs/architecture/floating-navigation-dock-spec.md).

---

## 2. Bản đồ Tác động (Impact Map)

```text
UI:          src/shared/components/FloatingDock.tsx  (MỚI — presentational)
               │
               ▼
Hook:        (không có hook nghiệp vụ — tính năng thuần điều hướng)
               │
               ▼
Resolver:    src/shared/lib/navigation/floating-dock.utils.ts  (hàm thuần: toDockItems,
             formatDockBadge, isDockItemActive)
               │
               ▼
App Shell:   src/app/layouts/AppShell.tsx  (thay MobileBottomNav → FloatingDock;
             giữ nguyên bottomTabs / MobileMoreDrawer / haptics / badge)
               │
               ▼
Database:    không chạm DB, không RPC, không RLS
```

---

## 3. Rủi ro & Đánh giá An toàn ERP (ERP Safety Assessment)

- [x] **Có thay đổi logic kế toán / công nợ không?**: `KHÔNG`
- [x] **Có thay đổi cách tính tồn kho vải / sợi không?**: `KHÔNG`
- [x] **Có thay đổi định mức dệt / nhuộm không?**: `KHÔNG`
- [x] **Có nguy cơ deadlock hoặc vi phạm RLS Multi-Tenant không?**: `KHÔNG`

Không có mục nào là "CÓ" → không cần `delta-spec.md` nghiệp vụ.

---

## 4. Quyết định triển khai

| Hạng mục | Quyết định |
| --- | --- |
| Phương án tích hợp | **(A)** Thay `MobileBottomNav` bằng `FloatingDock` (người dùng chọn tại Gate 2) |
| `AdaptiveSheet` | **Tái dùng** bản sẵn có, không viết mới |
| Icon | `<Icon name>` + `IconName` (chuỗi); **không** import `lucide-react` |
| Màu | Chỉ semantic token; badge dùng `--danger` (5.44:1 — đạt AA) thay `rose-500` (3.67:1 — fail) |
| Bù padding đáy | Không cần sửa: `.content-shell` đã có `calc(5.5rem + safe-area-inset-bottom)` |
| `MobileBottomNav` | **Giữ lại** làm đường rollback 1 dòng. `AppShell` không còn import nên Vite tree-shake khỏi bundle production; chỉ còn chạy trong test suite. |
| FAB | **Bổ sung tại Gate 5 (theo yêu cầu người dùng):** nút **"+" cạnh nút Menu** (tổng 6 nút), mở `QuickActionsSheet` (`AdaptiveSheet` + `QUICK_ACTIONS`). Trước đó phạm vi chỉ là nút Menu. |
| Nhãn trên dock | **Icon-only** (theo yêu cầu người dùng). Nhãn chữ chỉ dùng cho `aria-label`, không render. |
| Thứ tự nút | 4 tab theo role → `+` (tạo mới) → `Menu` (cuối, giữ nguyên vị trí cũ) |

### 4.1 Bổ sung phạm vi sau Gate 4 (Gate 5)

| File | Thay đổi |
| --- | --- |
| `floating-dock.types.ts` | `action?` → `actions?: FloatingDockAction[]`; thêm `variant`, `ariaLabel` tuỳ chọn |
| `FloatingDock.tsx` | Gộp `DockButton`/`DockAction` thành `DockIconButton`; bỏ `<span className={styles.label}>`; thêm class `isPrimary` |
| `FloatingDock.module.css` | Bỏ `.label`/`.iconWrap`; `.tab` thành icon-only với `min-width/min-height: 2.75rem` (44px) |
| `QuickActionsSheet.tsx` | **Mới** — sheet liệt kê `QUICK_ACTIONS`, chọn xong điều hướng |
| `app-launcher.css` | Thêm `.quick-create-row*` (tái dùng file CSS layout sẵn có, không tạo file mới) |
| `AppShell.tsx` | Truyền 2 action; thêm state `showQuickActions` + haptics khi mở |
