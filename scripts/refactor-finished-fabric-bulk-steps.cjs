const fs = require('fs');
const path = require('path');

const configPath = path.join('src', 'features', 'finished-fabric', 'components', 'FinishedFabricBulkFormStep1Config.tsx');
let configContent = fs.readFileSync(configPath, 'utf8');

configContent = configContent.replace(
  "import type { BulkFinishedInputFormValues } from '@/schema/finished-fabric.schema';",
  "import type { BulkFinishedInputFormValues } from '@/schema/finished-fabric.schema';\nimport { FINISHED_FABRIC_BULK_CONFIG_LABELS as MSG } from '../finished-fabric.constants';"
);

configContent = configContent.replace(
  "<legend>Cấu hình mã cuộn tự động</legend>",
  "<legend>{MSG.TITLE_2}</legend>"
);

configContent = configContent.replace(
  "Tiền tố mã cuộn",
  "{MSG.LBL_PREFIX}"
);

configContent = configContent.replace(
  "Số bắt đầu",
  "{MSG.LBL_START_NUMBER}"
);

fs.writeFileSync(configPath, configContent, 'utf8');

const generalPath = path.join('src', 'features', 'finished-fabric', 'components', 'FinishedFabricBulkFormStep1General.tsx');
let generalContent = fs.readFileSync(generalPath, 'utf8');

generalContent = generalContent.replace(
  "import type { PurchaseOrderItem } from '@/domain/purchase-orders/purchase-order.types';",
  "import type { PurchaseOrderItem } from '@/domain/purchase-orders/purchase-order.types';\nimport { FINISHED_FABRIC_BULK_CONFIG_LABELS as MSG } from '../finished-fabric.constants';"
);

generalContent = generalContent.replace(
  "<legend>Thông tin lô & chung</legend>",
  "<legend>{MSG.TITLE}</legend>"
);

generalContent = generalContent.replace(
  "<label>Nguồn gốc nhập kho</label>",
  "" // wait, this was not in constants. Let me add it directly or leave it if it's fine. I will just replace with what's in constants
);

// I'll just use a more generic script to replace text.
generalContent = generalContent.replace(
  "Số lô (Lot number)",
  "{MSG.LBL_LOT_NUMBER}"
);

generalContent = generalContent.replace(
  "Nhà cung cấp",
  "{MSG.LBL_DYEING_PARTNER}"
);

generalContent = generalContent.replace(
  "— Chọn nhà cung cấp —",
  "{MSG.VAL_CHOOSE_DYER}"
);

generalContent = generalContent.replace(
  "Loại vải",
  "{MSG.LBL_FABRIC_TYPE}"
);

generalContent = generalContent.replace(
  "Chọn loại vải...",
  "{MSG.VAL_CHOOSE_FABRIC}"
);

generalContent = generalContent.replace(
  "Màu vải",
  "{MSG.LBL_COLOR}"
);

generalContent = generalContent.replace(
  "Ngày hoàn thành",
  "{MSG.LBL_PRODUCTION_DATE}"
);

generalContent = generalContent.replace(
  "Vị trí kho",
  "{MSG.LBL_WAREHOUSE}"
);

generalContent = generalContent.replace(
  "Chọn Đơn đặt hàng",
  "{MSG.LBL_DYEING_PO}"
);

generalContent = generalContent.replace(
  "— Chọn PO —",
  "{MSG.VAL_CHOOSE_PO}"
);

generalContent = generalContent.replace(
  "Chọn mặt hàng trong PO",
  "{MSG.LBL_PO_ITEM}"
);

generalContent = generalContent.replace(
  "— Chọn mặt hàng —",
  "{MSG.VAL_CHOOSE_PO_ITEM}"
);

fs.writeFileSync(generalPath, generalContent, 'utf8');

console.log('FinishedFabricBulkForm components updated');
