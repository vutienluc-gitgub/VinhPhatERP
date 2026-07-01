# Migration Dashboard (Value Design System)

Bảng theo dõi tiến độ chuẩn hóa Kiến trúc Tiền tệ (Money Architecture) trên toàn bộ ERP.

## 📈 Overall Progress

| Phase | Target                                                 | Progress | Status     |
| ----- | ------------------------------------------------------ | -------- | ---------- |
| A     | `MoneyText`, `MoneyCell`, `MoneyStat`, core formatters | 100%     | ✅ Done    |
| B     | `Display Layer` (all tables/details rendering money)   | 100%     | ✅ Done    |
| C     | `Input Layer` (`MoneyInput`, `FormattedInput`)         | 0%       | 🔄 Next    |
| D     | `Table Layer` (`DataTable` columns)                    | 0%       | ⏳ Pending |

## 🔍 Display Layer Metrics (React JSX `src/features`)

Đây là số đếm lượng vi phạm cần dọn dẹp trước khi đạt được chuẩn. (Chỉ tính những trường hợp render ra UI, bỏ qua các export logic, csv, backend RPC).

- [x] CRM Module
- [x] Dashboard Module
- [x] Reports Module
- [x] Shipments Module
- [x] Shipping Rates Module
- [x] Suppliers Module
- [x] Weaving Invoices Module
- [x] Shared Components (`CurrencyInput`, `FormattedInput`, `KpiCard`, etc.)
- [x] Removed all ESLint `no-restricted-syntax` violations (`Intl.NumberFormat` & `formatCurrency`).

## 🛑 ESLint Enforcement

- Cấu hình rule cấm `formatCurrency` trong JSX: **Đã cấu hình** (Bật `warning` trên toàn `src/**/*.tsx` với ngoại lệ logic/csv).
- Phase B: Thay thế Tầng Hiển Thị (Display Layer)\*\* — [100%] Hoàn tất
