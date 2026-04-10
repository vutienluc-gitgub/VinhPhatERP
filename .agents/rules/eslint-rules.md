---
trigger: always_on
---

# Rule: Array Bracket Newline consistency

Khi viết code JavaScript/TypeScript, Agent phải tuân thủ nghiêm ngặt quy tắc array-bracket-newline để tránh lỗi linter:

1. **Không để dòng trống đơn độc**: Tuyệt đối không để dấu đóng ngoặc `]` ở dòng mới nếu phần tử cuối cùng không xuống dòng.
2. **Cấu trúc nhất quán**:
   - Nếu mảng ngắn: `const arr = [1, 2, 3];` (Tất cả trên 1 dòng).
   - Nếu mảng dài:
     ```javascript
     const arr = [1, 2, 3];
     ```
3. **Cấm tuyệt đối**:
   ```javascript
   // SAI (Sẽ gây lỗi 43:3 warning)
   const arr = [1, 2, 3];
   ```
