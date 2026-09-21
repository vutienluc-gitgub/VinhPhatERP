const fs = require('fs');
const path = require('path');

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeFileIfMissing(relPath, content) {
  const fullPath = path.join(process.cwd(), 'src', relPath);
  if (!fs.existsSync(fullPath)) {
    ensureDir(fullPath);
    fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
    console.log('Created:', relPath);
  }
}

function createStandardPlugin(key, label, shortLabel, description, group, order, iconName, defaultTitle, mockColumns, mockData) {
  const compName = key.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('') + 'Page';
  
  return `
import React, { useState } from 'react';
import type { ERPPlugin } from '@/app/types/plugin';
import { Button } from '@/shared/components/Button';
import { DataTable } from '@/shared/components/DataTable';
import { Badge } from '@/shared/components/Badge';
import { SearchInput } from '@/shared/components/SearchInput';
import { Plus, Download, Filter } from 'lucide-react';

export function ${compName}() {
  const [search, setSearch] = useState('');
  const [data] = useState(${JSON.stringify(mockData, null, 2)});

  const filtered = data.filter((item) => 
    Object.values(item).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">${defaultTitle}</h1>
          <p className="text-sm text-slate-500 mt-1">${description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<Download size={16} />}>
            Xuất Excel
          </Button>
          <Button size="sm" icon={<Plus size={16} />}>
            Tạo mới
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="w-full sm:w-80">
          <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm nhanh..." />
        </div>
        <Button variant="outline" size="sm" icon={<Filter size={16} />}>
          Bộ lọc nâng cao
        </Button>
      </div>

      <DataTable
        columns={[
          ${mockColumns}
        ]}
        data={filtered}
        emptyMessage="Không tìm thấy bản ghi nào"
      />
    </div>
  );
}

export const ${key.replace(/-([a-z])/g, g => g[1].toUpperCase())}Plugin: ERPPlugin = {
  key: '${key}',
  label: '${label}',
  shortLabel: '${shortLabel}',
  description: '${description}',
  icon: '${iconName}',
  group: '${group}',
  order: ${order},
  entryPath: '/${key}',
  routes: [
    {
      path: '/${key}',
      component: () => Promise.resolve({ default: ${compName} }),
    },
  ],
};

export default ${key.replace(/-([a-z])/g, g => g[1].toUpperCase())}Plugin;
`;
}

