import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';
import { FeatureRegistry } from '@/shared/lib/FeatureRegistry';
import { customersPlugin } from '@/features/customers';
import { quotationsPlugin } from '@/features/quotations';
import { ordersPlugin } from '@/features/orders';
import { orderProgressPlugin } from '@/features/orders/progress';
import { orderKanbanPlugin } from '@/features/order-kanban';
import { shipmentsPlugin } from '@/features/shipments';
import { yarnReceiptsPlugin } from '@/features/yarn-receipts';
import { bomPlugin } from '@/features/bom';
import { workOrdersPlugin } from '@/features/work-orders';
import { rawFabricPlugin } from '@/features/raw-fabric';
import { weavingInvoicesPlugin } from '@/features/weaving-invoices';
import { finishedFabricPlugin } from '@/features/finished-fabric';
import { suppliersPlugin } from '@/features/suppliers';
import { yarnCatalogPlugin } from '@/features/yarn-catalog';
import { fabricCatalogPlugin } from '@/features/fabric-catalog';
import { inventoryPlugin } from '@/features/inventory';
import { paymentsPlugin, debtsPlugin } from '@/features/payments';
import { reportsPlugin } from '@/features/reports';
import { shippingRatesPlugin } from '@/features/shipping-rates';
import { settingsPlugin } from '@/features/settings';
import { dyeingOrdersPlugin } from '@/features/dyeing-orders';
import { employeesPlugin } from '@/features/employees/employees.module';
import { contractTemplatesPlugin } from '@/features/contract-templates';
import { contractsPlugin } from '@/features/contracts';

/**
 * Plugin Registry — Đăng ký tất cả features vào hệ thống.
 *
 * Để bật/tắt một feature, chỉ cần comment hoặc xóa dòng tương ứng.
 * Không cần chỉnh sửa routes.tsx hay Sidebar.
 *
 * Thứ tự plugins = thứ tự hiển thị trên menu (dùng field `order`).
 */

const plugins: FeaturePlugin[] = [
  // ── SALES ──
  quotationsPlugin,
  ordersPlugin,
  contractsPlugin,
  orderProgressPlugin,
  orderKanbanPlugin,
  customersPlugin,
  shipmentsPlugin,

  // ── PRODUCTION ──
  yarnReceiptsPlugin,
  bomPlugin,
  workOrdersPlugin,
  rawFabricPlugin,
  weavingInvoicesPlugin,
  finishedFabricPlugin,
  dyeingOrdersPlugin,

  // ── MASTER DATA ──
  suppliersPlugin,
  yarnCatalogPlugin,
  fabricCatalogPlugin,
  inventoryPlugin,

  // ── SYSTEM ──
  paymentsPlugin,
  debtsPlugin,
  reportsPlugin,
  shippingRatesPlugin,
  settingsPlugin,
  employeesPlugin,
  contractTemplatesPlugin,
];

// Register all plugins
FeatureRegistry.registerAll(plugins);

export { FeatureRegistry };
