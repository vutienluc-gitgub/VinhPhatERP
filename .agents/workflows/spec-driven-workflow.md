---
description: Quy trình Phát triển Hướng Đặc tả (Spec-Driven Development) — Khởi tạo Proposal, Delta Spec, và thực thi theo Approval Gates chuẩn ERP Vinh Phát.
---

# Quy trình Phát triển Hướng Đặc tả (Spec-Driven Development Workflow)

> **Mục đích:** Quy chuẩn hóa toàn bộ vòng đời phát triển tính năng, sửa lỗi phức tạp hoặc refactor trong **VinhPhatERP v3**. Kết hợp sức mạnh của **Living Specifications (`specs/`)** với quy trình 5 Pha có Cổng phê duyệt tại [AI_WORKFLOW.md](file:///d:/VinhPhatERP_v3/AI_WORKFLOW.md).

---

## 🚨 NGUYÊN TẮC CỐT LÕI (GOLDEN RULES)

1. **Không code khi chưa có Spec**: Tuyệt đối không viết code trực tiếp khi chưa hoàn thành và được duyệt file `proposal.md` và `tasks.md` trong `.changes/active/<task-slug>/`.
2. **ERP Safety First**: Nghiêm cấm thay đổi cách tính công nợ, hao hụt dệt nhuộm, hoặc tồn kho mà không khai báo rõ ràng trong `delta-spec.md`.
3. **Tuân thủ Approval Token Protocol**: Từng pha chuyển đổi phải có sự xác nhận bằng token chuẩn từ Kỹ sư trưởng (`APPROVE PHASE 2`, `APPROVE PHASE 3`, `APPROVE PHASE 4 & 5`, `APPROVE MERGE`).

---

## 🛠️ VÒNG ĐỜI 3 GIAI ĐOẠN (3-STAGE LIFECYCLE)

```text
┌─────────────────────────────────────────────────────────────┐
│                 GIAI ĐOẠN 1: PROPOSE & SPEC                 │
│  Đọc living spec -> Khởi tạo .changes/ -> Duyệt Gate 1      │
└──────────────────────────────┬──────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────┐
│                 GIAI ĐOẠN 2: APPLY & VERIFY                 │
│  Thực thi Phase 2 (Core) -> Phase 3 (UI) -> Phase 5 (Test)  │
└──────────────────────────────┬──────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────┐
│                GIAI ĐOẠN 3: ARCHIVE & SYNC                  │
│  Đồng bộ delta vào specs/ -> Lưu trữ change -> Git commit   │
└─────────────────────────────────────────────────────────────┘
```

---

### Giai đoạn 1: Khởi tạo Đề xuất (Propose & Spec)

1. **Khảo sát đặc tả hiện tại**:
   - Đọc tài liệu tương ứng trong [specs/](file:///d:/VinhPhatERP_v3/specs/) (`yarn`, `raw-fabric`, `dyeing`, `inventory`, `orders`, `finance`).
   - Đọc [22 ERP Rules](file:///d:/VinhPhatERP_v3/.erp-rules.md) để xác định các ràng buộc bất biến.

2. **Khởi tạo thư mục Change**:
   - Tạo thư mục: `.changes/active/<task-slug>/` (ví dụ: `.changes/active/yarn-slip-scan/`).
   - Copy nội dung từ `.changes/template/` sang:
     - `proposal.md`: Bối cảnh, mục tiêu, và Impact Map (`UI -> Hook -> Service -> API/RPC -> DB`).
     - `delta-spec.md`: Khác biệt nghiệp vụ (nếu có bổ sung/chỉnh sửa). Nếu không đổi nghiệp vụ, ghi rõ `NO BUSINESS BEHAVIOR CHANGE`.
     - `tasks.md`: Phân rã các checklist theo từng pha.

3. **Chốt chặn Gate 1**:
   - Trình bày kế hoạch cho Kỹ sư trưởng.
   - **Dừng lại chờ token duyệt**: `APPROVE PHASE 2`.

---

### Giai đoạn 2: Thực thi theo Kế hoạch (Apply & Verify)

Tuân thủ nghiêm ngặt quy trình tại [AI_WORKFLOW.md](file:///d:/VinhPhatERP_v3/AI_WORKFLOW.md):

1. **Phase 2: Core / Data / Domain**:
   - Triển khai schema Zod, database service, `safeUpsert`, atomic RPC.
   - Viết Unit Test Vitest (`npm run test`) kiểm thử toàn bộ trường hợp biên.
   - _Tick hoàn thành các mục tương ứng trong `tasks.md`._
   - **Chốt chặn Gate 2**: Chờ token `APPROVE PHASE 3`.

2. **Phase 3: UI / UX**:
   - Kết nối Component với Core Service.
   - Sử dụng Semantic Design Tokens, bổ sung Skeleton, Error State, Empty State.
   - Đảm bảo Render Safety (Null guard, stable key).
   - **Chốt chặn Gate 3**: Chờ token `APPROVE PHASE 4 & 5`.

3. **Phase 4 & 5: Cleanup & Verification Loop**:
   - Chạy đủ 5 lệnh kiểm tra chất lượng (áp dụng **Evidence Rule §1.2** - ghi nhận kết quả thực tế):
     ```powershell
     npm run rpc:check
     npm run typecheck
     npm run lint -- --max-warnings=0
     npm run lint:css
     npm run test
     ```
   - **Chốt chặn Gate 4**: Chờ token `APPROVE MERGE`.

---

### Giai đoạn 3: Nghiệm thu & Đồng bộ (Archive & Sync)

Sau khi nhận được token `APPROVE MERGE`:

1. **Đồng bộ Living Spec**:
   - Nếu có `delta-spec.md`, cập nhật nội dung mới vào file gốc `specs/<domain>/spec.md` để tài liệu luôn là nguồn chân lý sống.
2. **Lưu trữ Change (Archive)**:
   - Tạo thư mục lưu trữ theo tháng: `.changes/archive/<YYYY-MM>/`.
   - Di chuyển `.changes/active/<task-slug>/` vào thư mục lưu trữ.
3. **Đẩy mã nguồn an toàn**:
   - Thực hiện theo quy trình tại [.agents/workflows/git-workflow.md](file:///d:/VinhPhatERP_v3/.agents/workflows/git-workflow.md) để commit và push qua Branch Guard.
