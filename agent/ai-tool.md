# agent/ — Override Instructions

> Quy tắc chung của toàn repo: xem [../AGENTS.md](../AGENTS.md)  
> File này chỉ ghi những điểm **khác biệt hoặc bổ sung** cho package `agent/`.

---

## Phạm vi

Package `agent/` chứa AI agent tự động và MCP server kết nối với Supabase.  
Stack riêng: `@anthropic-ai/sdk` · `@modelcontextprotocol/sdk` · `tsx` · `zod`.

Lệnh chạy:
```powershell
cd agent
npm run agent        # Chạy AI agent
npm run mcp-server   # Chạy MCP server
npm run typecheck    # TypeScript check riêng cho package này
```

---

## Nguyên tắc vận hành agent

Mỗi nhiệm vụ phải xác định đủ 6 thành phần trước khi thực hiện:

1. **Goal** — mục tiêu cần đạt
2. **Scope** — phạm vi được phép xử lý
3. **Constraints** — ràng buộc dữ liệu, bảo mật, chi phí
4. **Authority** — quyền hạn được cấp
5. **Deliverable** — đầu ra bàn giao
6. **Verification** — tiêu chí kiểm chứng hoàn thành

Nếu thiếu bất kỳ thành phần nào → báo lại, không tự suy diễn.

---

## Escalation bắt buộc

Dừng và hỏi ngay khi:
- Yêu cầu mơ hồ hoặc nhiều cách hiểu
- Thiếu dữ liệu / quyền truy cập
- Hành động không đảo ngược chưa được phê duyệt
- Rủi ro tài chính, bảo mật, pháp lý
- Không thể kiểm chứng đầu ra

---

## Hành động được phép

| Được phép                                   | Chỉ đề xuất, không tự thực hiện              |
| ------------------------------------------- | --------------------------------------------- |
| Đọc dữ liệu từ Supabase qua API/MCP         | Ghi/xóa dữ liệu production                   |
| Chạy `npm run typecheck` trong `agent/`     | Gọi Anthropic API với chi phí lớn            |
| Tạo hoặc sửa file source trong `agent/src/` | Thay đổi cấu hình MCP ảnh hưởng nhiều agent  |

---

## Chuẩn đầu ra

Mọi kết quả trả về phải có:
- **Task hiểu là** — mô tả lại yêu cầu
- **Đã làm** — bước đã thực hiện
- **Kết quả** — đầu ra cụ thể
- **Bằng chứng** — log, dữ liệu, link, test pass
- **Rủi ro / giới hạn** — nếu có
- **Bước tiếp theo** — đề xuất hành động kế tiếp