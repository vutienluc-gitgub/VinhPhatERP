---
name: vinhphat-copilot
description: Chuyên gia tự động hóa và hỗ trợ phát triển toàn diện cho hệ thống Dệt May Vĩnh Phát (VinhPhatERP v3). Kích hoạt khi cần phân tích luồng dệt nhuộm, kiểm tra tồn kho vải, tạo migration Supabase, chạy kiểm thử tự động, hoặc audit bảo mật.
---

# Vinh Phat Copilot Skill

Skill này cung cấp các kịch bản tự động hóa chuyên biệt cho dự án VinhPhatERP v3.

## Các lệnh tự động hóa thường dùng:

1. **Kiểm tra chất lượng & toàn vẹn hệ thống**:

   ```powershell
   npm run audit:full
   ```

   (Bao gồm rpc sync, vapid check, lint, typecheck frontend & server, theme contract).

2. **Chạy kiểm thử toàn bộ**:

   ```powershell
   npm run test
   ```

3. **Kiểm tra cơ sở dữ liệu & migration**:

   ```powershell
   npm run db:status
   npm run rpc:check
   ```

4. **Kiểm toán bảo mật chuyên sâu**:
   - Sử dụng bộ skill kiểm toán độc lập tại [.agents/skills/security-audit/SKILL.md](file:///D:/VinhPhatERP_v3/.agents/skills/security-audit/SKILL.md).
   - Kiểm tra tính hợp lệ của báo cáo bảo mật:
     ```powershell
     node .agents/skills/security-audit/validate-findings.cjs <path-to-findings.json>
     ```
   - Kiểm tra ledger độ phủ bảo mật:
     ```powershell
     node .agents/skills/security-audit/validate-coverage-ledger.cjs <path-to-ledger.json>
     ```

5. **Phát triển hướng đặc tả (Spec-Driven Development)**:
   - Tra cứu đặc tả nghiệp vụ dệt may chuẩn tại [specs/](file:///d:/VinhPhatERP_v3/specs/).
   - Quản lý đề xuất và các Cổng phê duyệt tại [.changes/](file:///d:/VinhPhatERP_v3/.changes/).
   - Thực thi workflow chuẩn qua [.agents/workflows/spec-driven-workflow.md](file:///d:/VinhPhatERP_v3/.agents/workflows/spec-driven-workflow.md).

## Nguyên tắc nghiệp vụ dệt may:

- **Chu trình sản xuất**: `Sợi (Yarn) -> Dệt mộc (Weaving/Greige) -> Nhuộm (Dyeing) -> Định hình/Hoàn tất (Finishing) -> Kiểm phẩm & Đóng gói (Packing) -> Giao hàng (Shipment)`.
- Mọi dữ liệu phải gắn liền với `tenant_id` và phân quyền nghiêm ngặt.
