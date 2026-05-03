# Bugfix Requirements Document

## Introduction

Hai feature module trong dự án vi phạm Level 9 Architecture rule bằng cách gọi Supabase trực tiếp trong Feature Layer thay vì đi qua API Layer (`src/api/`):

1. `src/features/contracts/contracts.service.ts` — chứa toàn bộ Supabase queries cho contracts, contract_order_links, contract_audit_logs, orders, customers, suppliers, và gọi Supabase Edge Functions trực tiếp. Không có `src/api/contracts.api.ts` tương ứng.

2. `src/features/contract-templates/contract-templates.module.ts` — chứa toàn bộ Supabase queries cho contract_templates. Không có `src/api/contract-templates.api.ts` tương ứng.

Theo kiến trúc bắt buộc của dự án:

- **Layer 3 (API)**: `src/api/` — nơi duy nhất được phép gọi Supabase DB
- **Layer 4 (Logic)**: `src/features/*/use*.ts` và service files — chỉ gọi API layer
- **Layer 5 (UI)**: `src/features/*/*.tsx` — chỉ render

Vi phạm này làm mờ ranh giới trách nhiệm, khiến business logic và data access bị trộn lẫn, gây khó khăn cho việc test, maintain và mở rộng.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN `contracts.service.ts` thực hiện read/write operations THEN hệ thống gọi `supabase.from('contracts')`, `supabase.from('contract_order_links')`, `supabase.from('contract_audit_logs')`, `supabase.from('orders')`, `supabase.from('customers')`, `supabase.from('suppliers')` trực tiếp trong Feature Layer, vi phạm Layer 3 boundary

1.2 WHEN `contracts.service.ts` cần export PDF hoặc generate contract THEN hệ thống gọi `supabase.auth.getSession()` và `supabase.functions.invoke()` trực tiếp trong Feature Layer thay vì qua API Layer

1.3 WHEN `contract-templates.module.ts` thực hiện CRUD operations THEN hệ thống gọi `supabase.from('contract_templates')` trực tiếp trong Feature Layer, vi phạm Layer 3 boundary

1.4 WHEN developer cần thêm caching, retry logic, hoặc request interceptor cho contracts/templates data THEN hệ thống không có điểm tập trung duy nhất (single source of truth) ở API Layer để áp dụng

1.5 WHEN developer tìm kiếm tất cả Supabase calls cho contracts THEN hệ thống phân tán queries giữa Feature Layer và API Layer, không nhất quán với các module khác (orders, customers, suppliers đều có `src/api/*.api.ts`)

### Expected Behavior (Correct)

2.1 WHEN `contracts.service.ts` cần thực hiện read/write operations THEN hệ thống SHALL gọi các hàm từ `src/api/contracts.api.ts` — file này là nơi duy nhất chứa `supabase.from(...)` calls cho contracts domain

2.2 WHEN `contracts.service.ts` cần export PDF hoặc generate contract THEN hệ thống SHALL gọi các hàm từ `src/api/contracts.api.ts` — file này chứa `supabase.auth.getSession()` và `supabase.functions.invoke()` calls

2.3 WHEN `contract-templates.module.ts` cần thực hiện CRUD operations THEN hệ thống SHALL gọi các hàm từ `src/api/contract-templates.api.ts` — file này là nơi duy nhất chứa `supabase.from('contract_templates')` calls

2.4 WHEN `contracts.service.ts` sau khi refactor THEN hệ thống SHALL chỉ chứa business logic (state machine validation, audit log orchestration), không còn bất kỳ `supabase.*` import hay call nào

2.5 WHEN `contract-templates.module.ts` sau khi refactor THEN hệ thống SHALL chỉ chứa business logic, không còn bất kỳ `supabase.*` import hay call nào

2.6 WHEN `src/api/contracts.api.ts` được tạo THEN hệ thống SHALL giữ nguyên pattern `safeUpsertOne` cho `linkOrderToContract` như đang dùng trong service hiện tại

