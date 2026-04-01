# VinhPhat App V2 — Giới thiệu dự án

## Tổng quan

**VinhPhat App V2** là hệ thống ERP, quản lý vận hành nội bộ dành cho doanh nghiệp dệt may,
được xây dựng theo kiến trúc mobile-first với công nghệ hiện đại.
Ứng dụng số hóa toàn bộ quy trình từ nhập nguyên liệu (sợi), sản xuất vải,
quản lý đơn hàng, theo dõi tiến độ, đến xuất hàng và thanh toán.

## Tổng quan

## Ngày bắt đầu dự án:

- **Start**: 20/03/2026

## Công nghệ sử dụng

| Lớp                | Công nghệ                                  |
| ------------------ | ------------------------------------------ |
| Frontend           | React 18, TypeScript 5, Vite 5             |
| Routing            | React Router DOM v6                        |
| Server state       | TanStack React Query v5                    |
| Form & validation  | React Hook Form v7 + Zod v3                |
| Backend / Database | Supabase (PostgreSQL, Auth, RLS, Realtime) |
| Styling            | CSS thuần — mobile-first, design tokens    |
| Build alias        | `@/` → `src/`                              |
| Test               | Vitest                                     |

---

## Cấu trúc thư mục

```
src/
├── app/
│   ├── layouts/      AppShell — khung giao diện chính
│   ├── providers/    AppProviders — bọc toàn bộ context/provider
│   └── router/       AppRouter — định nghĩa route ứng dụng
├── features/         Mỗi thư mục con = 1 module nghiệp vụ
├── shared/
│   ├── components/   UI component tái sử dụng
│   ├── hooks/        Custom hooks dùng chung
│   ├── lib/          Tiện ích, helpers
│   ├── types/        TypeScript types/interfaces dùng chung
│   └── utils/        Hàm xử lý thuần (không có side-effects)
├── services/
│   ├── supabase/     Khởi tạo Supabase client
│   └── offline/      Hàng đợi thao tác offline
└── styles/
    ├── global.css    Design tokens, reset, typography
    └── app-shell.css Layout grid và component vỏ

supabase/
├── migrations/       SQL migrations (schema versioned)
└── seed/             Dữ liệu mẫu

docs/                 Tài liệu dự án
tests/
├── unit/
└── integration/
```

---

## Các module nghiệp vụ

| Module              | Mô tả                                                                |
| ------------------- | -------------------------------------------------------------------- |
| **Auth**            | Đăng nhập, phân quyền (admin / manager / staff / viewer)             |
| **Customers**       | Danh mục khách hàng                                                  |
| **Suppliers**       | Danh mục nhà cung cấp (sợi, thuốc nhuộm, phụ liệu…)                  |
| **Yarn Receipts**   | Phiếu nhập sợi, chi tiết từng loại sợi                               |
| **Raw Fabric**      | Quản lý cuộn vải mộc sau công đoạn dệt                               |
| **Finished Fabric** | Quản lý cuộn vải thành phẩm sau hoàn tất                             |
| **Orders**          | Đơn hàng từ khách, gồm các dòng vải yêu cầu                          |
| **Order Progress**  | Theo dõi tiến độ sản xuất theo 7 công đoạn                           |
| **Shipments**       | Phiếu xuất hàng, liên kết với cuộn vải cụ thể                        |
| **Payments**        | Phiếu thu tiền, tự động cập nhật số tiền đã thanh toán trên đơn hàng |
| **Inventory**       | Điều chỉnh tồn kho thủ công, lịch sử thay đổi                        |
| **Reports**         | Báo cáo tổng hợp (doanh thu, tồn kho, tiến độ)                       |
| **Settings**        | Cài đặt hệ thống (tên công ty, tiền tố số chứng từ…)                 |

Chi tiet tung module nghiep vu da duoc tach rieng trong `docs/modules/README.md`.

---

## Quy trình nghiệp vụ chính

```
Nhà cung cấp
    │
    ▼
[Yarn Receipt] ─► Nhập sợi vào kho
    │
    ▼
[Raw Fabric Roll] ─► Cuộn vải mộc (dệt xong)
    │
    ▼
[Finished Fabric Roll] ─► Cuộn vải thành phẩm (sau hoàn tất/nhuộm)
    │
    ├──► [Order] ◄── Khách hàng
    │       │
    │       ▼
    │  [Order Progress] (warping → weaving → dyeing → finishing → packing)
    │       │
    │       ▼
    │  [Shipment] ─► Xuất hàng
    │       │
    │       ▼
    └──► [Payment] ─► Thu tiền
```

---

## Nguyên tắc UX

- **Mobile-first**: giao diện hoạt động mượt ở màn hình 360 px, không scroll ngang.
- **Form ngắn gọn**: ưu tiên nhập liệu nhanh, có phản hồi lưu và đồng bộ rõ ràng.
- **Danh sách dạng card** trên mobile, tăng thêm thông tin trên desktop.
- **Thao tác tối giản**: tối ưu cho quy trình nhập liệu và cập nhật tiến độ hàng ngày.

---

## Biến môi trường

Tạo file `.env.local` ở root dự án:

```env
VITE_SUPABASE_URL=https://<project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

---

## Lệnh thường dùng

```bash
# Chạy dev server
npm run dev

# Kiểm tra kiểu TypeScript
npm run typecheck

# Build production
npm run build

# Chạy test
npx vitest

# Xem trạng thái migration (đã chạy / chưa chạy)
npm run db:status

# Tạo file migration mới
npm run db:new ten_migration

# Đẩy migration lên Supabase thật
npm run db:push
```

---

## Phạm vi phiên bản hiện tại (V2 MVP)

- [x] Khung dự án (Vite + React + TS + Supabase)
- [x] Schema database đầy đủ với RLS
- [ ] Scaffold các feature module
- [ ] Wire Supabase client + React Query
- [ ] Auth flow (đăng nhập / bảo vệ route)
- [ ] Offline queue thực tế
- [ ] Báo cáo và xuất PDF/Excel
      user có đúng role
