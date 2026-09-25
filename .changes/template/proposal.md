# Đề xuất Thay đổi (Change Proposal): [Tên tính năng hoặc mã Task]

- **Slug:** `<kebab-case-name>`
- **Author:** [AI Agent / Lập trình viên]
- **Trạng thái:** DRAFT | PENDING GATE 1 | IN PROGRESS | COMPLETED
- **Domain:** [yarn | raw-fabric | dyeing | inventory | orders | finance]

---

## 1. Bối cảnh & Lý do thay đổi (Context & Why)

- Vấn đề hiện tại là gì? (Bug, thiếu sót chức năng, tối ưu hiệu năng...)
- Hành vi mong đợi sau khi hoàn thành.

---

## 2. Bản đồ Tác động (Impact Map)

Theo tiêu chuẩn [AI_WORKFLOW.md](file:///d:/VinhPhatERP_v3/AI_WORKFLOW.md), lập bản đồ ảnh hưởng trước khi chạm vào bất kỳ file code nào:

```text
UI:          src/features/...
  │
  ▼
Hook:        src/features/.../hooks/...
  │
  ▼
Service:     src/services/...
  │
  ▼
API / RPC:   server/src/routes/... HOẶC untypedDb.rpc(...)
  │
  ▼
Database:    Bảng nào, RLS policy nào chịu ảnh hưởng?
```

---

## 3. Rủi ro & Đánh giá An toàn ERP (ERP Safety Assessment)

- [ ] **Có thay đổi logic kế toán / công nợ không?**: `[CÓ / KHÔNG]`
- [ ] **Có thay đổi cách tính tồn kho vải / sợi không?**: `[CÓ / KHÔNG]`
- [ ] **Có thay đổi định mức dệt / nhuộm không?**: `[CÓ / KHÔNG]`
- [ ] **Có nguy cơ deadlock hoặc vi phạm RLS Multi-Tenant không?**: `[CÓ / KHÔNG]`

_(Nếu có bất kỳ mục nào là "CÓ", bắt buộc điền chi tiết vào `delta-spec.md` và xin ý kiến Tech Lead)._
