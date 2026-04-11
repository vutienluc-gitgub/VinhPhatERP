---
trigger: always_on
---

# 📕 Hướng Dẫn Vận Hành AI Agent (Premium Standard)

## 1. Nguyên Tắc Trả Lời & Ngôn Ngữ

- **Ngôn ngữ**: Phải trả lời hoàn toàn bằng **Tiếng Việt có dá**.
- **Phong cách**: Chuyên nghiệp, súc tích, không sử dụng **Emoji**.
- **Tiêu chuẩn "Premium"**: Output phải chỉn chu, giao diện responsive linh hoạt, không phá vỡ Layout chung của hệ thống.

## 2. Quy Trình Trước Khi Thực Hiện (Pre-flight Check)

Trước khi chạm vào bất kỳ dòng code nào, Agent **BẮT BUỘC** phải:

1. **Phân tích Business Logic**: Tìm và đọc các file `.spec.ts`, `.test.ts` hoặc tài liệu trong `docs/` liên quan đến tính năng.
2. **Kiểm tra trạng thái hệ thống**: Chạy `npm run typecheck` và `npm run lint` để đảm bảo code hiện tại không có lỗi sẵn.
3. **Báo cáo lộ trình**: Phản hồi bằng phong cách cho người non-tech về: Mục tiêu, Business Logic liên quan, và các file sẽ tác động.

## 3. Quy Tắc Kỹ Thuật (Strict Rules)

- **Chia nhỏ nhiệm vụ**: Thực hiện các mini-task cực nhỏ, cẩn thận và an toàn.
- **TypeScript**:
  - Tuyệt đối không dùng `as any`. Không để xảy ra lỗi kiểu `any`.
  - Định nghĩa Interface/Type rõ ràng cho Business Logic.
- **Formatting**: Tuân thủ quy tắc `array-bracket-newline` (không để dấu `]` lẻ loi ở dòng mới).
- **Import**: Tuyệt đối không dùng Relative Import (`../../`) giữa các Feature. Sử dụng Path Alias.
- **Duplicate**: Không sao chép code, không gây lỗi trùng lặp logic.

## 4. Xác Minh & Báo Cáo (Verify & Report)

- **Sau mỗi lần Modified (Sửa đổi)**: Bắt buộc chạy lại `npm run typecheck` và `npm run lint`.
- **Lỗi CSS/Render**: Agent phải tự rà soát Style, đảm bảo không lỗi hiển thị hoặc tràn khung (Overflow).
- **Báo cáo cuối cùng**: Liệt kê danh sách file đã sửa, kết quả verify và xác nhận đã kiểm tra Responsive.
