# VinhPhat ERP — Agent Instructions

## Dự án là gì

Phần mềm quản lý sản xuất vải cho Vĩnh Phát.  
Stack: React + TypeScript + Vite · Supabase (auth, DB, RLS) · Hono (API server) · Drizzle ORM · Vitest.

Xem thêm: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · [docs/CODING_RULES.md](docs/CODING_RULES.md)

---

## Cấu trúc monorepo

| Thư mục                | Phạm vi                                                                          |
| ---------------------- | -------------------------------------------------------------------------------- |
| `src/features/<name>/` | Một module business (UI + hook + schema + types)                                 |
| `src/shared/`          | Component, hook, util dùng chung                                                 |
| `src/services/`        | Adapter Supabase, offline queue (Lưu ý: Insert/Upsert qua `src/lib/db-guard.ts`) |
| `server/`              | Hono API server, Drizzle schema, routes                                          |
| `supabase/migrations/` | SQL migrations — không sửa file đã push                                          |
| `agent/`               | AI agent package — quy tắc riêng ở [agent/AGENTS.md](agent/AGENTS.md)            |

---

## Quy tắc bắt buộc

Để tránh phân mảnh tài liệu, toàn bộ quy tắc cốt lõi (TypeScript, Database, Bảo mật, UI) được quy định thống nhất tại:

- Nền tảng chung: [docs/coding-rules.md](docs/coding-rules.md)
- Kỷ luật thực thi (Riêng cho AI): Các file trong `.agents/rules/` (Đặc biệt chú ý rule bảo vệ DB tại `db-guard.ts` và bẻ nhỏ Component).

**AI Agent tuyệt đối tuân thủ các quy tắc trong các file trên thay vì tự suy diễn.**

---

## Lệnh quan trọng

```powershell
npm run dev            # Khởi động Vite dev server (frontend)
npm run test           # Chạy toàn bộ unit test một lần
npm run typecheck      # Kiểm tra TypeScript frontend
npm run typecheck:server  # Kiểm tra TypeScript server
npm run lint           # ESLint
npm run build          # Build production frontend
npm run db:push        # Áp migration lên Supabase/Postgres thật
npm run db:status      # Kiểm tra migration đã chạy chưa
```

Xem đầy đủ: [docs/RUN_COMMANDS.md](docs/RUN_COMMANDS.md)

---

## Quy trình sau mỗi lần thay đổi

| Phạm vi thay đổi    | Bước kiểm tra bắt buộc                                                             |
| ------------------- | ---------------------------------------------------------------------------------- |
| Chỉ frontend        | `npm run test` → `npm run typecheck` → `npm run lint` → `npm run build`            |
| Backend (`server/`) | `npm run typecheck:server` → `npm run build:server`                                |
| Migration DB / enum | Tạo migration mới → cập nhật `database.types.ts` + schema → chạy `npm run db:push` |

---

## Hành động an toàn vs. cần xác nhận

| Loại hành động                         | Chính sách                        |
| -------------------------------------- | --------------------------------- |
| Sửa file source, tạo file mới          | Tự thực hiện                      |
| Chạy test, typecheck, lint, build      | Tự thực hiện                      |
| Tạo migration mới                      | Tự thực hiện                      |
| `db:push` — đẩy migration lên DB thật  | **Đề xuất, không tự chạy**        |
| Xóa file, xóa branch, git push --force | **Phải xác nhận trước**           |
| Sửa file migration đã push             | **Không làm — tạo migration mới** |

---

## Skills

| Khi cần                | Dùng skill                         |
| ---------------------- | ---------------------------------- |
| Tạo feature mới từ đầu | `.github/skills/feature-scaffold/` |
| Viết hoặc chạy test    | `.github/skills/run-tests/`        |
