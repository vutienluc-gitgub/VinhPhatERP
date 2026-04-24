# Do Not Touch — Danh sách file/component cấm sửa

> Các file/module dưới đây chỉ được thay đổi bởi maintainer/core team.
> Sửa đổi không kiểm soát sẽ gây regression nghiêm trọng trên toàn app.

---

## 1. Core Layout & Shell

| File                       | Lý do cấm                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------ |
| `src/styles/app-shell.css` | Định nghĩa layout toàn cục (sidebar, header, content shell). Thay đổi ảnh hưởng mọi trang. |
| `src/App.tsx`              | Root routing và provider setup. Thay đổi có thể phá vỡ navigation toàn app.                |
| `src/main.tsx`             | Entry point, mount root. Thay đổi ảnh hưởng khởi động app.                                 |

---

## 2. Design System Tokens

| File                                | Lý do cấm                                                                         |
| ----------------------------------- | --------------------------------------------------------------------------------- |
| `src/styles/variables.css` (nếu có) | CSS custom properties (colors, spacing, radius). Thay đổi gây lệch design system. |
| `tailwind.config.ts`                | Tailwind theme tokens. Thay đổi ảnh hưởng utility classes toàn app.               |

---

## 3. Shared Components (Stable)

| Component                    | File                                         | Lý do cấm                                                    |
| ---------------------------- | -------------------------------------------- | ------------------------------------------------------------ |
| `Icon`                       | `src/shared/components/Icon.tsx`             | Icon system toàn cục. Thay đổi ảnh hưởng mọi icon trong app. |
| `TabSwitcher`                | `src/shared/components/TabSwitcher.tsx`      | Dùng ở nhiều màn. Sửa logic có thể phá tab ở các trang khác. |
| `DataTablePremium`           | `src/shared/components/DataTablePremium.tsx` | Table component dùng chung. Sửa có thể phá layout CRUD.      |
| `KpiCard` / `KpiCardPremium` | `src/shared/components/KpiCard*.tsx`         | KPI cards dùng ở dashboard + nhiều trang.                    |
| `Button` (base)              | `src/shared/components/Button.tsx`           | Base button component. Sửa ảnh hưởng toàn bộ CTA.            |
| `AdaptiveSheet`              | `src/shared/components/AdaptiveSheet.tsx`    | Modal/drawer wrapper. Thay đổi ảnh hưởng form UX.            |

---

## 4. Application Layer (Data & Hooks)

| File / Pattern                  | Lý do cấm                                                                               |
| ------------------------------- | --------------------------------------------------------------------------------------- |
| `src/application/**/queries.ts` | React Query hooks (data fetching). Thay đổi cache key hoặc query config gây stale data. |
| `src/application/analytics/`    | Dashboard stats, analytics aggregation. Thay đổi làm sai số liệu báo cáo.               |
| `src/shared/utils/format.ts`    | Currency, date, number formatting. Thay đổi ảnh hưởng hiển thị toàn app.                |

---

## 5. Quy tắc khi cần sửa file trong danh sách cấm

Nếu có lý do chính đáng (bug critical, feature request từ product owner):

1. Tạo **copy** hoặc **wrapper** component thay vì sửa trực tiếp.
2. Hoặc: mở PR với **mô tả chi tiết** và yêu cầu review từ maintainer.
3. Không tự merge vào `main` nếu chưa có approval.

---

## 6. Danh sách cập nhật

- File này được cập nhật định kỳ.
- Nếu bạn nghĩ 1 file nên được thêm vào danh sách cấm → ping maintainer.