// ──────────────────────────────────────────────
// Features generator
// ──────────────────────────────────────────────
const features = [
  {
    key: 'quotations',
    label: 'Báo giá & Đề xuất',
    shortLabel: 'Báo giá',
    desc: 'Quản lý báo giá dệt may và duyệt giá',
    group: 'sales',
    order: 10,
    icon: 'FileText',
    title: 'Danh sách Báo giá',
    cols: `
      { header: 'Mã báo giá', accessorKey: 'code', className: 'font-semibold text-blue-600' },
      { header: 'Khách hàng', accessorKey: 'customer' },
      { header: 'Loại vải', accessorKey: 'fabric' },
      { header: 'Số lượng (m)', accessorKey: 'qty' },
      { header: 'Tổng tiền', accessorKey: 'total', cell: (row: any) => <span>{row.total.toLocaleString()} ₫</span> },
      { header: 'Trạng thái', accessorKey: 'status', cell: (row: any) => <Badge variant={row.status === 'approved' ? 'success' : 'warning'}>{row.status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt'}</Badge> },
      { header: 'Ngày tạo', accessorKey: 'created_at' },
    `,
    data: [
      { id: '1', code: 'BG-2026-001', customer: 'May Việt Tiến', fabric: 'Vải Cotton 100% 4c', qty: 5000, total: 275000000, status: 'approved', created_at: '28/08/2026' },
      { id: '2', code: 'BG-2026-002', customer: 'Phong Phú', fabric: 'Vải Cá Sấu CVC', qty: 2000, total: 110000000, status: 'pending', created_at: '29/08/2026' },
    ],
  },
  {
    key: 'orders',
    label: 'Đơn hàng (Sales Orders)',
    shortLabel: 'Đơn hàng',
    desc: 'Quản lý đơn hàng sản xuất và bán hàng',
    group: 'sales',
    order: 20,
    icon: 'ShoppingBag',
    title: 'Quản lý Đơn hàng',
    cols: `
      { header: 'Mã đơn', accessorKey: 'code', className: 'font-semibold text-blue-600' },
      { header: 'Khách hàng', accessorKey: 'customer' },
      { header: 'Sản phẩm', accessorKey: 'item' },
      { header: 'Số lượng', accessorKey: 'quantity' },
      { header: 'Giá trị', accessorKey: 'amount', cell: (row: any) => <span>{row.amount.toLocaleString()} ₫</span> },
      { header: 'Tiến độ', accessorKey: 'progress', cell: (row: any) => <span className="font-medium text-emerald-600">{row.progress}%</span> },
      { header: 'Trạng thái', accessorKey: 'status', cell: (row: any) => <Badge variant="primary">{row.status}</Badge> },
    `,
    data: [
      { id: '1', code: 'SO-2026-089', customer: 'May Việt Tiến', item: 'Cotton Single 100%', quantity: '5,000 m', amount: 350000000, progress: 65, status: 'Đang dệt' },
      { id: '2', code: 'SO-2026-090', customer: 'Thời Trang An Phước', item: 'Thun Cá Mập TC', quantity: '3,000 m', amount: 210000000, progress: 100, status: 'Đã hoàn thành' },
    ],
  },
  {
    key: 'order-kanban',
    label: 'Kanban Đơn hàng',
    shortLabel: 'Kanban',
    desc: 'Theo dõi đơn hàng theo bảng trực quan',
    group: 'sales',
    order: 25,
    icon: 'Kanban',
    title: 'Bảng Kanban Đơn hàng',
    cols: `
      { header: 'Cột tiến trình', accessorKey: 'stage' },
      { header: 'Số lượng đơn', accessorKey: 'count' },
      { header: 'Tổng khối lượng (kg)', accessorKey: 'weight' },
    `,
    data: [
      { id: '1', stage: 'Chờ lên chuyền', count: 4, weight: '12,500' },
      { id: '2', stage: 'Đang dệt mộc', count: 8, weight: '24,000' },
      { id: '3', stage: 'Đang nhuộm', count: 5, weight: '15,800' },
      { id: '4', stage: 'KCS & Đóng gói', count: 3, weight: '9,200' },
    ],
  },
  {
    key: 'shipments',
    label: 'Giao hàng & Vận chuyển',
    shortLabel: 'Giao hàng',
    desc: 'Quản lý phiếu xuất kho và lộ trình giao vận',
    group: 'sales',
    order: 35,
    icon: 'Truck',
    title: 'Quản lý Giao hàng',
    cols: `
      { header: 'Mã vận đơn', accessorKey: 'code', className: 'font-semibold text-blue-600' },
      { header: 'Đơn hàng', accessorKey: 'order_code' },
      { header: 'Khách hàng', accessorKey: 'customer' },
      { header: 'Tài xế', accessorKey: 'driver' },
      { header: 'Biển số', accessorKey: 'license_plate' },
      { header: 'Trạng thái', accessorKey: 'status', cell: (row: any) => <Badge variant={row.status === 'delivered' ? 'success' : 'info'}>{row.status === 'delivered' ? 'Đã giao' : 'Đang chuyển'}</Badge> },
    `,
    data: [
      { id: '1', code: 'SHIP-2026-044', order_code: 'SO-2026-089', customer: 'May Việt Tiến', driver: 'Nguyễn Văn Hải', license_plate: '51C-889.23', status: 'shipping' },
      { id: '2', code: 'SHIP-2026-043', order_code: 'SO-2026-090', customer: 'An Phước', driver: 'Trần Minh Tâm', license_plate: '51D-123.45', status: 'delivered' },
    ],
  },
  {
    key: 'yarn-receipts',
    label: 'Nhập kho Sợi',
    shortLabel: 'Nhập Sợi',
    desc: 'Phiếu nhập kho nguyên liệu sợi từ nhà cung cấp',
    group: 'production',
    order: 40,
    icon: 'Layers',
    title: 'Phiếu Nhập Kho Sợi',
    cols: `
      { header: 'Số phiếu', accessorKey: 'code', className: 'font-semibold text-blue-600' },
      { header: 'Nhà cung cấp', accessorKey: 'supplier' },
      { header: 'Loại sợi', accessorKey: 'yarn_type' },
      { header: 'Số lượng (kg)', accessorKey: 'weight' },
      { header: 'Lô sản xuất', accessorKey: 'lot_number' },
      { header: 'Ngày nhập', accessorKey: 'date' },
    `,
    data: [
      { id: '1', code: 'PN-SOI-001', supplier: 'Sợi Nam Định', yarn_type: 'Cotton Ne 30/1 Combed', weight: '5,400', lot_number: 'LOT-ND-2026A', date: '27/08/2026' },
      { id: '2', code: 'PN-SOI-002', supplier: 'Sợi Huế', yarn_type: 'Polyester Ne 40/1 DTY', weight: '3,200', lot_number: 'LOT-HUE-992', date: '28/08/2026' },
    ],
  },
  {
    key: 'work-orders',
    label: 'Lệnh sản xuất (WO)',
    shortLabel: 'Lệnh SX',
    desc: 'Điều phối ca kíp, máy dệt và chỉ thị dệt',
    group: 'production',
    order: 45,
    icon: 'Cpu',
    title: 'Lệnh Sản Xuất',
    cols: `
      { header: 'Mã lệnh', accessorKey: 'code', className: 'font-semibold text-blue-600' },
      { header: 'Mã máy dệt', accessorKey: 'loom' },
      { header: 'Mặt hàng', accessorKey: 'product' },
      { header: 'Kế hoạch (kg)', accessorKey: 'target' },
      { header: 'Thực đạt (kg)', accessorKey: 'actual' },
      { header: 'Trạng thái', accessorKey: 'status', cell: (row: any) => <Badge variant="primary">{row.status}</Badge> },
    `,
    data: [
      { id: '1', code: 'WO-2026-112', loom: 'Máy Dệt Tròn #04', product: 'Vải Cotton 4C 180gsm', target: '2,500', actual: '1,840', status: 'Đang chạy' },
      { id: '2', code: 'WO-2026-113', loom: 'Máy Dệt Tròn #09', product: 'Vải Cá Sấu CVC 220gsm', target: '1,800', actual: '1,800', status: 'Hoàn thành' },
    ],
  },
  {
    key: 'raw-fabric',
    label: 'Kho Mộc (Raw Fabric)',
    shortLabel: 'Kho Mộc',
    desc: 'Quản lý cây vải mộc sau khi hạ máy dệt',
    group: 'production',
    order: 50,
    icon: 'Package',
    title: 'Quản lý Cây Vải Mộc',
    cols: `
      { header: 'Mã cây', accessorKey: 'roll_code', className: 'font-semibold text-blue-600' },
      { header: 'Loại vải mộc', accessorKey: 'fabric' },
      { header: 'Trọng lượng (kg)', accessorKey: 'weight' },
      { header: 'Máy dệt', accessorKey: 'loom' },
      { header: 'KCS Mộc', accessorKey: 'kcs_status', cell: (row: any) => <Badge variant="success">Loại 1 (A)</Badge> },
      { header: 'Vị trí kệ', accessorKey: 'location' },
    `,
    data: [
      { id: '1', roll_code: 'MOC-2026-0982', fabric: 'Cotton 4 Chiều Mộc', weight: '24.5', loom: 'MD-04', location: 'Kệ A-02' },
      { id: '2', roll_code: 'MOC-2026-0983', fabric: 'Cotton 4 Chiều Mộc', weight: '25.1', loom: 'MD-04', location: 'Kệ A-02' },
    ],
  },
  {
    key: 'weaving-invoices',
    label: 'Gia công Dệt (Gia công)',
    shortLabel: 'GC Dệt',
    desc: 'Hóa đơn và đối soát công dệt vệ tinh',
    group: 'production',
    order: 55,
    icon: 'Receipt',
    title: 'Đối soát Gia công Dệt',
    cols: `
      { header: 'Mã đối soát', accessorKey: 'code', className: 'font-semibold text-blue-600' },
      { header: 'Xưởng vệ tinh', accessorKey: 'contractor' },
      { header: 'Sản lượng (kg)', accessorKey: 'weight' },
      { header: 'Đơn giá', accessorKey: 'unit_price', cell: (row: any) => <span>{row.unit_price.toLocaleString()} ₫/kg</span> },
      { header: 'Thành tiền', accessorKey: 'total', cell: (row: any) => <span className="font-semibold text-emerald-600">{row.total.toLocaleString()} ₫</span> },
    `,
    data: [
      { id: '1', code: 'DS-DET-019', contractor: 'Xưởng Dệt Thành Công', weight: '8,200', unit_price: 12000, total: 98400000 },
    ],
  },
  {
    key: 'finished-fabric',
    label: 'Kho Vải Thành Phẩm',
    shortLabel: 'Vải TP',
    desc: 'Quản lý cuộn vải thành phẩm sau nhuộm hoàn tất',
    group: 'production',
    order: 60,
    icon: 'Archive',
    title: 'Kho Vải Thành Phẩm',
    cols: `
      { header: 'Mã cây TP', accessorKey: 'code', className: 'font-semibold text-blue-600' },
      { header: 'Tên hàng', accessorKey: 'name' },
      { header: 'Màu sắc', accessorKey: 'color' },
      { header: 'Khổ / Định lượng', accessorKey: 'specs' },
      { header: 'Tồn kho (kg)', accessorKey: 'stock_kg' },
      { header: 'Tồn kho (mét)', accessorKey: 'stock_m' },
    `,
    data: [
      { id: '1', code: 'TP-COT-001', name: 'Thun Cotton 100% 4C', color: 'Trắng Sứ (White #01)', specs: '1m75 / 185gsm', stock_kg: '1,450', stock_m: '4,500' },
      { id: '2', code: 'TP-COT-002', name: 'Thun Cotton 100% 4C', color: 'Đen Tuyển (Black #09)', specs: '1m75 / 185gsm', stock_kg: '2,100', stock_m: '6,400' },
    ],
  },
  {
    key: 'inventory',
    label: 'Tổng kho & Tồn trữ',
    shortLabel: 'Tồn kho',
    desc: 'Báo cáo tổng hợp nhập xuất tồn nguyên phụ liệu & thành phẩm',
    group: 'master-data',
    order: 65,
    icon: 'Layers',
    title: 'Tổng Hợp Tồn Kho Toàn Hệ Thống',
    cols: `
      { header: 'Phân loại', accessorKey: 'category' },
      { header: 'Mã SKU', accessorKey: 'sku', className: 'font-semibold text-blue-600' },
      { header: 'Tên danh mục', accessorKey: 'name' },
      { header: 'Số lượng tồn', accessorKey: 'qty' },
      { header: 'Đơn vị', accessorKey: 'unit' },
      { header: 'Cảnh báo tồn', accessorKey: 'alert', cell: (row: any) => <Badge variant={row.alert === 'safe' ? 'success' : 'warning'}>{row.alert === 'safe' ? 'An toàn' : 'Sắp hết'}</Badge> },
    `,
    data: [
      { id: '1', category: 'Kho Sợi', sku: 'YARN-C30-COMB', name: 'Sợi Cotton Ne 30/1', qty: '12,400', unit: 'kg', alert: 'safe' },
      { id: '2', category: 'Kho Vải Mộc', sku: 'RAW-COT-4C', name: 'Mộc Cotton 4 Chiều 180g', qty: '8,900', unit: 'kg', alert: 'safe' },
      { id: '3', category: 'Hóa chất nhuộm', sku: 'CHEM-DYE-BL', name: 'Thuốc nhuộm Reactive Blue', qty: '45', unit: 'kg', alert: 'low' },
    ],
  },
  {
    key: 'payments',
    label: 'Thu chi & Sổ quỹ',
    shortLabel: 'Tài chính',
    desc: 'Quản lý thu tiền khách hàng và thanh toán nhà cung cấp',
    group: 'system',
    order: 70,
    icon: 'CreditCard',
    title: 'Quản Lý Thu Chi & Tài Chính',
    cols: `
      { header: 'Mã phiếu', accessorKey: 'code', className: 'font-semibold text-blue-600' },
      { header: 'Loại giao dịch', accessorKey: 'type', cell: (row: any) => <Badge variant={row.type === 'income' ? 'success' : 'danger'}>{row.type === 'income' ? 'Thu tiền' : 'Chi tiền'}</Badge> },
      { header: 'Đối tác', accessorKey: 'partner' },
      { header: 'Số tiền', accessorKey: 'amount', cell: (row: any) => <span className="font-semibold">{row.amount.toLocaleString()} ₫</span> },
      { header: 'Phương thức', accessorKey: 'method' },
      { header: 'Ngày GD', accessorKey: 'date' },
    `,
    data: [
      { id: '1', code: 'PT-2026-101', type: 'income', partner: 'May Việt Tiến', amount: 150000000, method: 'Chuyển khoản VCB', date: '28/08/2026' },
      { id: '2', code: 'PC-2026-088', type: 'expense', partner: 'Sợi Nam Định', amount: 84000000, method: 'Chuyển khoản BIDV', date: '27/08/2026' },
    ],
  },
  {
    key: 'recurring-transactions',
    label: 'Giao dịch định kỳ',
    shortLabel: 'Định kỳ',
    desc: 'Thu chi định kỳ tiền điện, thuê xưởng, lương công nhân',
    group: 'system',
    order: 72,
    icon: 'Repeat',
    title: 'Khoản Chi Phí Định Kỳ',
    cols: `
      { header: 'Tên khoản mục', accessorKey: 'name' },
      { header: 'Chu kỳ', accessorKey: 'cycle' },
      { header: 'Số tiền ước tính', accessorKey: 'amount', cell: (row: any) => <span>{row.amount.toLocaleString()} ₫</span> },
      { header: 'Ngày đến hạn', accessorKey: 'due_date' },
    `,
    data: [
      { id: '1', name: 'Tiền điện sản xuất Xưởng Dệt', cycle: 'Hàng tháng', amount: 120000000, due_date: 'Ngày 15' },
      { id: '2', name: 'Thuê mặt bằng nhà xưởng Củ Chi', cycle: 'Hàng tháng', amount: 65000000, due_date: 'Ngày 01' },
    ],
  },
  {
    key: 'reports',
    label: 'Báo cáo & Phân tích (BI)',
    shortLabel: 'Báo cáo',
    desc: 'Báo cáo doanh thu, sản lượng dệt, chi phí và tồn kho',
    group: 'system',
    order: 75,
    icon: 'BarChart2',
    title: 'Báo Cáo Phân Tích Tổng Hợp',
    cols: `
      { header: 'Tên báo cáo', accessorKey: 'title', className: 'font-semibold text-blue-600' },
      { header: 'Kỳ báo cáo', accessorKey: 'period' },
      { header: 'Chỉ số chính', accessorKey: 'kpi' },
      { header: 'Tăng trưởng so cùng kỳ', accessorKey: 'growth', cell: (row: any) => <span className="text-emerald-600 font-bold">+{row.growth}%</span> },
    `,
    data: [
      { id: '1', title: 'Báo cáo Sản lượng Dệt Toàn Nhà Máy', period: 'Tháng 08/2026', kpi: '48.5 tấn', growth: 12.4 },
      { id: '2', title: 'Báo cáo Doanh thu Bán Hàng Dệt May', period: 'Tháng 08/2026', kpi: '3.8 tỷ ₫', growth: 8.7 },
      { id: '3', title: 'Báo cáo Hiệu suất Máy Dệt (OEE)', period: 'Tuần 34', kpi: '87.2%', growth: 3.1 },
    ],
  },
  {
    key: 'shipping-rates',
    label: 'Biểu phí Vận chuyển',
    shortLabel: 'Phí Vận chuyển',
    desc: 'Cài đặt đơn giá cước vận chuyển theo cung đường và tải trọng',
    group: 'system',
    order: 78,
    icon: 'Compass',
    title: 'Biểu Cước Vận Chuyển',
    cols: `
      { header: 'Tuyến đường', accessorKey: 'route' },
      { header: 'Tải trọng xe', accessorKey: 'capacity' },
      { header: 'Đơn giá / Chuyến', accessorKey: 'price', cell: (row: any) => <span>{row.price.toLocaleString()} ₫</span> },
    `,
    data: [
      { id: '1', route: 'Củ Chi -> Tân Bình (Nội thành)', capacity: 'Xe 2.5 Tấn', price: 650000 },
      { id: '2', route: 'Củ Chi -> Bình Dương (KCN VSIP)', capacity: 'Xe 5.0 Tấn', price: 1200000 },
    ],
  },
  {
    key: 'settings',
    label: 'Cài đặt Hệ thống',
    shortLabel: 'Cài đặt',
    desc: 'Cấu hình doanh nghiệp, phân quyền và mẫu in',
    group: 'system',
    order: 90,
    icon: 'Settings',
    title: 'Cài Đặt Hệ Thống Vĩnh Phát ERP',
    cols: `
      { header: 'Mục cấu hình', accessorKey: 'setting_name', className: 'font-semibold' },
      { header: 'Giá trị hiện tại', accessorKey: 'value' },
      { header: 'Cập nhật lần cuối', accessorKey: 'updated' },
    `,
    data: [
      { id: '1', setting_name: 'Tên Công ty', value: 'Công ty CP Dệt May Vĩnh Phát', updated: '20/08/2026' },
      { id: '2', setting_name: 'Đơn vị tiền tệ', value: 'VND (₫)', updated: '20/08/2026' },
      { id: '3', setting_name: 'Chế độ phê duyệt 2 cấp', value: 'Bật (Áp dụng đơn > 100M)', updated: '22/08/2026' },
    ],
  },
  {
    key: 'looms',
    label: 'Quản lý Máy dệt (Looms)',
    shortLabel: 'Máy dệt',
    desc: 'Danh mục máy dệt tròn, máy dệt kim, trạng thái vận hành',
    group: 'master-data',
    order: 80,
    icon: 'Cpu',
    title: 'Danh Mục & Trạng Thái Dàn Máy Dệt',
    cols: `
      { header: 'Mã máy', accessorKey: 'code', className: 'font-semibold text-blue-600' },
      { header: 'Chủng loại', accessorKey: 'type' },
      { header: 'Đường kính / Số kim (Gauge)', accessorKey: 'gauge' },
      { header: 'Tốc độ (Vòng/phút)', accessorKey: 'rpm' },
      { header: 'Trạng thái máy', accessorKey: 'status', cell: (row: any) => <Badge variant={row.status === 'running' ? 'success' : 'warning'}>{row.status === 'running' ? 'Đang chạy' : 'Bảo dưỡng'}</Badge> },
    `,
    data: [
      { id: '1', code: 'MD-01', type: 'Máy Dệt Tròn Single Jersey', gauge: '30 inch / 28G', rpm: 28, status: 'running' },
      { id: '2', code: 'MD-02', type: 'Máy Dệt Tròn Interlock', gauge: '34 inch / 24G', rpm: 24, status: 'running' },
      { id: '3', code: 'MD-03', type: 'Máy Dệt Bo Cổ Rib 1x1', gauge: '18 inch / 14G', rpm: 35, status: 'maintenance' },
    ],
  },
  {
    key: 'media',
    label: 'Thư viện Media & Tài liệu',
    shortLabel: 'Media',
    desc: 'Hình ảnh mẫu vải, tài liệu kỹ thuật và file đính kèm',
    group: 'system',
    order: 85,
    icon: 'Image',
    title: 'Thư Viện Tệp & Tài Liệu',
    cols: `
      { header: 'Tên file', accessorKey: 'name', className: 'font-semibold text-blue-600' },
      { header: 'Định dạng', accessorKey: 'ext' },
      { header: 'Dung lượng', accessorKey: 'size' },
      { header: 'Người tải lên', accessorKey: 'uploader' },
    `,
    data: [
      { id: '1', name: 'Catalogue_Vai_Mua_Thu_2026.pdf', ext: 'PDF', size: '14.2 MB', uploader: 'Nguyễn Thu Trang' },
      { id: '2', name: 'Mau_Vai_Cotton_Combed_Swatches.jpg', ext: 'JPEG', size: '3.8 MB', uploader: 'Vũ Tiến Lực' },
    ],
  },
];

