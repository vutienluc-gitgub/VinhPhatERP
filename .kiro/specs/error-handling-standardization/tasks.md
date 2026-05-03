# Tasks — Error Handling Standardization

## Task List

- [ ] 1. Fix console logs trong `useCreateOrderV2.ts`
  - [ ] 1.1 Wrap `console.warn` trong fallback path bằng `if (import.meta.env.DEV)` guard
  - [ ] 1.2 Xóa `console.info` trong `onSuccess` callback
  - [ ] 1.3 Xóa `console.error` trong `onError` callback; giữ lại callback body trống hoặc xóa nếu không cần
  - [ ] 1.4 Verify build không có TypeScript errors sau khi thay đổi

- [ ] 2. Fix silent failure trong `ExpenseForm.tsx`
  - [ ] 2.1 Thay `async function onSubmit` dùng `mutateAsync` + try/catch bằng `function onSubmit` dùng `mutate` với `onSuccess: onClose` callback
  - [ ] 2.2 Xóa `console.error('[ExpenseForm]', err)` (catch block sẽ không còn tồn tại)
  - [ ] 2.3 Verify `mutationError` được set đúng khi mutation thất bại (create và update)
  - [ ] 2.4 Verify `onClose()` vẫn được gọi khi mutation thành công
  - [ ] 2.5 Verify build không có TypeScript errors sau khi thay đổi

- [ ] 3. Verification
  - [ ] 3.1 Chạy TypeScript type check (`tsc --noEmit`) để đảm bảo không có lỗi type
  - [ ] 3.2 Kiểm tra không còn `console.log`, `console.info`, `console.warn`, `console.error` nào nằm ngoài `import.meta.env.DEV` guard trong hai file đã sửa
  - [ ] 3.3 Smoke test thủ công: tạo phiếu chi thành công → form đóng
  - [ ] 3.4 Smoke test thủ công: tạo phiếu chi với lỗi (network off hoặc validation fail) → `mutationError` hiển thị trong UI
