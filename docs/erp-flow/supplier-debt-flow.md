# Supplier Debt Business Flow

Sơ đồ nghiệp vụ quản lý công nợ nhà cung cấp. Dễ dàng chỉnh sửa, mở rộng cho các nghiệp vụ liên quan.

```mermaid
flowchart TD
    A[1. Tạo nhà cung cấp] --> B[2. Tạo định mức BOM]
    B --> F[3. Tạo phiếu gia công]
    F --> C[4. Tạo phiếu nhập mộc hàng loạt ( đã có)]
    C --> D[5. Gắn với đớn giá gia công theo lô mộc]
    D --> E[6. Báo cáo & Đối chiếu công nợ]
    E -->|Phát hiện sai lệch| C
    C -->|Kiểm tra số dư| D
    B -->|Chứng từ nhập kho| C
    D -->|Phiếu chi| E
    style A fill:#e0f7fa,stroke:#00796b
    style B fill:#fff9c4,stroke:#fbc02d
    style C fill:#ffe0b2,stroke:#f57c00
    style D fill:#c8e6c9,stroke:#388e3c
    style E fill:#bbdefb,stroke:#1976d2
``
```