for (const feat of features) {
  const code = createStandardPlugin(
    feat.key,
    feat.label,
    feat.shortLabel,
    feat.desc,
    feat.group,
    feat.order,
    feat.icon,
    feat.title,
    feat.cols,
    feat.data
  );
  writeFileIfMissing('features/' + feat.key + '/index.tsx', code);
}

// ──────────────────────────────────────────────
// Procurement Sub-plugins
// ──────────────────────────────────────────────
writeFileIfMissing('features/procurement/purchase-orders/index.tsx', createStandardPlugin(
  'purchase-orders', 'Đơn Mua Hàng (PO)', 'PO Mua Hàng', 'Quản lý đơn đặt hàng sợi và hóa chất', 'production', 38, 'ShoppingBag', 'Đơn Đặt Mua Hàng',
  `{ header: 'Mã PO', accessorKey: 'code', className: 'font-semibold text-blue-600' }, { header: 'Nhà cung cấp', accessorKey: 'supplier' }, { header: 'Tổng tiền', accessorKey: 'total', cell: (r: any) => <span>{r.total.toLocaleString()} ₫</span> }, { header: 'Trạng thái', accessorKey: 'status', cell: (r: any) => <Badge variant="primary">{r.status}</Badge> }`,
  [{ id: '1', code: 'PO-2026-01', supplier: 'Sợi Nam Định', total: 420000000, status: 'Đã phát hành' }]
));

