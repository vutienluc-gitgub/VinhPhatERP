# Fix Report — A11y `focus:outline-none` (34 cảnh báo → 0)

- **Branch**: `fix/a11y-focus-visible`
- **Phạm vi**: className / utility classes — **không** đổi logic, data, hay nghiệp vụ.
- **Impact Map**: Design tokens (focus ring) → className của input/button trong 23 file.
- **ERP Safety Check**: Không chạm pricing / inventory / debt / order status. **An toàn.**

## Vấn đề

`scripts/audit-wcag-contrast.mjs` (rule `UNSAFE_OUTLINE_NONE`) cờ
`focus:outline-none` khi trong cùng dòng không có `focus-visible:ring`.
Nghĩa là element xóa viền outline mặc định của trình duyệt **nhưng không bổ
sung chỉ báo focus bàn phím** → người dùng keyboard mất dấu (WCAG 2.1 AA).

Điểm dễ nhầm: nhiều chỗ **vốn đã** có `focus:ring-*`, nhưng `:focus` kích hoạt
cả khi click chuột, nên không phải chỉ báo dành cho bàn phím. Rule cố ý đòi
`focus-visible:ring` → cách sửa đúng là **chuyển variant**, không phải thêm
ring trùng.

## Thay đổi

34 vị trí / 23 file: `focus:outline-none` + `focus:ring-*` + `focus:border-*`
→ `focus-visible:outline-none` + `focus-visible:ring-*` +
`focus-visible:border-*`. Không đổi class nào khác.

Tinh chỉnh kèm theo cho chỉ báo dễ thấy:

- `focus:ring-1` → `focus-visible:ring-2` (1px quá mờ; chuẩn repo là 2px).
- `ring-primary/20` → `focus-visible:ring-primary/50`.
- `MediaLibraryModal`: ô search đang `disabled`, ring vẫn vô hại và đúng contract.

Các component dùng chung bị ảnh hưởng (`Input`, `VPCombobox`, `VPBaseCombobox`,
`select`) **không** nằm trong `docs/do-not-touch.md` — danh sách cấm chỉ gồm
`Button`, `Icon`, `TabSwitcher`, `DataTablePremium`, `KpiCard*`, `AdaptiveSheet`.

## Kiểm chứng

| Gate                                 | Trước       | Sau                             |
| ------------------------------------ | ----------- | ------------------------------- |
| `npm run a11y:check`                 | 34 cảnh báo | ✅ **0**                        |
| `npm run typecheck`                  | ✅          | ✅ 0 lỗi                        |
| `npm run lint -- --max-warnings=0`   | ✅          | ✅ 0 lỗi, 0 warning             |
| `npm run lint:css`                   | ✅          | ✅ 0 lỗi                        |
| `npm run size:check`                 | ✅          | ✅ không file nào vượt baseline |
| `npm run theme:check` / `dark:check` | ✅          | ✅                              |
| `npm run build`                      | ✅          | ✅ 2.6s                         |
| `npm run test`                       | 925 pass    | ✅ 925 pass                     |
| E2E (scroll + mobile-overflow)       | ✅          | ✅ 31 passed                    |

Ghi chú: `npm run rpc:check` báo `DATABASE_URL not set in .env` → không đối
chiếu được signature. Task này **không thêm/xoá RPC nào**, nên không ảnh hưởng.
Suite `server/src/routes/__tests__/ai-chat.test.ts` fail do thiếu `hono`
(pre-existing, `server/node_modules` chưa cài).

## Phạm vi tách nhánh

Branch này **độc lập** với `fix/customer-portal`:

- 23 file đều **không** trùng với các file của fix scroll (đã kiểm bằng `comm`).
- Mọi dòng thay đổi đều chứa `focus` (đã kiểm bằng grep trên diff).
- Base chung `776ddac` → hai PR có thể merge theo bất kỳ thứ tự, không conflict.
