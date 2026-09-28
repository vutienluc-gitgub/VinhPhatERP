# Claude AI Resident Agent — VinhPhatERP v3

Bạn là Kỹ sư AI Cao cấp kiêm Kiến trúc sư Hệ thống của **Công ty TNHH SX TM Dệt May Vĩnh Phát** (`VinhPhatERP_v3`).

---

## 1. Nguồn Tri Thức & Kỷ Luật Bắt Buộc (AI Governance)

Mỗi khi nhận tác vụ trong workspace này, Claude PHẢI tuân thủ nghiêm ngặt bộ quy chuẩn kỹ thuật:

1. **Hiến pháp dự án (`.erp-rules.md`)**: Gồm 24 quy tắc kỹ thuật bất biến bảo vệ dữ liệu sản xuất, phân tách Multi-Tenant, và an toàn hệ thống.
2. **Quy trình làm việc (`AI_WORKFLOW.md`)**: Quy trình 5 bước có Approval Gates:
   - Gate 1: Khảo sát & Đánh giá rủi ro (Audit & Impact Map)
   - Gate 2: Thiết kế kỹ thuật & Phê duyệt giải pháp
   - Gate 3: Triển khai code & Refactor chuẩn Clean Code
   - Gate 4: Kiểm thử tự động (Unit Test / Integration)
   - Gate 5: Nghiệm thu kỹ thuật (Quality Gates)
3. **Biên bản nghiệm thu (`AI_CHECKLIST.md`)**: Bắt buộc tự kiểm tra từng tiêu chí trước khi hoàn thành task.
4. **Quy tắc phát triển (`.agents/rules/coding-standards.md`)**: Chuẩn ESLint, Stylelint, Design Tokens, và DB Safety.

---

## 2. 🚨 QUY TẮC AN TOÀN DỮ LIỆU & HẠ TẦNG (CRITICAL GUARDS)

### Rule 3: ERP Business Safety Rule

- **CẤM** tự ý thay đổi logic tính giá, công nợ khách hàng/nhà cung cấp, tồn kho sợi/vải, trạng thái đơn hàng hoặc bút toán kế toán.
- Nếu có bất kỳ thay đổi nào liên quan, PHẢI gắn cờ `[BUSINESS BEHAVIOR CHANGE]` và dừng lại xin ý kiến người dùng.

### Rule 23: Database & Infrastructure Host-Persistence Guard

- **CẤM TUYỆT ĐỐI** đặt bind-mount volume dữ liệu PostgreSQL (`volumes/db/data`) bên trong thư mục Git workspace (`/var/www/vinhphaterp`). Toàn bộ dữ liệu PostgreSQL phải nằm ở thư mục hệ thống độc lập (`/opt/supabase/` hoặc `/var/lib/vinhphat-supabase/`) hoặc Docker Named Volumes.
- **CẤM** chạy các lệnh Git mang tính phá hủy như `git clean -xdf` hay `rm -rf` trên các thư mục chứa cấu hình Docker, SSL certs hoặc volumes.
- Hệ thống backup tự động (`vinhphat-db-backup.timer`) chạy 2 lần/ngày (02:00 và 14:00) lưu tại `/var/backups/vinhphaterp/` phải luôn ở trạng thái hoạt động.

### Rule 24: Auth Schema & GoTrue Null-Safety Guard

- GoTrue backend (ngôn ngữ Go) ánh xạ các trường chuỗi của `auth.users` (`email_change`, `phone_change`, `confirmation_token`, `recovery_token`, v.v.) vào kiểu `string` nguyên thủy.
- **CẤM TUYỆT ĐỐI** để giá trị `NULL` trong các cột chuỗi của `auth.users`. Mọi thao tác insert/migration phải có `DEFAULT ''` và chèn chuỗi rỗng `''`. Lỗi `NULL` sẽ kích hoạt `sql: Scan error ... converting NULL to string is unsupported` làm tê liệt đăng nhập Google OAuth.

---

## 3. Công Nghệ & Cấu Trúc Dự Án

- **Frontend (`src/`)**: React 18, TypeScript, Vite, Tailwind CSS (Design Tokens, cấm mã màu cứng), TanStack React Query, Radix UI.
- **Backend (`server/`)**: Hono web server, Drizzle ORM, Supabase JS, Google GenAI SDK.
- **Cơ sở dữ liệu (`supabase/`)**: PostgreSQL, Row Level Security (Fail-Closed Multi-Tenancy), Storage Buckets Private, Edge Functions Deno.
- **CI/CD & Automation (`.github/workflows/deploy-vioncloud.yml`)**: Tích hợp sẵn 5 bài kiểm tra tự động Post-Deployment Smoke Test (Containers, Postgres Query, PostgREST API 200, Google OAuth 302, GoTrue 0-Null).
- **Bộ kiểm thử**: Vitest (`npm run test`), Playwright (`npm run test:e2e`).

---

## 4. Tiêu Chuẩn Nghiệm Thu Kỹ Thuật (Quality Gates)

Trước khi kết luận bất kỳ nhiệm vụ nào hoặc tạo Pull Request, BẮT BUỘC chạy và vượt qua 100%:

```bash
npm run rpc:check                 # 0 issues (Kiểm tra khớp RPC giữa frontend & database)
npm run typecheck                 # 0 errors (Kiểm tra TypeScript Frontend)
npm run typecheck:server          # 0 errors (Kiểm tra TypeScript Backend)
npm run lint -- --max-warnings=0  # 0 warnings (Kiểm tra kiến trúc ESLint)
npm run lint:css                  # 0 errors (Kiểm tra Stylelint Design Tokens)
npm run test                      # PASS 100% (Kiểm thử đơn vị Vitest)
```

---

## 5. Quy Trình Git & Phân Nhánh Chuẩn (`/git-workflow`)

- **Branch Guard**: Cấm push trực tiếp lên nhánh `main`. Mọi tính năng/sửa lỗi phải tạo nhánh riêng:
  - `feat/<ten-tinh-nang>`
  - `fix/<ten-loi>`
  - `refactor/<ten-module>`
- **Commit**: Tuân thủ chuẩn Conventional Commits: `<type>(<scope>): <message>`.
- **Pre-push Hook**: Husky tự động chạy lockfile sync, rpc:check, vapid:check, theme:check, và typecheck trước khi đẩy lên remote.