writeFileIfMissing('features/procurement/purchase-requests/index.tsx', createStandardPlugin(
  'purchase-requests', 'Yêu Cầu Mua Hàng (PR)', 'Yêu Cầu Mua', 'Đề xuất vật tư từ xưởng sản xuất', 'production', 36, 'ClipboardList', 'Yêu Cầu Mua Hàng',
  `{ header: 'Mã PR', accessorKey: 'code', className: 'font-semibold text-blue-600' }, { header: 'Bộ phận đề xuất', accessorKey: 'dept' }, { header: 'Vật tư', accessorKey: 'item' }, { header: 'Trạng thái', accessorKey: 'status', cell: (r: any) => <Badge variant="warning">{r.status}</Badge> }`,
  [{ id: '1', code: 'PR-2026-04', dept: 'Xưởng Dệt Tròn', item: 'Kim Dệt Groz-Beckert 28G', status: 'Chờ duyệt' }]
));

writeFileIfMissing('features/procurement/rfqs/index.tsx', createStandardPlugin(
  'rfqs', 'Chào Giá Nhà Cung Cấp (RFQ)', 'Chào Giá RFQ', 'Gửi yêu cầu báo giá tới nhà cung ứng', 'production', 37, 'HelpCircle', 'Yêu Cầu Báo Giá (RFQ)',
  `{ header: 'Mã RFQ', accessorKey: 'code', className: 'font-semibold text-blue-600' }, { header: 'Mặt hàng cần mua', accessorKey: 'item' }, { header: 'Số lượng NCC phản hồi', accessorKey: 'quotes_received' }`,
  [{ id: '1', code: 'RFQ-2026-08', item: 'Sợi TC 65/35 Ne 30/1', quotes_received: '3 NCC' }]
));

