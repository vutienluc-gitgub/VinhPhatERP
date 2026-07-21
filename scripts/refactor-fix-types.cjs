const fs = require('fs');
const path = require('path');

// 1. FinishedFabricList.tsx
const listPath = path.join('src', 'features', 'finished-fabric', 'FinishedFabricList.tsx');
let listContent = fs.readFileSync(listPath, 'utf8');
listContent = listContent.replace(
  "message: LIST_MSG.CONFIRM_DELETE_MSG(roll.roll_number),",
  "message: LIST_MSG.CONFIRM_DELETE_MSG.replace('{num}', roll.roll_number),"
);
fs.writeFileSync(listPath, listContent, 'utf8');

// 2. FinishedFabricBulkFormStep1Config.tsx
const bulkConfigPath = path.join('src', 'features', 'finished-fabric', 'components', 'FinishedFabricBulkFormStep1Config.tsx');
let bulkConfigContent = fs.readFileSync(bulkConfigPath, 'utf8');
bulkConfigContent = bulkConfigContent.replace(
  "import { FINISHED_FABRIC_BULK_CONFIG_LABELS as MSG } from '../finished-fabric.constants';",
  "import { FINISHED_FABRIC_BULK_CONFIG_LABELS as MSG } from '@/features/finished-fabric/finished-fabric.constants';"
);
fs.writeFileSync(bulkConfigPath, bulkConfigContent, 'utf8');

// 3. FinishedFabricBulkFormStep1General.tsx
const bulkGenPath = path.join('src', 'features', 'finished-fabric', 'components', 'FinishedFabricBulkFormStep1General.tsx');
let bulkGenContent = fs.readFileSync(bulkGenPath, 'utf8');
bulkGenContent = bulkGenContent.replace(
  "import { FINISHED_FABRIC_BULK_CONFIG_LABELS as MSG } from '../finished-fabric.constants';",
  "import { FINISHED_FABRIC_BULK_CONFIG_LABELS as MSG } from '@/features/finished-fabric/finished-fabric.constants';"
);
fs.writeFileSync(bulkGenPath, bulkGenContent, 'utf8');

// 4. Form steps
const step1Path = path.join('src', 'features', 'finished-fabric', 'components', 'FinishedFabricFormStep1General.tsx');
if (fs.existsSync(step1Path)) {
  let step1Content = fs.readFileSync(step1Path, 'utf8');
  step1Content = step1Content.replace(
    "import { FINISHED_FABRIC_MESSAGES as MSG } from '../finished-fabric.constants';",
    "import { FINISHED_FABRIC_FORM_LABELS as MSG } from '@/features/finished-fabric/finished-fabric.constants';"
  );
  step1Content = step1Content.replace(
    "import { FINISHED_FABRIC_MESSAGES as MSG } from '@/features/finished-fabric/finished-fabric.constants';",
    "import { FINISHED_FABRIC_FORM_LABELS as MSG } from '@/features/finished-fabric/finished-fabric.constants';"
  );
  
  // also strings inside step1
  step1Content = step1Content.replace(">Số lô (Lot number)<", ">{MSG.LBL_LOT_NUMBER}<");
  step1Content = step1Content.replace("Tự động tạo từ Cuộn mộc + Nhà nhuộm + Ngày hoàn thành.", "{MSG.LBL_LOT_AUTO_HINT}");
  step1Content = step1Content.replace("Nhóm các cuộn cùng lô sản xuất.", "{MSG.LBL_LOT_MANUAL_HINT}");
  step1Content = step1Content.replace(">Mã cuộn<", ">{MSG.LBL_ROLL_NUMBER}<");
  step1Content = step1Content.replace(">Cuộn mộc gốc (Tùy chọn)<", ">{MSG.LBL_RAW_ROLL}<");
  step1Content = step1Content.replace("Nếu cuộn này được nhuộm từ một cuộn mộc có sẵn, chọn mã mộc gốc để truy vết.", "{MSG.HINT_RAW_ROLL}");
  step1Content = step1Content.replace(">Nhà nhuộm<", ">{MSG.LBL_DYEING_PARTNER}<");
  step1Content = step1Content.replace("— Chọn nhà nhuộm —", "{MSG.VAL_CHOOSE_DYER}");
  step1Content = step1Content.replace("+ Tạo đối tác mới", "{MSG.BTN_NEW_PARTNER}");
  step1Content = step1Content.replace("— Tìm mã mộc —", "{MSG.VAL_CHOOSE_RAW}");
  step1Content = step1Content.replace(">Loại vải<", ">{MSG.LBL_FABRIC_TYPE}<");
  
  fs.writeFileSync(step1Path, step1Content, 'utf8');
}

