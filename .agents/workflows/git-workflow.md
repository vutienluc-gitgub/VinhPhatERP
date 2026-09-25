---
description: Quy trình Git chuẩn ERP — Tạo nhánh tính năng (feature branch), kiểm tra chất lượng (typecheck/lint), commit và push an toàn qua Branch Guard.
---

# Quy trình Git Chuẩn ERP (Git Branching & Push Workflow)

> **Mục đích:** Hướng dẫn quy trình đẩy mã nguồn chuẩn mực, an toàn tuyệt đối, tuân thủ cơ chế **Branch Guard (Husky Pre-push Hook)** và tiêu chuẩn kiến trúc dự án `VinhPhatERP`. Không bao giờ bị chặn hay lỗi khi push.

---

## 🚨 NGUYÊN TẮC BẮT BUỘC (CRITICAL)

1. **Tuân thủ Branch Guard:** Dự án có cơ chế Husky chặn `push` trực tiếp lên nhánh `main`. Mọi thay đổi code mới BẮT BUỘC thực hiện trên nhánh làm việc riêng:
   - Nhánh tính năng mới: `feat/<tên-tính-năng>` (ví dụ: `feat/misa-sync`, `feat/order-export`)
   - Nhánh sửa lỗi: `fix/<tên-lỗi>` (ví dụ: `fix/customer-dup`, `fix/login-token`)
   - Nhánh refactor: `refactor/<tên-module>`
2. **Không commit dữ liệu nhạy cảm:** Tuyệt đối không `git add` các file:
   - `.env*` (Secret keys, token)
   - `scratch/` (Dữ liệu tạm/nháp)
   - `private/` (Dữ liệu kế toán nội bộ của khách hàng/doanh nghiệp)
   - File dump database: `*.dump.sql`, `db_dump.sql`
3. **Verification Gate:** Phải chạy `npm run typecheck` đạt 0 lỗi trước khi tạo commit.

---

## 🛠️ QUY TRÌNH 5 BƯỚC THỰC THI (5-STEP WORKFLOW)

```text
[1. Kiểm tra Status] ──▶ [2. Tạo Nhánh Mới] ──▶ [3. Kiểm Tra Code (Typecheck)]
                                                            │
                                                            ▼
[5. Push Lên GitHub] ◀── [4. Stage & Commit Chuẩn] ◀────────┘
```

---

### Bước 1: Kiểm tra trạng thái thay đổi (Inspect Status)

Chạy lệnh để xem danh sách file đã thay đổi:

```bash
git status
```

- Xác nhận chỉ có các file mã nguồn/tài liệu hợp lệ được thay đổi.
- Nếu có file nháp xuất hiện ở gốc, kiểm tra xem đã có trong `.gitignore` chưa.

---

### Bước 2: Tạo và chuyển sang nhánh làm việc mới (Branching)

Tạo nhánh theo đúng quy ước phân loại:

```bash
# Đối với tính năng mới:
git checkout -b feat/<ten-tinh-nang>

# Đối với sửa lỗi:
git checkout -b fix/<ten-loi>
```

_Ví dụ:_ `git checkout -b feat/misa-sync-automation`

---

### Bước 3: Kiểm tra chất lượng trước khi commit (Pre-flight Gate)

Chạy lệnh kiểm tra TypeScript:

```bash
npm run typecheck
```

- **Bắt buộc:** Phải đạt 0 lỗi trước khi commit. Nếu có lỗi type, sửa ngay lập tức.

---

### Bước 4: Thêm file và tạo Commit chuẩn (Stage & Commit)

Thêm các file cần lưu trữ:

```bash
# Thêm file cụ thể (Khuyên dùng):
git add <danh_sach_file>

# Hoặc thêm toàn bộ thay đổi an toàn:
git add .
```

Tạo commit theo chuẩn **Conventional Commits**:

```bash
git commit -m "<type>(<scope>): <mô tả ngắn gọn bằng tiếng Anh hoặc tiếng Việt>"
```

_Các tiền tố chuẩn:_

- `feat`: Thêm tính năng mới (ví dụ: `feat(misa): add e-invoice parser engine`)
- `fix`: Sửa lỗi (ví dụ: `fix(customer): fix duplicate tax code constraint`)
- `refactor`: Tái cấu trúc code (ví dụ: `refactor(db): use safeUpsert for suppliers`)
- `docs`: Cập nhật tài liệu (ví dụ: `docs(erp): update flow diagram`)

---

### Bước 5: Đẩy nhánh lên GitHub (Push Upstream)

Đẩy nhánh tính năng lên GitHub:

```bash
git push -u origin <ten-nhanh>
```

_Ví dụ:_ `git push -u origin feat/misa-sync-automation`

- **Kết quả:** Pre-push hook sẽ chạy các kiểm tra tự động (RPC check, theme check, typecheck). Vì đang push trên nhánh riêng (`feat/...`), **Branch Guard sẽ tự động cho qua 100%** mà không bị chặn!

---

## 💡 MẸO SỬ DỤNG NHANH CHO LẦN SAU

Lần sau khi muốn lưu và đẩy code, bạn chỉ cần gõ vào ô chat:

> **/git-workflow**

AI Agent sẽ tự động kiểm tra code, tạo nhánh chuẩn, commit đúng chuẩn conventional và push an toàn lên GitHub cho bạn từ A đến Z!
