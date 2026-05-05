# Master Data Repository

Thư mục chứa dữ liệu nền tảng (Master Data) được trích xuất từ các nguồn bên ngoài để import vào VinhPhat ERP.

## Cấu trúc thư mục

```
src/master-data/
├── README.md                           # File này
├── suppliers/                          # Thông tin nhà cung cấp
│   └── eastino-knitting-machine.md     # East (Quanzhou) - Nhà sản xuất máy dệt
├── seed/                               # Seed data dạng TypeScript
│   └── eastino-knitting-machine.seed.ts # Data dùng để import
└── types/                              # TypeScript types cho seed data
    └── (tbd)
```

## Nhà cung cấp hiện có

### 1. East (Quanzhou) Intelligent Technology Co., Ltd. (EASTINO)

**Loại:** Nhà sản xuất máy dệt kim tròn (Circular Knitting Machines)  
**Quốc gia:** Trung Quốc  
**Website:** https://www.eastinoknittingmachine.com

**Danh mục sản phẩm:**
| Loại | Số model | Giá từ | Giá đến |
|------|----------|--------|---------|
| Double Jersey (2 mặt) | 6 | $45,000 | $75,000 |
| Single Jersey (1 mặt) | 8 | $18,000 | $42,000 |
| Phụ kiện | 4 | $800 | $2,500 |

**Thông số nổi bật:**

- 280+ nhân viên
- 1000+ máy/năm
- 7 phân xưởng sản xuất
- Xuất khẩu toàn cầu
- Giải thưởng "Best Supplier" Alibaba 2021

**File dữ liệu:**

- Tài liệu: `suppliers/eastino-knitting-machine.md`
- Seed data: `seed/eastino-knitting-machine.seed.ts`

## Cách sử dụng

### 1. Import vào database

```typescript
import { eastinoSeedData } from './seed/eastino-knitting-machine.seed';

// Insert supplier
await db.suppliers.insert(eastinoSeedData.supplier);

// Insert machine catalog
await db.machine_catalog.insertMany(eastinoSeedData.machines);
```

### 2. Truy vấn dữ liệu

```typescript
// Lấy tất cả máy Double Jersey
db.machine_catalog.find({ category: 'double_jersey' });

// Lấy máy trong khoảng giá
db.machine_catalog.find({
  estimated_price_usd: { $gte: 30000, $lte: 50000 },
});
```

## Quy trình cập nhật Master Data

1. **Trích xuất** từ nguồn (website, catalog, API)
2. **Làm sạch** và chuẩn hóa dữ liệu
3. **Review** bởi team liên quan
4. **Import** vào database staging
5. **Verify** dữ liệu chính xác
6. **Deploy** lên production

## Lưu ý quan trọng

- Giá trong seed data là **giá ước tính** từ website, cần liên hệ nhà cung cấp để có báo giá chính xác
- Thông số kỹ thuật có thể **thay đổi** theo phiên bản máy
- Cần **verify** lại với nhà cung cấp trước khi dùng cho procurement
- Cập nhật định kỳ (6 tháng/lần) để đảm bảo dữ liệu mới nhất
