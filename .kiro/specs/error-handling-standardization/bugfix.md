# Bugfix Requirements Document

## Introduction

Codebase hiện tại có hai vấn đề error handling ảnh hưởng đến production:

1. **Console logs không phù hợp trong production** — `useCreateOrderV2.ts` và `ExpenseForm.tsx` sử dụng `console.warn`, `console.info`, `console.error` trực tiếp, làm lộ thông tin business nhạy cảm (order number, số rolls allocated, full error object) trong browser console của môi trường production.

2. **Silent failure trong `ExpenseForm.onSubmit`** — Khi dùng `mutateAsync` bên trong try/catch, error bị nuốt tại catch block và không được propagate lên React Query's error state. Kết quả là `mutationError` luôn là `null`, UI không bao giờ hiển thị lỗi cho user dù mutation thất bại.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN Edge Function không thể kết nối và fallback sang direct insert THEN hệ thống gọi `console.warn` với full error object, làm lộ thông tin kỹ thuật trong browser console của production

1.2 WHEN tạo order thành công THEN hệ thống gọi `console.info` với `result.orderNumber` và số lượng rolls allocated, làm lộ thông tin business nhạy cảm trong browser console của production

1.3 WHEN mutation tạo/sửa order thất bại THEN hệ thống gọi `console.error` với error code và message, làm lộ thông tin lỗi nội bộ trong browser console của production

1.4 WHEN `ExpenseForm.onSubmit` gọi `mutateAsync` và mutation thất bại THEN error bị catch tại try/catch block, `console.error` được gọi với full error object, và React Query's `mutationError` state không được set (luôn là `null`)

1.5 WHEN `mutationError` luôn là `null` THEN UI không bao giờ hiển thị thông báo lỗi cho user dù thao tác tạo/sửa phiếu chi thất bại

### Expected Behavior (Correct)

2.1 WHEN Edge Function không thể kết nối và fallback sang direct insert THEN hệ thống SHALL xử lý silently trong production (không gọi console) hoặc chỉ log trong development mode (`import.meta.env.DEV`)

2.2 WHEN tạo order thành công THEN hệ thống SHALL không gọi `console.info` với thông tin business trong production; log chỉ được phép trong development mode nếu cần

2.3 WHEN mutation tạo/sửa order thất bại THEN hệ thống SHALL không gọi `console.error` trong production; React Query's `onError` callback SHALL không log thông tin lỗi ra console

2.4 WHEN `ExpenseForm.onSubmit` gọi mutation và mutation thất bại THEN error SHALL được propagate lên React Query's error state để `mutationError` được set đúng

2.5 WHEN `mutationError` được set THEN UI SHALL hiển thị thông báo lỗi cho user thông qua phần tử `<p className="error-inline">` đã có sẵn trong JSX

### Unchanged Behavior (Regression Prevention)

3.1 WHEN mutation tạo/sửa order thành công THEN hệ thống SHALL CONTINUE TO gọi `onClose()` và đóng form

3.2 WHEN Edge Function không thể kết nối THEN hệ thống SHALL CONTINUE TO fallback sang direct DB insert và tạo order thành công

3.3 WHEN mutation trả về business error (CREDIT_BLOCKED, CREDIT_OVERDUE, CREDIT_LIMIT_EXCEEDED, stock error) THEN hệ thống SHALL CONTINUE TO throw error để UI xử lý credit/stock warning flow

3.4 WHEN `mutationError` có giá trị THEN UI SHALL CONTINUE TO hiển thị message lỗi trong `<p className="error-inline">` như hiện tại

3.5 WHEN form submit với dữ liệu hợp lệ THEN hệ thống SHALL CONTINUE TO gọi đúng mutation (create hoặc update) tùy theo `isEditing`

3.6 WHEN query cache cần invalidate sau khi tạo order THEN hệ thống SHALL CONTINUE TO invalidate `orders`, `finished-fabric`, `reserve-rolls`, `customers` query keys
