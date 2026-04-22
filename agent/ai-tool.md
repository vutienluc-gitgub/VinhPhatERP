# agent/ — Override Instructions

> Quy tắc chung của toàn repo: xem [../AGENTS.md](../AGENTS.md)  
> File này chỉ ghi những điểm **khác biệt hoặc bổ sung** cho package `agent/`.

---

## Phạm vi

Package `agent/` chứa AI agent tự động và MCP server kết nối với Supabase.  
Stack riêng: `@anthropic-ai/sdk` · `@modelcontextprotocol/sdk` · `tsx` · `zod`.

Lệnh chạy:

```powershell
cd agent
npm run agent        # Chạy AI agent
npm run mcp-server   # Chạy MCP server
npm run typecheck    # TypeScript check riêng cho package này
```

---

## Nguyên tắc vận hành agent

Mỗi nhiệm vụ phải xác định đủ 6 thành phần trước khi thực hiện:

1. **Goal** — mục tiêu cần đạt
2. **Scope** — phạm vi được phép xử lý
3. **Constraints** — ràng buộc dữ liệu, bảo mật, chi phí
4. **Authority** — quyền hạn được cấp
5. **Deliverable** — đầu ra bàn giao
6. **Verification** — tiêu chí kiểm chứng hoàn thành

Nếu thiếu bất kỳ thành phần nào → báo lại, không tự suy diễn.

---

## Escalation bắt buộc

Dừng và hỏi ngay khi:

- Yêu cầu mơ hồ hoặc nhiều cách hiểu
- Thiếu dữ liệu / quyền truy cập
- Hành động không đảo ngược chưa được phê duyệt
- Rủi ro tài chính, bảo mật, pháp lý
- Không thể kiểm chứng đầu ra

---

## Pre-submission Validation — BẮT BUỘC

**Trước khi submit bất kỳ code nào, AI phải chạy đủ các lệnh sau:**

```powershell
npm run check        # = npm run lint + npm run typecheck (bắt buộc)
npm run test         # Chạy unit test (bắt buộc nếu có test liên quan)
```

### Quy trình validation

1. **Tạo code** → File source mới hoặc sửa file
2. **Chạy check** → `npm run check` (lint + typecheck)
   - ❌ Nếu có lỗi → **FIX NGAY, không submit**
   - ✅ Nếu PASS → Sang bước 3
3. **Chạy test** → `npm run test` (nếu tạo test hoặc sửa logic)
   - ❌ Nếu test fail → **FIX NGAY, không submit**
   - ✅ Nếu PASS → Sang bước 4
4. **Submit** → Báo lại kết quả với bằng chứng

### Bằng chứng bắt buộc phải kèm

```
✅ Lint:     npm run lint → [PASS or 0 errors]
✅ Type:     npm run typecheck → [PASS or 0 errors]
✅ Test:     npm run test → [X passed] (nếu có test)
```

**Nếu không có bằng chứng validation → không được phép submit.**

### Nếu gặp validation error

| Lỗi              | Cách xử lý                                                |
| ---------------- | --------------------------------------------------------- |
| ESLint error     | Sửa code theo rule, sau đó `eslint --fix`, chạy lại check |
| TypeScript error | Bổ sung type, loại bỏ `any`, xử lý null/undefined         |
| Test fail        | Debug logic, xem test case, fix code, chạy lại test       |

---

## Hành động được phép

| Được phép                                   | Chỉ đề xuất, không tự thực hiện              |
| ------------------------------------------- | -------------------------------------------- |
| Đọc dữ liệu từ Supabase qua API/MCP         | Ghi/xóa dữ liệu production                   |
| Chạy `npm run check` (lint + typecheck)     | Gọi Anthropic API với chi phí lớn            |
| Chạy `npm run test` để kiểm tra code        | Thay đổi cấu hình MCP ảnh hưởng nhiều agent  |
| Tạo hoặc sửa file source trong `agent/src/` | Push code chưa pass validation               |
| Fix lỗi lint/type khi chạy check            | Disable ESLint rule bằng `// eslint-disable` |

---

## Chuẩn đầu ra

Mọi kết quả trả về phải có:

- **Task hiểu là** — mô tả lại yêu cầu
- **Đã làm** — bước đã thực hiện
- **Kết quả** — đầu ra cụ thể (file tạo, sửa gì)
- **Validation** — ✅ npm run check PASS · ✅ npm run test PASS (bắt buộc)
- **Bằng chứng** — console log, test output, hoặc lệnh chạy
- **Rủi ro / giới hạn** — nếu có
- **Bước tiếp theo** — đề xuất hành động kế tiếp

### Mẫu báo cáo

```
### Task hiểu là
Tạo component [X] với [Y] props

### Đã làm
1. Tạo file src/shared/components/[X].tsx
2. Viết unit test src/shared/components/[X].test.tsx
3. Chạy npm run check
4. Chạy npm run test

### Kết quả
- ✅ src/shared/components/[X].tsx (123 lines)
- ✅ src/shared/components/[X].test.tsx (45 lines)

### Validation
✅ npm run check: PASS (0 errors, 0 warnings)
✅ npm run test: 2 passed

### Bằng chứe

[paste lệnh output hoặc screenshot]

### Bước tiếp theo
Có thể integrate vào features/[name]/
```