const step2Path = path.join('src', 'features', 'finished-fabric', 'components', 'FinishedFabricFormStep2Specs.tsx');
if (fs.existsSync(step2Path)) {
  let step2Content = fs.readFileSync(step2Path, 'utf8');
  step2Content = step2Content.replace(
    "import { FINISHED_FABRIC_MESSAGES as MSG } from '../finished-fabric.constants';",
    "import { FINISHED_FABRIC_FORM_LABELS as MSG } from '@/features/finished-fabric/finished-fabric.constants';"
  );
  step2Content = step2Content.replace(
    "import { FINISHED_FABRIC_MESSAGES as MSG } from '@/features/finished-fabric/finished-fabric.constants';",
    "import { FINISHED_FABRIC_FORM_LABELS as MSG } from '@/features/finished-fabric/finished-fabric.constants';"
  );
  
  // also strings inside step2
  step2Content = step2Content.replace(">Màu vải<", ">{MSG.LBL_COLOR_NAME}<");
  step2Content = step2Content.replace("Chọn hoặc nhập màu...", "{MSG.PLACEHOLDER_COLOR}");
  step2Content = step2Content.replace(">Mã màu<", ">{MSG.LBL_COLOR_CODE}<");
  step2Content = step2Content.replace(">Khổ vải (cm)<", ">{MSG.LBL_WIDTH_CM}<");
  step2Content = step2Content.replace(">Độ dài (m)<", ">{MSG.LBL_LENGTH_M}<");
  step2Content = step2Content.replace(">Trọng lượng (kg)<", ">{MSG.LBL_WEIGHT_KG}<");
  
  fs.writeFileSync(step2Path, step2Content, 'utf8');
}

const step3Path = path.join('src', 'features', 'finished-fabric', 'components', 'FinishedFabricFormStep3Storage.tsx');
if (fs.existsSync(step3Path)) {
  let step3Content = fs.readFileSync(step3Path, 'utf8');
  step3Content = step3Content.replace(
    "import { FINISHED_FABRIC_MESSAGES as MSG } from '../finished-fabric.constants';",
    "import { FINISHED_FABRIC_FORM_LABELS as MSG } from '@/features/finished-fabric/finished-fabric.constants';"
  );
  step3Content = step3Content.replace(
    "import { FINISHED_FABRIC_MESSAGES as MSG } from '@/features/finished-fabric/finished-fabric.constants';",
    "import { FINISHED_FABRIC_FORM_LABELS as MSG } from '@/features/finished-fabric/finished-fabric.constants';"
  );
  
  // also strings inside step3
  step3Content = step3Content.replace(">Chất lượng<", ">{MSG.LBL_QUALITY_GRADE}<");
  step3Content = step3Content.replace(">Trạng thái<", ">{MSG.LBL_STATUS}<");
  step3Content = step3Content.replace(">Ngày hoàn thành<", ">{MSG.LBL_PRODUCTION_DATE}<");
  step3Content = step3Content.replace(">Vị trí kho<", ">{MSG.LBL_WAREHOUSE_LOCATION}<");
  step3Content = step3Content.replace(">Ghi chú<", ">{MSG.LBL_NOTES}<");

  fs.writeFileSync(step3Path, step3Content, 'utf8');
}

console.log('Fixed type errors and lint errors in forms and lists');
