const fs = require('fs');

const file = 'src/features/fabric-catalog/FabricVariantForm.tsx';
let c = fs.readFileSync(file, 'utf8');

// Replace the internal const LABELS and const MESSAGES with the import
const labelsStart = c.indexOf('const LABELS = {');
const messagesEnd = c.indexOf('};', c.indexOf('const MESSAGES = {')) + 2;
c = c.substring(0, labelsStart) + "import { PUBLIC_PAGE_LABELS as LABELS } from './fabric-catalog.constants';\n" + c.substring(messagesEnd);

// Replace usages of MESSAGES with LABELS.VARIANT
c = c.replace(/MESSAGES\.PLACEHOLDER_COLOR/g, 'LABELS.VARIANT_PLACEHOLDER_COLOR');
c = c.replace(/MESSAGES\.PLACEHOLDER_HEX/g, 'LABELS.VARIANT_PLACEHOLDER_HEX');
c = c.replace(/MESSAGES\.PLACEHOLDER_WIDTH/g, 'LABELS.VARIANT_PLACEHOLDER_WIDTH');
c = c.replace(/MESSAGES\.PLACEHOLDER_GSM/g, 'LABELS.VARIANT_PLACEHOLDER_GSM');
c = c.replace(/MESSAGES\.PLACEHOLDER_SHRINK_WARP/g, 'LABELS.VARIANT_PLACEHOLDER_SHRINK_WARP');
c = c.replace(/MESSAGES\.PLACEHOLDER_SHRINK_WEFT/g, 'LABELS.VARIANT_PLACEHOLDER_SHRINK_WEFT');
c = c.replace(/MESSAGES\.PLACEHOLDER_LOT/g, 'LABELS.VARIANT_PLACEHOLDER_LOT');
c = c.replace(/MESSAGES\.PLACEHOLDER_SKU/g, 'LABELS.VARIANT_PLACEHOLDER_SKU');
c = c.replace(/MESSAGES\.PLACEHOLDER_BARCODE/g, 'LABELS.VARIANT_PLACEHOLDER_BARCODE');
c = c.replace(/MESSAGES\.PLACEHOLDER_MOQ/g, 'LABELS.VARIANT_PLACEHOLDER_MOQ');
c = c.replace(/MESSAGES\.PLACEHOLDER_PURCHASE/g, 'LABELS.VARIANT_PLACEHOLDER_PURCHASE');
c = c.replace(/MESSAGES\.PLACEHOLDER_SELLING/g, 'LABELS.VARIANT_PLACEHOLDER_SELLING');
c = c.replace(/MESSAGES\.PLACEHOLDER_NOTES/g, 'LABELS.VARIANT_PLACEHOLDER_NOTES');

// Replace usages of LABELS.XXX with LABELS.VARIANT_XXX (where they map)
const fields = ['COLOR_SECTION', 'COLOR_NAME', 'COLOR_HEX', 'SPEC_SECTION', 'ACTUAL_WIDTH', 'ACTUAL_GSM', 'SHRINK_WARP', 'SHRINK_WEFT', 'UOM_SECTION', 'BASE_UOM', 'CONVERSION_RATE', 'SOURCING_SECTION', 'LOT_NUMBER', 'SKU', 'BARCODE', 'MOQ', 'PRICE_SECTION', 'PURCHASE_PRICE', 'SELLING_PRICE', 'STATUS', 'NOTES', 'CANCEL', 'UPDATE', 'ADD', 'EDIT_TITLE', 'ADD_TITLE', 'SAVING_DRAFT', 'SAVED_DRAFT', 'AUTO_CALC', 'ERROR_PREFIX', 'PUBLIC_SECTION', 'PUBLIC_DESC', 'PUBLIC_ON', 'PUBLIC_OFF'];
fields.forEach(key => {
  c = c.replace(new RegExp('LABELS\\.' + key, 'g'), 'LABELS.VARIANT_' + key);
});

// Replace hardcoded strings in validation messages
c = c.replace(/'Mã hex không hợp lệ \\(VD: #000000\\)'/g, 'LABELS.VARIANT_VAL_ERR_HEX');
c = c.replace(/'GSM phải lớn hơn 0'/g, 'LABELS.VARIANT_VAL_ERR_GSM');
c = c.replace(/'Khổ phải lớn hơn 0'/g, 'LABELS.VARIANT_VAL_ERR_WIDTH');
c = c.replace(/'Rút dọc phải từ 0-100%'/g, 'LABELS.VARIANT_VAL_ERR_WARP');
c = c.replace(/'Rút ngang phải từ 0-100%'/g, 'LABELS.VARIANT_VAL_ERR_WEFT');

// Replace hardcoded strings in toasts
c = c.replace(/'Cập nhật thành công'/g, 'LABELS.VARIANT_SUCCESS_UPDATE');
c = c.replace(/'Thêm mới thành công'/g, 'LABELS.VARIANT_SUCCESS_CREATE');

// Replace stepper text
c = c.replace(/'Đang kiểm tra\.\.\.'/g, 'LABELS.VARIANT_STEP_VALIDATING');
c = c.replace(/'Tiếp tục'/g, 'LABELS.VARIANT_STEP_CONTINUE');
c = c.replace(/>\s*Quay lại\s*</g, '>{LABELS.VARIANT_STEP_BACK}<');
c = c.replace(/>\s*Bước {stepper\.currentStep \+ 1} \/ {stepper\.totalSteps}\s*</g, '>{LABELS.VARIANT_STEP_TITLE.replace("{current}", String(stepper.currentStep + 1)).replace("{total}", String(stepper.totalSteps))}<');

// Replace error title string
c = c.replace(/'Lỗi:'/g, 'LABELS.ERROR_PREFIX');

fs.writeFileSync(file, c);
console.log('Done refactoring FabricVariantForm');
