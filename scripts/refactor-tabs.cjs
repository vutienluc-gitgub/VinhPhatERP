const fs = require('fs');

const constantsFile = 'src/features/fabric-catalog/fabric-catalog.constants.ts';
let constantsContent = fs.readFileSync(constantsFile, 'utf8');

const appendText = `
export const PUBLIC_TAB_LABELS = {
  CUSTOMER_EXP: 'Trải nghiệm khách hàng',
  STOCK_QTY_AVAILABLE: '{stockQty} {unit} có sẵn',
  PRIORITY: 'Ưu tiên',
  TARGET_GROUPS: 'Nhóm áp dụng',
  ALL_GENERAL: 'Tất cả (Chung)',
  CHOOSE_CUST_GROUP: 'Chọn nhóm khách hàng',
  CLEAR_ALL: 'Xóa tất cả (Chung)',
  LAST_UPDATED: 'Cập nhật lần cuối',
};
`;

if (!constantsContent.includes('PUBLIC_TAB_LABELS')) {
  constantsContent = constantsContent + appendText;
  fs.writeFileSync(constantsFile, constantsContent, 'utf8');
}

// FabricPublicCustomerSection.tsx
const customerFile = 'src/features/fabric-catalog/components/public-tab-sections/FabricPublicCustomerSection.tsx';
let customerContent = fs.readFileSync(customerFile, 'utf8');
if (!customerContent.includes('PUBLIC_TAB_LABELS')) {
  customerContent = customerContent.replace(
    "import { FabricCatalogFormValues } from '@/schema/fabric-catalog.schema';",
    "import { FabricCatalogFormValues } from '@/schema/fabric-catalog.schema';\nimport { PUBLIC_TAB_LABELS as LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';"
  );
  customerContent = customerContent.replace('Trải nghiệm khách hàng', '{LABELS.CUSTOMER_EXP}');
  fs.writeFileSync(customerFile, customerContent, 'utf8');
}

// FabricPublicPreview.tsx
const previewFile = 'src/features/fabric-catalog/components/public-tab-sections/FabricPublicPreview.tsx';
let previewContent = fs.readFileSync(previewFile, 'utf8');
if (!previewContent.includes('PUBLIC_TAB_LABELS')) {
  previewContent = previewContent.replace(
    "import { MoneyText } from '@/shared/value';",
    "import { MoneyText } from '@/shared/value';\nimport { PUBLIC_TAB_LABELS as LABELS, PUBLIC_COMPONENT_LABELS as COMP_LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';"
  );
  previewContent = previewContent.replace(
    /suffix=\{`đ\/\$\{unit\}`\}/g,
    "suffix={`\\${COMP_LABELS.CURRENCY_VND}/\\${unit}`}"
  );
  previewContent = previewContent.replace(
    "&& `${stockQty} ${unit} có sẵn`}",
    "&& LABELS.STOCK_QTY_AVAILABLE.replace('{stockQty}', stockQty.toString()).replace('{unit}', unit)}"
  );
  fs.writeFileSync(previewFile, previewContent, 'utf8');
}

// FabricPublicPricingSection.tsx
const pricingFile = 'src/features/fabric-catalog/components/public-tab-sections/FabricPublicPricingSection.tsx';
let pricingContent = fs.readFileSync(pricingFile, 'utf8');
if (!pricingContent.includes('PUBLIC_TAB_LABELS')) {
  pricingContent = pricingContent.replace(
    "import { Button, Icon } from '@/shared/components';",
    "import { Button, Icon } from '@/shared/components';\nimport { PUBLIC_TAB_LABELS as LABELS, PUBLIC_COMPONENT_LABELS as COMP_LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';"
  );
  pricingContent = pricingContent.replace(
    /suffix=\{`đ\/\$\{unit\}`\}/g,
    "suffix={`\\${COMP_LABELS.CURRENCY_VND}/\\${unit}`}"
  );
  pricingContent = pricingContent.replace('<th className="p-3 w-24 text-center">Ưu tiên</th>', '<th className="p-3 w-24 text-center">{LABELS.PRIORITY}</th>');
  pricingContent = pricingContent.replace('<th className="p-3 w-52">Nhóm áp dụng</th>', '<th className="p-3 w-52">{LABELS.TARGET_GROUPS}</th>');
  pricingContent = pricingContent.replace("'Tất cả (Chung)'", "LABELS.ALL_GENERAL");
  pricingContent = pricingContent.replace('Chọn nhóm khách hàng', '{LABELS.CHOOSE_CUST_GROUP}');
  pricingContent = pricingContent.replace('Xóa tất cả (Chung)', '{LABELS.CLEAR_ALL}');
  fs.writeFileSync(pricingFile, pricingContent, 'utf8');
}

// FabricPublicStatusSection.tsx
const statusFile = 'src/features/fabric-catalog/components/public-tab-sections/FabricPublicStatusSection.tsx';
let statusContent = fs.readFileSync(statusFile, 'utf8');
if (!statusContent.includes('PUBLIC_TAB_LABELS')) {
  statusContent = statusContent.replace(
    "import { FabricCatalogFormValues } from '@/schema/fabric-catalog.schema';",
    "import { FabricCatalogFormValues } from '@/schema/fabric-catalog.schema';\nimport { PUBLIC_TAB_LABELS as LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';"
  );
  statusContent = statusContent.replace('Cập nhật lần cuối', '{LABELS.LAST_UPDATED}');
  fs.writeFileSync(statusFile, statusContent, 'utf8');
}
