# Quy trình Quản lý Đề xuất Thay đổi (.changes)

Thư mục `.changes/` là nơi lưu trữ các đề xuất tính năng, bản vá lỗi, hoặc kế hoạch refactor theo chuẩn **Spec-Driven Development (SDD)**, kết hợp chặt chẽ với quy trình 5 Pha và các Cổng phê duyệt tại [AI_WORKFLOW.md](file:///d:/VinhPhatERP_v3/AI_WORKFLOW.md).

---

## 1. Cấu trúc thư mục

```text
.changes/
├── README.md               # Hướng dẫn quy trình
├── template/               # Thư mục mẫu dùng để khởi tạo một change mới
│   ├── proposal.md         # Bối cảnh, mục tiêu, Impact Map
│   ├── delta-spec.md       # Thay đổi đặc tả nghiệp vụ (nếu có)
│   └── tasks.md            # Checklist công việc theo 5 Phase
├── active/                 # Các đề xuất đang trong quá trình thực hiện
│   └── <task-slug>/        # Tên thư mục theo quy ước: kebab-case
└── archive/                # Lịch sử các đề xuất đã nghiệm thu thành công
```

---

## 2. Vòng đời của một Change (Change Lifecycle)

1. **Khởi tạo (Propose)**:
   - Copy `template/` sang `active/<task-slug>/`.
   - Điền đầy đủ `proposal.md`, `delta-spec.md`, `tasks.md`.
   - Yêu cầu Kỹ sư trưởng phê duyệt **Gate 1 (`APPROVE PHASE 2`)**.

2. **Thực thi (Apply)**:
   - AI thực hiện lần lượt từng task trong `tasks.md`.
   - Tuân thủ nghiêm ngặt các cổng:
     - **Gate 2 (`APPROVE PHASE 3`)**: Phê duyệt xong tầng Core/DB mới qua UI.
     - **Gate 3 (`APPROVE PHASE 4 & 5`)**: Phê duyệt xong UI mới qua Cleanup/Test.

3. **Nghiệm thu & Lưu trữ (Archive)**:
   - Sau khi Gate 4 (`APPROVE MERGE`) được thông qua và CI/Test PASS 100%:
   - Nếu có `delta-spec.md`, cập nhật nội dung mới vào `specs/<domain>/spec.md`.
   - Di chuyển thư mục từ `active/<task-slug>` sang `archive/<YYYY-MM>/<task-slug>`.
