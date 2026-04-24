# Coding Standards

> Tiêu chuẩn code và UI/UX cho toàn bộ dự án VinhPhatERP.

---

## 1. Philosophy

- **Mobile-first**: Thiết kế cho mobile trước, nâng cấp cho desktop sau.
- **Premium feel**: Không được có scroll ngang, UI bị cắt cụt, hoặc layout vỡ.
- **Never leave broken UI**: Nếu phát hiện UI bị hỏng, fix ngay — không để tồn đọng.

---

## 2. Naming Conventions

- Components: `PascalCase.tsx` (e.g., `DashboardPage.tsx`).
- Utilities/Hooks: `camelCase.ts` (e.g., `useDashboardStats.ts`).
- Styles: `kebab-case.css` (e.g., `data-ui.css`).
- CSS class: semantic names (e.g., `.kpi-card-premium`, `.filter-bar`).

---

## 3. Component Patterns

### Page Shell

```tsx
<div className="page-container p-4 md:p-6 overflow-x-hidden">
```

### Card

```tsx
<div className="panel-card card-flush">
  <div className="card-header-area">
    <div className="card-header-row">...</div>
  </div>
</div>
```

---

## 4. Responsive Breakpoints

| Name   | Width   | Usage                         |
| ------ | ------- | ----------------------------- |
| Mobile | < 640px | Single column, stacked layout |
| sm     | 640px   | 2 columns cho grid đơn giản   |
| md     | 768px   | Sidebar hiện, tab bar full    |
| lg     | 1024px  | Multi-column dashboard layout |

---

## 5. CSS Architecture

- `app-shell.css`: Layout chung (sidebar, header, content shell).
- `data-ui.css`: Components CRUD (tables, forms, cards, badges, tabs, KPI).
- Không dùng `!important` trừ khi override library.
- Luôn có `overflow-x: hidden` ở page container để ngăn scroll ngang vô tình.

---

## 6. State & Data

- React Query cho server state.
- Zustand cho client state global.
- Không dùng `useState` cho data lớn hoặc derived từ server.

---

## 7. Performance

- Lazy load pages: `React.lazy()`.
- Ảnh: WebP, lazy loading, placeholder.
- `React.memo` cho heavy components.

---

## 8. Accessibility

- Mọi interactive element có `role`/`aria-label` hoặc visible label.
- Contrast ratio ≥ 4.5:1 cho text thường.
- Keyboard navigation hợp lý.

---

## 9. Layout Must Not Break

- Text > 100 ký tự không làm vỡ layout.
- Không horizontal scroll trên body ở bất kỳ viewport nào.
- Nếu nội dung quá rộng: truncate, scroll nội bộ (table, tab bar), hoặc re-layout (stack column).
