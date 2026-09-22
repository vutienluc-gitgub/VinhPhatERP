---
name: browser-automation
description: Automated browser verification, UI inspection, login flows, and visual proof generation for VinhPhatERP on both Local (localhost:5173) and Cloud VPS (103.213.216.31). Use whenever verifying UI components, testing AI Chat drawer, diagnosing missing elements, or confirming deployments on live browser.
---

# Browser Automation & UI Inspection Skill

## Overview

Skill này hướng dẫn AI Agent cách tự động mở trình duyệt, thực hiện luồng đăng nhập, kiểm tra tính năng thực tế trên giao diện (UI) và chụp ảnh/video bằng chứng cho hệ thống **ERP Vinh Phát** trên cả hai môi trường:

- **Local Dev**: `http://localhost:5173/`
- **Cloud VPS**: `http://103.213.216.31/` (hoặc domain chính thức `https://vinhphaterp.vn`)

---

## When to Activate This Skill

Kích hoạt skill này khi:

- Người dùng yêu cầu: _"tự mở browser kiểm tra"_, _"kiểm tra xem trên browser có thấy không"_, _"test trên giao diện"_...
- Vừa deploy xong lên Cloud VPS hoặc merge PR mới, cần xác thực live web có ăn code mới không.
- Nghi ngờ có sự lệch pha giữa code máy chủ (host) và container Docker (như sự cố Nginx/Docker phục vụ cache cũ).
- Cần bằng chứng hình ảnh (screenshot) hoặc video (`.webp`) để chứng minh tính năng hoạt động thực tế.

---

## Test Accounts & Credentials Reference

| Role         | Email                     | Password / Context   | Quyền & Phạm vi quan sát                                                                                 |
| ------------ | ------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------- |
| **Admin**    | `1081991@gmail.com`       | `Vinhphat@2026`      | Toàn quyền hệ thống. Thấy nút Trợ lý AI (`Sparkles`), Chat Inbox, Notification, Quản trị đơn hàng & kho. |
| **Customer** | `monmonhouse92@gmail.com` | (Portal token / OTP) | Cổng khách hàng. Bị ẩn nút Trợ lý AI và các chức năng nội bộ theo RBAC.                                  |

---

## Standard Execution Recipe (browser_subagent)

Khi triệu hồi `browser_subagent`, hãy cung cấp một prompt chi tiết và tự chứa (self-contained) bao gồm:

1. **Target URL**: Xác định rõ `http://localhost:5173/` hay `http://103.213.216.31/`.
2. **Auto-Login Guard**:
   - Nếu URL chuyển hướng về `/auth`, tự động nhập `#email` và `#password`.
   - Bấm nút submit và đợi URL chuyển sang trang đích (chờ 3-5 giây).
3. **Element Locators**:
   - **Nút Trợ lý AI**: `button.topbar-ai-btn` hoặc `button[title*="Trợ lý AI"]` hoặc icon `Sparkles`.
   - **Phím tắt AI Drawer**: Nhấn tổ hợp phím `Ctrl + J`.
   - **Hộp tin nhắn**: `button.topbar-chat-inbox-btn`.
   - **Nút Đổi Giao Diện (Dark/Light)**: `button[aria-label="Toggle Theme"]`.
4. **Action & Evidence**:
   - Bấm vào element mục tiêu.
   - Chờ hiệu ứng animation (slide-in drawer) hoàn tất (1-2s).
   - Chụp ảnh màn hình (screenshot) lưu vào thư mục artifacts.
   - Báo cáo rõ ràng kết quả tìm thấy trong DOM.

---

## Cloud vs Local Desync Diagnostic

Khi kiểm tra trên Cloud VPS mà tính năng không xuất hiện:

1. Chạy lệnh kiểm tra hash file JS đang được phục vụ bởi web server:
   ```bash
   curl.exe -s http://103.213.216.31/ | Select-String -Pattern "src=.*\.js"
   ```
2. So sánh với file JS vừa sinh ra trong thư mục build (`dist/assets/index-*.js`).
3. Nếu mã hash khác nhau $\rightarrow$ Nginx hoặc Docker container (`vinhphaterp-app`) đang phục vụ bản build cũ, cần đồng bộ lại vào container.