writeFileIfMissing('features/procurement/suppliers/index.tsx', createStandardPlugin(
  'suppliers', 'Nhà Cung Cấp', 'Nhà Cung Cấp', 'Quản lý danh bạ nhà cung cấp sợi và hóa chất', 'master-data', 74, 'Users', 'Danh Bạ Nhà Cung Cấp',
  `{ header: 'Tên nhà cung cấp', accessorKey: 'name', className: 'font-semibold text-blue-600' }, { header: 'Ngành hàng', accessorKey: 'category' }, { header: 'Số điện thoại', accessorKey: 'phone' }, { header: 'Đánh giá', accessorKey: 'rating', cell: () => <span>⭐⭐⭐⭐⭐</span> }`,
  [{ id: '1', name: 'Công ty Cổ phần Sợi Nam Định', category: 'Sợi Dệt', phone: '0228 3849 555' }, { id: '2', name: 'Hóa Chất Dệt Nhuộm Tân Bình', category: 'Hóa chất & Thuốc nhuộm', phone: '028 3812 4567' }]
));

// ──────────────────────────────────────────────
// Specific plugin sub-paths
// ──────────────────────────────────────────────
writeFileIfMissing('features/orders/progress.tsx', `
import React from 'react';
import type { ERPPlugin } from '@/app/types/plugin';

export function OrderProgressPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Theo Dõi Tiến Độ Đơn Hàng</h1>
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
        <p className="text-slate-500">Giao diện biểu đồ tiến độ trực quan theo từng công đoạn: Mua sợi ➔ Dệt mộc ➔ Nhuộm ➔ Cắt may ➔ Giao hàng.</p>
      </div>
    </div>
  );
}

export const orderProgressPlugin: ERPPlugin = {
  key: 'order-progress',
  label: 'Tiến độ Đơn hàng',
  shortLabel: 'Tiến độ',
  description: 'Theo dõi tiến trình từng khâu sản xuất',
  icon: 'Activity',
  group: 'sales',
  order: 22,
  entryPath: '/orders/progress',
  routes: [{ path: '/orders/progress', component: () => Promise.resolve({ default: OrderProgressPage }) }],
};
`);