### Unchanged Behavior (Regression Prevention)

3.1 WHEN caller hiện tại gọi `getContracts(filters)` từ `contracts.service.ts` THEN hệ thống SHALL CONTINUE TO trả về danh sách contracts với đúng filter, không thay đổi function signature

3.2 WHEN caller hiện tại gọi `getContractById(id)` THEN hệ thống SHALL CONTINUE TO trả về contract object hoặc throw error nếu không tìm thấy

3.3 WHEN caller hiện tại gọi `updateContract(id, data, performedBy)` THEN hệ thống SHALL CONTINUE TO từ chối update nếu status là 'signed' và ghi audit log sau khi update thành công

3.4 WHEN caller hiện tại gọi `updateContractStatus(id, status, meta)` THEN hệ thống SHALL CONTINUE TO validate state machine transitions và từ chối transitions không hợp lệ

3.5 WHEN caller hiện tại gọi `linkOrderToContract(contractId, orderId, linkedBy)` THEN hệ thống SHALL CONTINUE TO từ chối nếu contract đã 'signed' và dùng `safeUpsertOne` để upsert link

3.6 WHEN caller hiện tại gọi `unlinkOrderFromContract(contractId, orderId, performedBy)` THEN hệ thống SHALL CONTINUE TO từ chối nếu contract đã 'signed'

3.7 WHEN caller hiện tại gọi `getContractsByOrderId(orderId)` THEN hệ thống SHALL CONTINUE TO trả về danh sách contracts liên kết với order đó

3.8 WHEN caller hiện tại gọi `getOrdersByContractId(contractId)` THEN hệ thống SHALL CONTINUE TO trả về danh sách orders với linked_at metadata

3.9 WHEN caller hiện tại gọi `getAuditLogs(contractId)` THEN hệ thống SHALL CONTINUE TO trả về audit log theo thứ tự performed_at descending

3.10 WHEN caller hiện tại gọi `exportContractPdf(contractId)` THEN hệ thống SHALL CONTINUE TO invoke Edge Function với auth token

3.11 WHEN caller hiện tại gọi `generateContract(payload)` THEN hệ thống SHALL CONTINUE TO invoke Edge Function và trả về `GenerateContractResponse`

3.12 WHEN caller hiện tại gọi `getAvailableOrdersForContract(excludeIds)` THEN hệ thống SHALL CONTINUE TO trả về orders chưa bị cancel, đã lọc excludeIds

3.13 WHEN caller hiện tại gọi `getOrderOptions()`, `getCustomerOptions()`, `getSupplierOptions()` THEN hệ thống SHALL CONTINUE TO trả về option lists với đúng format `{ value, label, code }`

3.14 WHEN caller hiện tại gọi `getTemplates()` từ `contract-templates.module.ts` THEN hệ thống SHALL CONTINUE TO trả về tất cả templates theo thứ tự type, created_at

3.15 WHEN caller hiện tại gọi `getTemplateById(id)` THEN hệ thống SHALL CONTINUE TO trả về template hoặc throw error

3.16 WHEN caller hiện tại gọi `createTemplate(data)` THEN hệ thống SHALL CONTINUE TO dùng `safeUpsertOne` để tạo template mới

3.17 WHEN caller hiện tại gọi `updateTemplate(id, data)` THEN hệ thống SHALL CONTINUE TO cập nhật template và trả về bản ghi đã cập nhật

3.18 WHEN caller hiện tại gọi `getActiveTemplateByType(type)` THEN hệ thống SHALL CONTINUE TO trả về template active mới nhất theo type hoặc null

3.19 WHEN caller hiện tại gọi `deleteTemplate(id)` THEN hệ thống SHALL CONTINUE TO xóa template khỏi database

3.20 WHEN `validateStatusTransition(current, next)` được gọi THEN hệ thống SHALL CONTINUE TO hoạt động không thay đổi — hàm này là pure business logic, không liên quan đến data access
