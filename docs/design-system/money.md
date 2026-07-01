# Money Design Guidelines

Hệ thống tài liệu hướng dẫn chuẩn hóa hiển thị và nhập liệu Tiền tệ (`Money`) trong VinhPhat ERP. Việc tuân thủ nghiêm ngặt các nguyên tắc dưới đây là bắt buộc để đảm bảo sự đồng bộ toàn hệ thống.

## I. Nguyên Tắc Cốt Lõi (Core Principles)

1. **Database Layer luôn lưu số nguyên thô (`number`)**: Các trường giá, tổng tiền, thuế đều là `number` trong CSDL và Domain Layer.
2. **Không Format dữ liệu ở Domain Layer**: Các logic tính toán tổng, trừ chiết khấu phải được thực hiện trên số thô.
3. **Chỉ Format ở Tầng Hiển Thị (UI Layer/Display Layer)**: Format giá trị thô thành chuỗi `string` chỉ diễn ra tại các Component hiển thị của `Value Design System`.
4. **Stateless Design (Phi trạng thái)**: Component của Design System không tự suy diễn Business Logic (ví dụ: Không tự biến số dương thành màu xanh hay số âm thành màu đỏ). Trạng thái màu sắc (tone) do Feature UI tự quyết định.

## II. Các Component Chuẩn Mực

| Tình huống sử dụng               | Component dùng   | Lưu ý                              |
| -------------------------------- | ---------------- | ---------------------------------- |
| Đoạn text inline, label hiển thị | `<MoneyText />`  | Dùng `tone` thay vì `variant`      |
| Ô trong Data Grid / Table        | `<MoneyCell />`  | Tự động tabular-nums & align-right |
| Thẻ thông tin nhanh, trạng thái  | `<MoneyBadge />` |                                    |
| KPI Card Dashboard/Reports       | `<MoneyStat />`  | Hỗ trợ icon, trend, compact        |
| Form nhập liệu giá tiền          | `<MoneyInput />` | Auto format phân cách ngàn         |

### Ví dụ sử dụng `tone`

Cả `MoneyText` và `MoneyCell` đều hỗ trợ `tone`:

```tsx
// Lãi/Thu (Xanh lá)
<MoneyText value={profit} tone="success" />

// Lỗ/Chi (Đỏ)
<MoneyText value={loss} tone="danger" />

// Dữ liệu tham khảo (Xám)
<MoneyText value={referencePrice} tone="muted" />
```

## III. Danh Sách Các Hành Vi Bị Cấm (Forbidden List)

Sau đợt Architecture Migration, tuyệt đối KHÔNG ĐƯỢC PHÉP sử dụng các hàm formatter thủ công trong mã nguồn giao diện người dùng (React JSX `src/features/**/*.tsx`).

ESLint rule đã được kích hoạt để chặn các hành vi sau:

❌ `formatCurrency(value)`
❌ `new Intl.NumberFormat(...).format(value)`
❌ `value.toLocaleString(...)`
❌ `Number(value).toLocaleString(...)`
❌ Nối chuỗi đơn vị thủ công: `${value} đ`, `+" VND"`, `+" đ/kg"`, `+" đ/m"`, `+" đ/cuộn"`.

**Cách sửa (Migration):**
Dùng `<MoneyText value={value} suffix="đ/kg" />` hoặc `<MoneyCell value={value} />`.

## IV. Các Ngoại Lệ (Exceptions)

Được phép sử dụng các hàm raw formatter (như `formatCurrency`) trong các trường hợp sau (không render ra HTML UI):

- Chức năng Export ra tệp `CSV` / `Excel`
- Tính toán layout trong tệp `PDF` Export (ví dụ: dùng `react-pdf`)
- Gửi Notification, SMS, Zalo ZNS
- Data transfer qua `API`, xử lý backend `RPC`
- Unit Testing, Logging, Console.
