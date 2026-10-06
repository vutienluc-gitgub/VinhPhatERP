# Fix Report — Customer Portal không vuốt được trên mobile

- **Branch**: `fix/customer-portal`
- **Phạm vi**: CSS layout / responsive (không đụng nghiệp vụ, không đụng DB)
- **Impact Map**: UI Layout (`PortalLayout`, `DriverPortalLayout`) → CSS contract (`scroll-root.css`) → `app-shell.css` (nguồn `overflow:hidden`)
- **ERP Safety Check**: Không chạm pricing / inventory / debt / order status. **An toàn.**

## Root cause

Trên mobile (`< 768px`), `src/styles/layout/app-shell.css` đặt
`html, body { height: 100dvh; overflow: hidden }` để chặn pull-to-refresh và
rubber-band bounce của iOS Safari. Vì vậy **viewport không còn nhận thao tác
cuộn** — mỗi layout top-level phải tự khai báo một scroll owner.

`portalRoutes` render **ngoài** `createErpShellRoute()`, nên `.portal-shell`
không có scroll container → nội dung dài bị cắt cụt, người dùng không vuốt được.

## Thay đổi

| File                                                     | Nội dung                                                                                                                                                         |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/styles/layout/scroll-root.css` (mới)                | Contract `.app-scroll-root`: `height:100dvh; overflow:hidden auto; overscroll-behavior-y:contain`                                                                |
| `src/styles/global.css`                                  | Đăng ký import `scroll-root.css` ngay sau `app-shell.css` (thứ tự cascade)                                                                                       |
| `src/features/portal-shared/components/PortalLayout.tsx` | `.portal-shell` → `.portal-shell.app-scroll-root` (phủ customer **và** supplier)                                                                                 |
| `src/features/customer-portal/portal.css`                | Mobile: `.portal-shell { min-height: 0 }` (bỏ xung đột `100vh` với `100dvh`)                                                                                     |
| `src/features/customer-portal/CustomerPortalLayout.tsx`  | Wrapper `h-full` → `min-h-full` (cho phép nội dung giãn theo cha cuộn)                                                                                           |
| `src/features/driver-portal/DriverPortalLayout.tsx`      | Retrofit cùng contract: root thành scroll owner, bỏ `main.overflow-y-auto` lồng nhau (trước đó `main.flex-1` không tạo được scroller vì cha chỉ có `min-height`) |
| `e2e/helpers/scroll-helpers.ts` (mới)                    | Helper dùng chung: session giả, mock route, `realTouchSwipeUp` (CDP touch thật), `expectScrollOwnerScrolls`                                                      |
| `e2e/portal-scroll.spec.ts` (mới)                        | Regression customer portal                                                                                                                                       |
| `e2e/driver-portal-scroll.spec.ts` (mới)                 | Regression driver portal                                                                                                                                         |
| `playwright.config.ts`                                   | Đăng ký 2 spec mới vào project `chromium-authed`                                                                                                                 |
| `docs/responsive-rules.md`                               | Thêm **R8 — Mobile Scroll Owner Contract**                                                                                                                       |

## Checklist (AI_CHECKLIST.md)

### 1. Architecture & Layering

- [x] Không có business logic trong UI (chỉ đổi className/CSS).
- [x] Single Responsibility — không file nào vượt baseline (`size:check` xanh).
- [x] Layer hierarchy giữ nguyên, không thêm import chéo feature.
- [x] Zero circular dependencies.

### 2. TypeScript & Type Safety

- [x] Zero `any` / `@ts-ignore` trong code mới.
- [x] `typecheck` 0 lỗi.

### 3. Database Safety

- [x] **N/A** — không có thay đổi DB, không có insert/update/rpc nào được thêm.

### 4. React & Render Safety

- [x] Không thêm `useEffect`, không đổi key list.
- [x] `min-h-full` thay `h-full` không ảnh hưởng logic render.

### 5. UI / UX & Design Tokens

- [x] Zero hardcoded colors (`lint:css` xanh, không dùng `@architecture-exception`).
- [x] Không emoji.
- [x] Regression test chứng minh mobile vuốt được (không còn nội dung bị cắt).

### 6. Security & RLS

- [x] Không đụng RLS. Không có secret trong bundle.

### 7. ERP Safety

- [x] Không sửa công thức giá/debt/stock.
- [x] Không sửa state transition.
- [x] Thay đổi đúng phạm vi được duyệt.

### 8. Automated Verification Gates (0 errors)

| Gate           | Lệnh                                                     | Kết quả                                                                                                                |
| -------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| RPC sync       | `npm run rpc:check`                                      | ⚠️ `DATABASE_URL not set in .env` — không thể đối chiếu signature. **Không liên quan** (task này không thêm RPC nào).  |
| Typecheck      | `npm run typecheck`                                      | ✅ 0 lỗi                                                                                                               |
| Lint           | `npm run lint -- --max-warnings=0`                       | ✅ 0 lỗi, 0 warning                                                                                                    |
| Lint CSS       | `npm run lint:css`                                       | ✅ 0 lỗi                                                                                                               |
| Unit test      | `npm run test`                                           | ✅ 925 passed (1 suite `server/…/ai-chat.test.ts` fail do thiếu `hono` — pre-existing, `server/node_modules` chưa cài) |
| Build          | `npm run build`                                          | ✅ built in 2.6s                                                                                                       |
| Size ratchet   | `npm run size:check`                                     | ✅ không file nào vượt baseline                                                                                        |
| Theme contract | `npm run theme:check`                                    | ✅ mirrored                                                                                                            |
| Dark variant   | `npm run dark:check`                                     | ✅ no OS-bound `dark:`                                                                                                 |
| A11y           | `npm run a11y:check`                                     | ⚠️ 10 cảnh báo `focus:outline-none` **pre-existing**, không file nào thuộc thay đổi này                                |
| E2E scroll     | `npx playwright test portal-scroll driver-portal-scroll` | ✅ **3 passed**                                                                                                        |

## Bằng chứng test có giá trị (không phải "xanh giả")

1. Chạy đủ → **PASS**.
2. Gỡ class `app-scroll-root` khỏi `PortalLayout` → **FAIL** (`toHaveClass(expected) failed`).
3. Gỡ class khỏi `DriverPortalLayout` → **FAIL**.
4. Khôi phục → **PASS** lại.

Vuốt được mô phỏng bằng **touch event thật qua CDP**
(`Input.dispatchTouchEvent`), không dùng `mouse.wheel`.

## Ghi chú

- E2E cần `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (giá trị giả là đủ) để
  client khởi tạo nhánh `persistSession`. Repo hiện không có file `.env`.
- CI quick-check: `.github/`, `.husky/`, `.agents/rules/` **không** nằm trong diff.
  File `e2e/*` là test cố ý của task này.
- `git diff origin/main...HEAD` = **[NOT VERIFIED]** vì workspace là shallow clone.
