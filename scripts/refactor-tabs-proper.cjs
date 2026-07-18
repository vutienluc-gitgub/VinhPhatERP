const fs = require('fs');

// 1. FabricPublicPreview.tsx
let f1 = 'src/features/fabric-catalog/components/public-tab-sections/FabricPublicPreview.tsx';
let c1 = fs.readFileSync(f1, 'utf8');
c1 = c1.replace(
  "import { LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';",
  "import { LABELS, PUBLIC_TAB_LABELS as TAB_LABELS, PUBLIC_COMPONENT_LABELS as COMP_LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';"
);
c1 = c1.replace(
  "suffix={`đ/${unit}`}",
  "suffix={` ${COMP_LABELS.CURRENCY_VND}/${unit}`}"
);
c1 = c1.replace(
  "&& `${stockQty} ${unit} có sẵn`",
  "&& TAB_LABELS.STOCK_QTY_AVAILABLE.replace('{stockQty}', stockQty.toString()).replace('{unit}', unit)"
);
fs.writeFileSync(f1, c1, 'utf8');


// 2. FabricPublicPricingSection.tsx
let f2 = 'src/features/fabric-catalog/components/public-tab-sections/FabricPublicPricingSection.tsx';
let c2 = fs.readFileSync(f2, 'utf8');
c2 = c2.replace(
  "import { LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';",
  "import { LABELS, PUBLIC_TAB_LABELS as TAB_LABELS, PUBLIC_COMPONENT_LABELS as COMP_LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';"
);
c2 = c2.replace(
  "suffix={`đ/${unit}`}",
  "suffix={` ${COMP_LABELS.CURRENCY_VND}/${unit}`}"
);
c2 = c2.replace(">Ưu tiên</th>", ">{TAB_LABELS.PRIORITY}</th>");
c2 = c2.replace(">Nhóm áp dụng</th>", ">{TAB_LABELS.TARGET_GROUPS}</th>");
c2 = c2.replace("'Tất cả (Chung)'", "TAB_LABELS.ALL_GENERAL");
c2 = c2.replace(">\\n              Chọn nhóm khách hàng", ">\\n              {TAB_LABELS.CHOOSE_CUST_GROUP}");
c2 = c2.replace(">\\n                Xóa tất cả (Chung)", ">\\n                {TAB_LABELS.CLEAR_ALL}");
fs.writeFileSync(f2, c2, 'utf8');


// 3. FabricPublicStatusSection.tsx
let f3 = 'src/features/fabric-catalog/components/public-tab-sections/FabricPublicStatusSection.tsx';
let c3 = fs.readFileSync(f3, 'utf8');
c3 = c3.replace(
  "import { LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';",
  "import { LABELS, PUBLIC_TAB_LABELS as TAB_LABELS, PUBLIC_COMPONENT_LABELS as COMP_LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';"
);
c3 = c3.replace(
  "Khách hàng có thể quét QR và xem thông tin trực tuyến",
  "{COMP_LABELS.PUBLIC_DESC}"
);
c3 = c3.replace(
  "Công khai cho khách hàng",
  "{COMP_LABELS.PUBLIC_TITLE}"
);
c3 = c3.replace(
  "Xem trang công khai",
  "{COMP_LABELS.VIEW_PUBLIC_PAGE}"
);
c3 = c3.replace(
  "Cập nhật lần cuối",
  "{TAB_LABELS.LAST_UPDATED}"
);
fs.writeFileSync(f3, c3, 'utf8');
