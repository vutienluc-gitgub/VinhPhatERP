## Tổng quan

**VinhPhat ERP** là hệ thống ERP, quản lý vận hành nội bộ dành cho doanh nghiệp dệt may,
được xây dựng theo kiến trúc mobile-first với công nghệ hiện đại.
Ứng dụng số hóa toàn bộ quy trình từ nhập nguyên liệu (sợi), sản xuất vải,
quản lý đơn hàng, theo dõi tiến độ, đến xuất hàng và thanh toán.

## Phân bổ mã nguồn / Code Breakdown

| Khu vực | Thư mục | Mục đích chính |
| --- | --- | --- |
| Frontend (React + Vite) | `src/` | UI, routing, state, tích hợp API và business logic phía client. |
| Domain modules | `src/features/` | Mỗi module theo nghiệp vụ (orders, inventory, shipments, ...). |
| API client | `src/api/` | Định nghĩa gọi API theo module. |
| Domain models | `src/models/` | Kiểu dữ liệu và cấu trúc nghiệp vụ phía client. |
| Shared UI & utils | `src/shared/` | Component dùng chung, hooks, lib, types, utils. |
| Services | `src/services/` | Tầng dịch vụ (business logic), offline, supabase. |
| Styles & assets | `src/styles/`, `src/assets/` | CSS hệ thống, font/icon/image. |
| App shell | `src/app/` | Layout, providers, router cấu hình. |
| Backend (Node) | `server/` | API server, routes, middleware, db, cấu hình Drizzle. |
| Database & Supabase | `supabase/` | Functions, migrations, seed dữ liệu. |
| Shared types | `shared/types/` | Kiểu dữ liệu dùng chung giữa client/server. |
| Tests | `tests/`, `test/` | Integration/unit tests, setup. |
| Tooling | `scripts/` | Script hỗ trợ dev/ops. |
| Agent tools | `agent/` | MCP server và agent tooling nội bộ. |
| Docs | `docs/` | Kiến trúc, quy trình, tài liệu module. |
| Static public | `public/` | Static assets phục vụ trực tiếp. |
| Root configs | `package.json`, `vite.config.ts`, `tsconfig*.json` | Cấu hình build, lint, TypeScript. |