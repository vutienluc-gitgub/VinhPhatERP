# VinhPhat ERP — Agent Instructions

## Dự án là gì

Phần mềm quản lý sản xuất vải cho Vĩnh Phát.  
Stack: React + TypeScript + Vite · Supabase (auth, DB, RLS) · Hono (API server) · Drizzle ORM · Vitest.

Xem thêm: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · [docs/coding-rules.md](docs/coding-rules.md)

---

## Cấu trúc monorepo

| Thư mục                | Phạm vi                                                                          |
| ---------------------- | -------------------------------------------------------------------------------- |
| `src/features/<name>/` | Một module business (UI + hook + schema + types)                                 |
| `src/shared/`          | Component, hook, util dùng chung                                                 |
| `src/services/`        | Adapter Supabase, offline queue (Lưu ý: Insert/Upsert qua `src/lib/db-guard.ts`) |
| `server/`              | Hono API server, Drizzle schema, routes                                          |
| `supabase/migrations/` | SQL migrations — không sửa file đã push                                          |
| `agent/`               | AI agent package — quy tắc riêng ở [agent/ai-tool.md](agent/ai-tool.md)          |

---

## Quy tắc bắt buộc & AI Governance

Toàn bộ quy tắc cốt lõi và kỷ luật thực thi của AI Agent được quy định tại bộ 3 tài liệu nền tảng ở thư mục gốc:

1. [`.erp-rules.md`](.erp-rules.md) — **Hiến pháp VinhPhatERP**: 22 quy tắc kỹ thuật, bảo vệ Database, cấm sửa nghiệp vụ nhạy cảm, Impact Map.
2. [`AI_WORKFLOW.md`](AI_WORKFLOW.md) — **Quy trình tác nghiệp 5 bước**: Có trạm gác (Gate 1, Gate 2, Gate 3), AI không được tự ý sửa một mạch.
3. [`AI_CHECKLIST.md`](AI_CHECKLIST.md) — **Biên bản nghiệm thu**: Checklist kiểm soát chất lượng trước khi đóng task.

Xem thêm tài liệu bổ trợ:

- Kỷ luật thực thi chi tiết: `.agents/rules/`
- Kiến trúc & Coding Rules: [docs/coding-rules.md](docs/coding-rules.md)

**AI Agent tuyệt đối tuân thủ quy trình có trạm gác (Approval Gates) thay vì tự suy diễn.**

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

## Bảo vệ cấu hình CI — Cảnh giác ghi đè kiểu "stale snapshot"

> Bài học từ PR #2 (`perf(chat): optimize chat db performance and unread RPCs`).

**Hiện tượng**: commit sinh tự động (vd. bot `google-labs-jules`) có thể mang theo nội dung **cũ** của các file hạ tầng và ghi đè thay đổi vừa merge vào `main`. Nội dung ghi đè là **bản cũ nguyên văn** — khớp blob hash của commit trước đó — chứ không phải chỉnh sửa có chủ đích.

Hệ quả thực tế: một commit tính năng chat đã xóa `lint:css`, `theme:check`, `build`, job `e2e` và `ai-audit` khỏi `.github/workflows/ci.yml`, đồng thời đảo ngược `.husky/pre-push`. CI vì thế vẫn báo xanh nhưng chỉ chạy **3 job thay vì 5** — tín hiệu giả, rất dễ đánh lừa khi review.

**Quy tắc**:

1. Trước khi tin một bảng CI xanh, phải kiểm tra workflow có chạy **đủ gate** không (số job + tên step), không chỉ nhìn kết luận `success`.
2. Không bao giờ đưa thay đổi `.github/`, `.husky/`, `.agents/rules/`, `e2e/` vào commit tính năng. Nếu diff xuất hiện các file này → dừng lại, tách riêng hoặc khôi phục.
3. File hạ tầng phải khớp với `main`. Phục hồi bằng `git checkout origin/main -- <file>`, rồi gộp bằng `git commit --fixup` + `git rebase -i --autosquash` (không để lại cặp "commit xóa rồi commit thêm lại" trong lịch sử).

**Kiểm tra nhanh** trước khi push:

```bash
git diff --name-only origin/main...HEAD \
  | grep -E '^\.github/|^\.husky/|^\.agents/rules/|^e2e/'
```

Không có output = an toàn. Có output = phải xem lại từng file.

---

## Skills

| Khi cần                | Dùng skill                         |
| ---------------------- | ---------------------------------- |
| Tạo feature mới từ đầu | `.github/skills/feature-scaffold/` |
| Viết hoặc chạy test    | `.github/skills/run-tests/`        |
