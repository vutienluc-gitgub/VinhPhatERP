---
description: Quy trình tự động mở trình duyệt kiểm tra giao diện, xác thực và kiểm thử tính năng (Local & Cloud VPS)
---

# Quy trình Tự động Mở Browser Kiểm thử Giao diện (Browser Automation Verification)

> **Mục đích:** Hướng dẫn AI Agent tự động sử dụng công cụ trình duyệt (`browser_subagent` hoặc Playwright) để kiểm tra giao diện, đăng nhập tài khoản, xác nhận hiển thị tính năng và chụp ảnh/video bằng chứng trên cả môi trường **Local (`localhost:5173`)** và **Cloud VPS (`103.213.216.31`)**.

---

## 🚨 NGUYÊN TẮC BẮT BUỘC (CRITICAL)

1. **Bằng chứng thực tế (Evidence Rule):** Không bao giờ kết luận "giao diện đã hiển thị" chỉ dựa trên việc đọc code. Phải mở browser thật, tương tác thật, và chụp screenshot/ghi video làm bằng chứng.
2. **Kiểm tra đúng môi trường:**
   - **Local:** `http://localhost:5173/` (cần kiểm tra `npm run dev` đang chạy).
   - **Cloud VPS:** `http://103.213.216.31/` hoặc domain chính thức.
3. **Phân quyền tài khoản (RBAC Guard):**
   - **Admin:** `1081991@gmail.com` / `Vinhphat@2026` (nhìn thấy toàn bộ tính năng nội bộ, bao gồm Trợ lý AI, Quản trị, Phê duyệt).
   - **Customer:** `monmonhouse92@gmail.com` (chỉ nhìn thấy cổng khách hàng, các nút nội bộ như Trợ lý AI bị ẩn theo phân quyền).
4. **Kiểm tra lệch Cache / Docker Container:** Khi kiểm tra trên Cloud VPS, luôn kiểm tra mã hash file JS (`/assets/index-*.js`) để phát hiện Nginx hoặc Docker container có đang phục vụ bản build cũ không.

---

## 🛠️ QUY TRÌNH 5 BƯỚC THỰC THI (5-STEP PROTOCOL)

```text
[1. Pre-flight Check] ──▶ [2. Launch Browser] ──▶ [3. Auth & Navigate]
                                                      │
                                                      ▼
[5. Report & Evidence] ◀── [4. Interact & Verify] ◀───┘
```

---

### Bước 1: Chuẩn bị môi trường (Pre-flight Check)

- **Nếu kiểm tra Local (`http://localhost:5173/`):**

  ```powershell
  # Kiểm tra cổng 5173 đã bật chưa
  Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
  # Nếu chưa có, bật background daemon:
  # run_command: npm run dev (IsDaemon: true)
  ```

- **Nếu kiểm tra Cloud VPS (`http://103.213.216.31/`):**
  ```powershell
  # Kiểm tra kết nối cổng 80
  Test-NetConnection -ComputerName 103.213.216.31 -Port 80
  # Kiểm tra mã hash của bản build đang phục vụ trên VPS
  curl.exe -s http://103.213.216.31/ | Select-String -Pattern "src=.*\.js"
  ```

---

### Bước 2: Khởi tạo Browser Subagent

Gọi công cụ `browser_subagent` với các tham số chuẩn hóa:

```json
{
  "TaskName": "Verify Feature On Browser",
  "RecordingName": "verify_feature_flow",
  "TaskSummary": "Mở trình duyệt đăng nhập và kiểm tra giao diện tính năng",
  "Task": "1. Mở URL (Local hoặc Cloud VPS).\n2. Nếu ở trang /auth, nhập email và password, bấm Đăng nhập.\n3. Chờ điều hướng vào Dashboard (/ hoặc /dashboard).\n4. Tìm và kiểm tra phần tử mục tiêu (ví dụ: nút Trợ lý AI .topbar-ai-btn).\n5. Tương tác với phần tử (click hoặc nhấn phím tắt như Ctrl+J).\n6. Chụp ảnh màn hình (screenshot) chứng minh trạng thái mở thành công.\n7. Báo cáo chi tiết các phần tử tìm thấy trong DOM."
}
```

---

### Bước 3: Đăng nhập & Điều hướng (Auth & Navigation)

- Nếu browser rơi vào `/auth` hoặc yêu cầu đăng nhập:
  1. Điền vào ô input `#email`: `1081991@gmail.com`
  2. Điền vào ô input `#password`: `Vinhphat@2026`
  3. Bấm nút Submit (`button[type="submit"]` hoặc nút mang text _"Đăng nhập vào hệ thống"_).
  4. Chờ 3 - 5 giây để token lưu vào `localStorage` và chuyển trang thành công.

---

### Bước 4: Tương tác & Xác minh mục tiêu (Interact & Verify)

Tuỳ theo mục tiêu kiểm thử:

1. **Kiểm tra Trợ lý AI (AI Chat):**
   - Vị trí: Thanh header trên cùng (**TopBar**), góc phải.
   - Selector: `button.topbar-ai-btn` hoặc `button[title*="Trợ lý AI"]` hoặc icon `Sparkles`.
   - Phím tắt kích hoạt: Nhấn tổ hợp phím **`Ctrl + J`** (hoặc `Cmd + J`).
   - Kết quả mong đợi: Ngăn kéo `.ai-chat-drawer` trượt ra từ bên phải màn hình, có hiển thị pill _"Gemini 3.6"_, tin nhắn chào mừng và khung nhập text.

2. **Kiểm tra Hộp tin nhắn (Chat Inbox / Drawer):**
   - Selector: `button.topbar-chat-inbox-btn` hoặc `button[aria-label*="Tin nhắn"]`.
   - Kết quả mong đợi: Mở danh sách hội thoại phòng chat (`.chat-inbox-drawer`).

3. **Kiểm tra Đơn hàng / Dệt may / Kho sợi:**
   - Điều hướng trực tiếp tới `/orders`, `/yarn-receipts`, `/customers` và kiểm tra bảng dữ liệu, loading skeleton và pagination.

---

### Bước 5: Báo cáo & Đính kèm bằng chứng (Visual Proof)

Luôn đính kèm hình ảnh và video thu được từ phiên chạy:

1. **Đính kèm ảnh chụp màn hình:**
   ```markdown
   ![Bằng chứng giao diện](/absolute/path/to/screenshot.png)
   ```
2. **Đính kèm video ghi hình tương tác:**
   ```markdown
   [Xem video tương tác trình duyệt](file:///absolute/path/to/recording.webp)
   ```
3. **Báo cáo trạng thái DOM:** Trích dẫn chính xác class, role, title của element đã được xác nhận.
