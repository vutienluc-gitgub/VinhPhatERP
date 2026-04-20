---
trigger: always_on
---

Separate business logic from UI.
Use hooks for data and logic.
Keep components focused on rendering.

## Strict Separation Protocol (Level 9 Architecture)

- **Pure UI (Presentational)**: UI Component (`.tsx`) sinh ra CHỈ để nhận dữ liệu cấu hình sẵn (Props) và "vẽ" ra màn hình. Tuyệt đối cấm khai báo kết nối Cơ sở dữ liệu (Supabase) trực tiếp trong file UI.
- **Infrastructure Layer**: Mọi hành động thao tác với Database (Fetch, Insert, Update, RPC) phải và bắt buộc phải nằm ở hạ tầng `src/api/`.
- **Domain Use-Cases Layer**: Các Hook tại `src/application/` đóng vai trò là xương sống xử lý logic (Domain Use-cases). Nó giao tiếp với API, biến đổi dữ liệu (Mapping), xử lý Trạng thái hệ thống (Loading/Success/Error) và cung cấp Data hoàn chỉnh cho UI tiêu thụ.
