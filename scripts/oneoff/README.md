# scripts/oneoff/ — Lưu trữ script dùng một lần

Thư mục này chứa các script **đã chạy xong một lần** (codemod, migration một lần, script kiểm tra
ad-hoc, script debug). Chúng được giữ lại làm hồ sơ lịch sử — để biết một thay đổi lớn trong quá khứ
đã được thực hiện như thế nào — nhưng **không phải công cụ vận hành thường xuyên**.

## Quy ước

- **KHÔNG** import từ thư mục này trong code sản phẩm (`src/`, `server/`, `agent/`).
- **KHÔNG** thêm script mới vào đây nếu nó còn dùng thường xuyên — đặt ở `scripts/` và khai báo
  trong `package.json` → `scripts`.
- Thư mục này bị loại khỏi ESLint (`ignorePatterns`) và khỏi `npm run size:check`.
- Các báo cáo do tool sinh ra (`*.json`, `ui_color_suggestions.md`) nằm trong `.gitignore` —
  chúng có mặt ở đây sau khi chạy script, không nhất thiết được commit.

## Cách dùng khi cần chạy lại một script

Kiểm tra script có an toàn không trước khi chạy:

```bash
node scripts/oneoff/<ten-script>.cjs
```

Hầu hết script ở đây cần `DATABASE_URL` hoặc `SUPABASE_SERVICE_ROLE_KEY` và có thể **ghi vào
database thật**. Đọc kỹ nội dung script trước khi chạy trên dữ liệu production.

## Cấu trúc

| Nhóm                                 | Ví dụ                                           | Mục đích                             |
| ------------------------------------ | ----------------------------------------------- | ------------------------------------ |
| `check_*.ts`, `check_*.cjs`          | `check_schema.ts`, `check_dashboard_counts.cjs` | Truy vấn kiểm tra dữ liệu ad-hoc     |
| `fix*.cjs`, `fix_*.py`               | `fix-imports.cjs`, `fix_lint.py`                | Sửa lỗi hàng loạt một lần            |
| `replace*.py`, `rename*.cjs`         | `replace_public.py`, `rename_rpcs.cjs`          | Đổi tên / thay thế hàng loạt         |
| `split_*.cjs`, `extract*.py`         | `split_data.cjs`, `extract_parent.py`           | Tách file / trích dữ liệu một lần    |
| `find*.cjs`, `find*.py`              | `find_screens.cjs`, `find_vn.cjs`               | Tìm kiếm trong codebase một lần      |
| `test_check*.mjs`, `test_update.mjs` | `test_check.mjs`                                | Thử nghiệm nhanh, không phải test CI |
| `*.json`, `*.md`                     | `audit_results.json`, `ui_color_suggestions.md` | Kết quả / báo cáo sinh tự động       |

> **Lưu ý:** `useStepper-analysis.md` đã được chuyển tới `docs/audits/use-stepper-analysis.md`
> vì đây là tài liệu phân tích có giá trị tham khảo lâu dài.
