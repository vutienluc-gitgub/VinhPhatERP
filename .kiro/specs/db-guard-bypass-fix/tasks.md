# Tasks — DB-Guard Bypass Fix

## Task List

- [ ] 1. Fix `writeAuditLog` trong `contracts.service.ts`
  - [ ] 1.1 Thêm `safeInsert` vào import từ `@/lib/db-guard`
  - [ ] 1.2 Tạo biến `id` bằng `crypto.randomUUID()` trước khi gọi
  - [ ] 1.3 Thay thế `supabase.from('contract_audit_logs').insert(...)` bằng `safeInsert({ table, data, uniqueCheck: { column: 'id', value: id } })`
  - [ ] 1.4 Xóa `if (error) throw error` — db-guard đã xử lý
  - [ ] 1.5 Xác nhận TypeScript compile không có lỗi

- [ ] 2. Fix `colorApi.upsert` trong `color.api.ts`
  - [ ] 2.1 Thêm import `safeUpsert` từ `@/lib/db-guard`
  - [ ] 2.2 Thay thế `supabase.from('colors').upsert(payload, { onConflict: 'code' }).select().single()` bằng `safeUpsert({ table: 'colors', data: payload, conflictKey: 'code' })`
  - [ ] 2.3 Trả về `Array.isArray(result) ? result[0] : result` để giữ nguyên return type
  - [ ] 2.4 Xóa `if (error) throw error` — db-guard đã xử lý
  - [ ] 2.5 Xác nhận TypeScript compile không có lỗi

- [ ] 3. Fix `logBlockedTransitionEvent` trong `operations.api.ts`
  - [ ] 3.1 Thêm `safeInsert` vào import hiện có từ `@/lib/db-guard` (đã có `safeUpsert`)
  - [ ] 3.2 Tạo biến `id` bằng `crypto.randomUUID()` trước khi gọi
  - [ ] 3.3 Thay thế `supabase.from('business_audit_log').insert(...)` bằng `safeInsert({ table, data, uniqueCheck: { column: 'id', value: id } })`
  - [ ] 3.4 Đổi `satisfies Json` cast thành `as Record<string, unknown>` cho payload
  - [ ] 3.5 Xóa `if (error) throw error` — db-guard đã xử lý
  - [ ] 3.6 Xác nhận TypeScript compile không có lỗi

- [ ] 4. Verification
  - [ ] 4.1 Chạy `tsc --noEmit` để xác nhận không có TypeScript errors
  - [ ] 4.2 Kiểm tra không còn lời gọi `.insert()` hoặc `.upsert()` trực tiếp nào trong 3 file đã fix
  - [ ] 4.3 Xác nhận `media.service.ts` không bị thay đổi