writeFileIfMissing('features/payments/index.tsx', `
import React from 'react';
import type { ERPPlugin } from '@/app/types/plugin';

export function PaymentsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Quản Lý Sổ Quỹ & Thanh Toán</h1>
      <p className="text-slate-500">Hệ thống thu chi tiền mặt và ngân hàng.</p>
    </div>
  );
}

export function DebtsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Quản Lý Công Nợ Khách Hàng & NCC</h1>
      <p className="text-slate-500">Đối soát công nợ chi tiết.</p>
    </div>
  );
}

export const paymentsPlugin: ERPPlugin = {
  key: 'payments',
  label: 'Sổ quỹ & Thu chi',
  shortLabel: 'Sổ quỹ',
  description: 'Quản lý thu chi',
  icon: 'CreditCard',
  group: 'system',
  order: 70,
  entryPath: '/payments',
  routes: [{ path: '/payments', component: () => Promise.resolve({ default: PaymentsPage }) }],
};

export const debtsPlugin: ERPPlugin = {
  key: 'debts',
  label: 'Quản lý Công nợ',
  shortLabel: 'Công nợ',
  description: 'Theo dõi công nợ',
  icon: 'DollarSign',
  group: 'system',
  order: 71,
  entryPath: '/debts',
  routes: [{ path: '/debts', component: () => Promise.resolve({ default: DebtsPage }) }],
};
`);

