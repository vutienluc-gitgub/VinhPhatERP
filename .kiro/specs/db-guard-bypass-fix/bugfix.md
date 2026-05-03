# Bugfix Requirements Document

## Introduction

Nhiều hàm trong codebase gọi `.insert()` hoặc `.upsert()` trực tiếp lên Supabase client thay vì đi qua các wrapper an toàn (`safeUpsert`, `safeUpsertOne`, `safeInsert`) được định nghĩa trong `src/lib/db-guard.ts`. Đây là vi phạm rule bắt buộc của dự án — db-guard tồn tại để đảm bảo idempotency, tránh duplicate khi retry, và chuẩn hóa error handling cho mọi write operation.

Ba điểm vi phạm cụ thể:

1. `writeAuditLog()` trong `contracts.service.ts` — gọi `.insert()` trực tiếp lên `contract_audit_logs`
2. `colorApi.upsert()` trong `color.api.ts` — gọi `.upsert()` trực tiếp lên `colors`
3. `logBlockedTransitionEvent()` trong `operations.api.ts` — gọi `.insert()` trực tiếp lên `business_audit_log`

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN `writeAuditLog()` được gọi trong `contracts.service.ts` THEN hệ thống gọi `supabase.from('contract_audit_logs').insert(...)` trực tiếp, bỏ qua db-guard, không có duplicate check

1.2 WHEN `writeAuditLog()` được gọi nhiều lần với cùng `id` (ví dụ do retry) THEN hệ thống tạo ra nhiều bản ghi audit log trùng lặp

1.3 WHEN `colorApi.upsert()` được gọi trong `color.api.ts` THEN hệ thống gọi `supabase.from('colors').upsert(payload, { onConflict: 'code' })` trực tiếp, bỏ qua db-guard

1.4 WHEN `logBlockedTransitionEvent()` được gọi trong `operations.api.ts` THEN hệ thống gọi `supabase.from('business_audit_log').insert(...)` trực tiếp, bỏ qua db-guard, không có duplicate check

1.5 WHEN bất kỳ hàm nào trong số trên gặp lỗi DB THEN hệ thống không có error logging chuẩn hóa từ db-guard (thiếu `console.error('❌ DB UPSERT ERROR:', error)`)

### Expected Behavior (Correct)

2.1 WHEN `writeAuditLog()` được gọi THEN hệ thống SHALL sử dụng `safeInsert({ table: 'contract_audit_logs', data, uniqueCheck: { column: 'id', value: id } })` để tránh duplicate

2.2 WHEN `writeAuditLog()` được gọi nhiều lần với cùng `id` (retry scenario) THEN hệ thống SHALL trả về bản ghi đã tồn tại thay vì tạo duplicate

2.3 WHEN `colorApi.upsert()` được gọi THEN hệ thống SHALL sử dụng `safeUpsert({ table: 'colors', data: payload, conflictKey: 'code' })` và trả về row đầu tiên từ kết quả

2.4 WHEN `logBlockedTransitionEvent()` được gọi THEN hệ thống SHALL sử dụng `safeInsert({ table: 'business_audit_log', data, uniqueCheck: { column: 'id', value: id } })` để tránh duplicate

2.5 WHEN bất kỳ hàm nào trong số trên gặp lỗi DB THEN hệ thống SHALL có error logging chuẩn hóa thông qua db-guard

### Unchanged Behavior (Regression Prevention)

3.1 WHEN `writeAuditLog()` được gọi với một `id` mới chưa tồn tại THEN hệ thống SHALL CONTINUE TO ghi bản ghi audit log thành công vào `contract_audit_logs`

3.2 WHEN `colorApi.upsert()` được gọi với `code` đã tồn tại THEN hệ thống SHALL CONTINUE TO cập nhật bản ghi màu hiện có (upsert behavior)

3.3 WHEN `colorApi.upsert()` được gọi với `code` mới THEN hệ thống SHALL CONTINUE TO tạo bản ghi màu mới

3.4 WHEN `logBlockedTransitionEvent()` được gọi với một `id` mới THEN hệ thống SHALL CONTINUE TO ghi sự kiện telemetry vào `business_audit_log`

3.5 WHEN các hàm `.select()`, `.update()`, `.delete()` được gọi trực tiếp trên Supabase client THEN hệ thống SHALL CONTINUE TO hoạt động bình thường — các thao tác này không cần qua db-guard

3.6 WHEN `media.service.ts` gọi `safeUpsert` cho `createFolder` và `uploadFile` THEN hệ thống SHALL CONTINUE TO hoạt động không thay đổi

3.7 WHEN `contracts.service.ts` gọi `safeUpsertOne` cho `linkOrderToContract` THEN hệ thống SHALL CONTINUE TO hoạt động không thay đổi

3.8 WHEN `operations.api.ts` gọi `safeUpsert` cho `createTask` THEN hệ thống SHALL CONTINUE TO hoạt động không thay đổi
