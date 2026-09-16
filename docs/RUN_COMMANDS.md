# VinhPhatERP — Run Commands

Danh sách lệnh vận hành chuẩn của dự án. Nguồn sự thật là `package.json` → `scripts`.

> Tài liệu liên quan: [AGENT.md](../AGENT.md) · [coding-rules.md](coding-rules.md) · [START_HERE.md](START_HERE.md)

---

## 1. Phát triển

```bash
npm run dev            # Vite dev server (frontend)
npm run dev:server     # Hono API server
npm run dev:all        # Chạy song song cả hai
```

## 2. Kiểm tra chất lượng (Quality Gates)

Năm lệnh dưới đây là **bắt buộc** trước khi hoàn thành một task (xem `AI_WORKFLOW.md` §Phase 5).

```bash
npm run rpc:check                 # RPC frontend khớp signature DB (CẦN DATABASE_URL)
npm run typecheck                 # TypeScript frontend
npm run lint -- --max-warnings=0  # ESLint, 0 warning
npm run lint:css                  # Stylelint semantic tokens
npm run test                      # Vitest (unit + integration)
```

Bổ sung:

```bash
npm run check            # lint + lint:css + typecheck
npm run typecheck:server # TypeScript cho server/
npm run theme:check      # Kiểm tra theme contract
npm run vapid:check      # Kiểm tra VAPID single source of truth
npm run audit:full       # rpc:check + vapid:check + lint + typecheck + typecheck:server + theme:check
```

### Lưu ý về `rpc:check`

`npm run rpc:check` cần kết nối database thật. Khi không có DB (offline, CI, sandbox), lệnh này
**không thể PASS** — phải báo cáo là `[NOT VERIFIED]`, không được báo PASS. Xem `AI_WORKFLOW.md` §1.2.

`SKIP_RPC_CHECK=1 git push` chỉ là lối thoát cho thao tác push (xem `.husky/pre-push`), **không**
phải cách để coi check đã đạt.

## 3. Build

```bash
npm run build          # Build production frontend (tsc -b + vite build)
npm run build:server    # Build server
npm run build:all       # Cả hai
```

## 4. Test

```bash
npm run test           # Chạy toàn bộ unit test một lần
npm run test:watch     # Watch mode
npm run test:e2e       # Playwright E2E
npm run test:visual    # Visual regression
```

## 5. Database / Migration

```bash
npm run db:new ten_migration  # Tạo file migration mới
npm run db:status             # Danh sách migration + trạng thái đã chạy
npm run db:reload             # Reload schema cache cho Supabase API
npm run db:push               # Đẩy migration lên DB thật — ĐỀ XUẤT, không tự chạy
```

Chi tiết quy trình migration: [START_HERE.md](START_HERE.md).