writeFileIfMissing('features/yarn-catalog/index.tsx', `
import React from 'react';
import type { ERPPlugin } from '@/app/types/plugin';

export function YarnCatalogPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Danh Mục Sợi Dệt</h1>
      <p className="text-slate-500">Chi số sợi Ne 20/1, 30/1, 40/1, Sợi TC, CVC, Poly, DTY...</p>
    </div>
  );
}

export const yarnCatalogPlugin: ERPPlugin = {
  key: 'yarn-catalog',
  label: 'Danh Mục Sợi',
  shortLabel: 'Sợi',
  description: 'Danh mục nguyên liệu sợi',
  icon: 'Layers',
  group: 'master-data',
  order: 75,
  entryPath: '/yarn-catalog',
  routes: [{ path: '/yarn-catalog', component: () => Promise.resolve({ default: YarnCatalogPage }) }],
};
`);

writeFileIfMissing('features/yarn-catalog/yarn-catalog.constants.ts', `
export const YARN_TYPES = ['Cotton', 'CVC', 'TC', 'Polyester', 'Viscose', 'Spandex'];
`);

writeFileIfMissing('features/guide-system/guide-system.module.ts', `
import React from 'react';
import type { ERPPlugin } from '@/app/types/plugin';

export function GuidePage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Hướng Dẫn Vận Hành Hệ Thống</h1>
      <p className="text-slate-500">Tài liệu quy trình chuẩn (SOP) cho các phòng ban.</p>
    </div>
  );
}

export const guidePlugin: ERPPlugin = {
  key: 'guide-system',
  label: 'Hướng dẫn sử dụng',
  shortLabel: 'Hướng dẫn',
  description: 'Quy trình và tài liệu',
  icon: 'HelpCircle',
  group: 'system',
  order: 95,
  entryPath: '/guide',
  routes: [{ path: '/guide', component: () => Promise.resolve({ default: GuidePage }) }],
};
`);

writeFileIfMissing('features/guide-system/components/ContextualGuide.tsx', `
import React from 'react';
export function ContextualGuide() { return null; }
`);

writeFileIfMissing('features/guide-system/components/GuideCommandPalette.tsx', `
import React from 'react';
export function GuideCommandPalette() { return null; }
`);

writeFileIfMissing('features/guide-system/hooks/useContextualGuide.ts', `
export function useContextualGuide() { return { isGuideOpen: false, openGuide: () => {} }; }
`);

writeFileIfMissing('features/operations/index.tsx', `
import React from 'react';
import type { ERPPlugin } from '@/app/types/plugin';

export function OperationsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Điều Hành Sản Xuất Toàn Nhà Máy</h1>
      <p className="text-slate-500">Bảng điều phối thời gian thực các xưởng dệt, nhuộm, may.</p>
    </div>
  );
}

export const operationsPlugin: ERPPlugin = {
  key: 'operations',
  label: 'Điều Hành Sản Xuất',
  shortLabel: 'Điều hành',
  description: 'Điều phối vận hành xưởng',
  icon: 'Activity',
  group: 'system',
  order: 82,
  entryPath: '/operations',
  routes: [{ path: '/operations', component: () => Promise.resolve({ default: OperationsPage }) }],
};
`);

writeFileIfMissing('features/operations/constants.ts', `
export const OPERATION_STATUSES = ['active', 'paused', 'completed'];
`);

