# VinhPhat ERP

> ⚠️ This project uses an AI Agent system.  
> Read `AGENT.md` before making any changes.

---

## Tổng quan

**VinhPhat ERP** là hệ thống quản lý vận hành nội bộ cho doanh nghiệp dệt may (B2B),  
được xây dựng theo kiến trúc **mobile-first** và tối ưu cho workflow phát triển bằng AI.

Hệ thống số hóa toàn bộ quy trình:

- Nhập nguyên liệu (sợi)
- Sản xuất vải
- Quản lý tồn kho theo lô
- Quản lý đơn hàng
- Theo dõi tiến độ
- Xuất hàng và thanh toán

---

## Tech Stack

| Layer    | Công nghệ                    | Ghi chú               |
| -------- | ---------------------------- | --------------------- |
| Frontend | React · TypeScript · Vite    | SPA, mobile-first     |
| Backend  | Hono (Node.js) · Drizzle ORM | API server, type-safe |
| Database | Supabase (PostgreSQL)        | Auth, RLS, Realtime   |
| Testing  | Vitest                       | Unit & integration    |
| Tooling  | ESLint · pnpm / npm          | Lint, package manager |

---

## Kiến trúc dự án

### Code Breakdown

| Khu vực        | Thư mục         | Mục đích              |
| -------------- | --------------- | --------------------- |
| Frontend       | `src/`          | UI, routing, state    |
| Domain modules | `src/features/` | Module theo nghiệp vụ |
| API client     | `src/api/`      | Gọi API               |
| Domain models  | `src/models/`   | Kiểu dữ liệu          |
| Shared         | `src/shared/`   | UI, hooks, utils      |
| Services       | `src/services/` | Business logic        |
| App shell      | `src/app/`      | Layout, providers     |
| Backend        | `server/`       | API, middleware       |
| Database       | `supabase/`     | Migration, functions  |
| Shared types   | `shared/types/` | Type dùng chung       |
| Tests          | `tests/`        | Unit/integration      |
| Scripts        | `scripts/`      | Tool hỗ trợ           |
| Docs           | `docs/`         | Tài liệu hệ thống     |
| Public         | `public/`       | Static assets         |

---

## AI Agent System

Dự án sử dụng hệ thống AI Agent để hỗ trợ phát triển.

### Core Files (Bắt buộc tuân theo)

- `AGENT.md` → Quy tắc vận hành AI (global behavior)
- `docs/ui-system.md` → Quy tắc UI (mobile-first, Tailwind, shadcn)
- `docs/erp-flow.md` → Logic nghiệp vụ ngành dệt may
- `docs/modules/coding-rules.md` → Quy tắc code, TypeScript, security
- `docs/run-commands.md` → Quy trình chạy, test, build

---

### Commands

- `/commands/build-ui.md` → Tạo UI
- `/commands/build-feature.md` → Tạo feature hoàn chỉnh
- `/commands/review.md` → Review code
- `/commands/fix.md` → Sửa lỗi
- `/commands/improve.md` → Tối ưu code

---

### Nguyên tắc khi làm việc với AI

- Luôn đọc và tuân theo `AGENT.md`
- Không bỏ qua các file trong `docs/`
- Không tự ý thay đổi schema hoặc logic nghiệp vụ
- Luôn kiểm tra code trước khi sử dụng

---

## Cài đặt & chạy dự án

### Lần đầu

```bash
cd vinhphat-app-v2
npm install
npm run dev
```