// ──────────────────────────────────────────────
// Fabric Catalog Helpers & Hooks
// ──────────────────────────────────────────────
writeFileIfMissing('features/fabric-catalog/fabric-catalog.constants.ts', `
export const FABRIC_CATEGORIES = ['Cotton', 'Cá sấu', 'Interlock', 'Thun lạnh', 'Bo cổ'];
`);
writeFileIfMissing('features/fabric-catalog/fabric-catalog.helpers.ts', `
export function getFabricDisplayName(f: any) { return f?.name || 'Vải'; }
`);
writeFileIfMissing('features/fabric-catalog/fabric-catalog.utils.ts', `
export function calculateFabricPrice(weight: number, rate: number) { return weight * rate; }
`);
writeFileIfMissing('features/fabric-catalog/hooks/useB2BPlannerLogic.ts', `
export function useB2BPlannerLogic() { return { plan: {}, updatePlan: () => {} }; }
`);
writeFileIfMissing('features/fabric-catalog/hooks/useCTAEngine.ts', `
export function useCTAEngine() { return { triggerCTA: () => {} }; }
`);
writeFileIfMissing('features/fabric-catalog/hooks/useFabricCompare.ts', `
export function useFabricCompare() { return { comparedItems: [], addItem: () => {}, removeItem: () => {} }; }
`);
writeFileIfMissing('features/fabric-catalog/hooks/useFabricDisplayLogic.ts', `
export function useFabricDisplayLogic() { return { displayMode: 'grid', setDisplayMode: () => {} }; }
`);
writeFileIfMissing('features/fabric-catalog/hooks/useFabricGalleryManager.ts', `
export function useFabricGalleryManager() { return { images: [], activeImage: null, setActiveImage: () => {} }; }
`);
writeFileIfMissing('features/fabric-catalog/hooks/useFabricInteractions.ts', `
export function useFabricInteractions() { return { favorites: [], toggleFavorite: () => {} }; }
`);
writeFileIfMissing('features/fabric-catalog/hooks/useFabricReadinessScore.ts', `
export function useFabricReadinessScore() { return { score: 95 }; }
`);
writeFileIfMissing('features/fabric-catalog/hooks/useFabricSeo.ts', `
export function useFabricSeo() { return {}; }
`);
writeFileIfMissing('features/fabric-catalog/hooks/useInquiry.ts', `
export function useInquiry() { return { sendInquiry: async () => true }; }
`);
writeFileIfMissing('features/fabric-catalog/hooks/usePublicViewer.ts', `
export function usePublicViewer() { return { isPublic: false }; }
`);
writeFileIfMissing('features/fabric-catalog/label/mapper.ts', `
export function mapFabricLabel(data: any) { return data; }
`);
writeFileIfMissing('features/fabric-catalog/utils/pdf-generator.ts', `
export async function generateFabricCatalogPdf(fabrics: any[]) { return null; }
`);

// ──────────────────────────────────────────────
// Portal Shared & Supplier Portal
// ──────────────────────────────────────────────
writeFileIfMissing('features/portal-shared/components/PortalLayout.tsx', `
import React, { PropsWithChildren } from 'react';
export function PortalLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 font-bold">
        Cổng Thông Tin Đối Tác Vĩnh Phát ERP
      </header>
      <main className="p-6 max-w-7xl mx-auto">{children}</main>
    </div>
  );
}
`);

writeFileIfMissing('features/supplier-portal/SupplierPortalLayout.tsx', `
import React, { PropsWithChildren } from 'react';
import { PortalLayout } from '@/features/portal-shared/components/PortalLayout';
export function SupplierPortalLayout({ children }: PropsWithChildren) {
  return <PortalLayout>{children}</PortalLayout>;
}
`);

writeFileIfMissing('features/supplier-portal/SupplierDebtPage.tsx', `
import React from 'react';
export function SupplierDebtPage() { return <div className="p-6">Công nợ nhà cung cấp</div>; }
`);
writeFileIfMissing('features/supplier-portal/SupplierInvoicesPage.tsx', `
import React from 'react';
export function SupplierInvoicesPage() { return <div className="p-6">Hóa đơn nhà cung cấp</div>; }
`);
writeFileIfMissing('features/supplier-portal/SupplierPODetailPage.tsx', `
import React from 'react';
export function SupplierPODetailPage() { return <div className="p-6">Chi tiết đơn đặt hàng PO</div>; }
`);
writeFileIfMissing('features/supplier-portal/SupplierPOListPage.tsx', `
import React from 'react';
export function SupplierPOListPage() { return <div className="p-6">Danh sách PO nhà cung cấp</div>; }
`);
writeFileIfMissing('features/supplier-portal/SupplierProfilePage.tsx', `
import React from 'react';
export function SupplierProfilePage() { return <div className="p-6">Hồ sơ nhà cung cấp</div>; }
`);
writeFileIfMissing('features/supplier-portal/SupplierRFQDetailPage.tsx', `
import React from 'react';
export function SupplierRFQDetailPage() { return <div className="p-6">Chi tiết RFQ</div>; }
`);
writeFileIfMissing('features/supplier-portal/SupplierRFQListPage.tsx', `
import React from 'react';
export function SupplierRFQListPage() { return <div className="p-6">Danh sách RFQ</div>; }
`);

writeFileIfMissing('features/notifications/index.tsx', `
import React from 'react';
export function NotificationsPage() { return <div className="p-6">Thông báo hệ thống</div>; }
`);

writeFileIfMissing('features/shipments/shipment-document.ts', `
export function generateShipmentDocument(shipment: any) { return shipment; }
`);

console.log('✅ Scaffolded all missing feature plugins!');
