const fs = require('fs');

// B2BPlanner.tsx
let b2bContent = fs.readFileSync('src/features/fabric-catalog/components/B2BPlanner.tsx', 'utf8');
b2bContent = b2bContent.replace(
  "import { PUBLIC_PAGE_LABELS as LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';",
  "import { PUBLIC_PAGE_LABELS as LABELS, PUBLIC_COMPONENT_LABELS as COMP_LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';"
);
b2bContent = b2bContent.replace('Ước tính sản lượng & năng lực cung ứng B2B', '{COMP_LABELS.B2B_PLANNER_DESC}');
b2bContent = b2bContent.replace(
  /<span className="text-sm font-bold text-emerald-700 flex items-center gap-1.5">\s*<Badge showDot variant="success" className="px-0 py-0" \/>\s*Đạt MOQ\s*<\/span>\s*<span className="text-xs text-slate-500 mt-0.5">\s*Tối thiểu \{moq\}kg\s*<\/span>/,
  '<span className="text-sm font-bold text-emerald-700 flex items-center gap-1.5">\\n                    <Badge showDot variant="success" className="px-0 py-0" />\\n                    {COMP_LABELS.B2B_MOQ_MET}\\n                  </span>\\n                  <span className="text-xs text-slate-500 mt-0.5">\\n                    {COMP_LABELS.B2B_MOQ_MIN.replace(\\'{moq}\\', moq.toString())}\\n                  </span>'
);
b2bContent = b2bContent.replace(
  /<span className="text-sm font-bold text-amber-600 flex items-center gap-1.5">\s*<Badge showDot variant="warning" className="px-0 py-0" \/>\s*Chưa đạt MOQ\s*<\/span>\s*<span className="text-xs text-slate-500 mt-0.5">\s*Cần tối thiểu \{moq\}kg\s*<\/span>/,
  '<span className="text-sm font-bold text-amber-600 flex items-center gap-1.5">\\n                    <Badge showDot variant="warning" className="px-0 py-0" />\\n                    {COMP_LABELS.B2B_MOQ_NOT_MET}\\n                  </span>\\n                  <span className="text-xs text-slate-500 mt-0.5">\\n                    {COMP_LABELS.B2B_MOQ_REQ.replace(\\'{moq}\\', moq.toString())}\\n                  </span>'
);
b2bContent = b2bContent.replace(
  /<span className="text-\[10px\] uppercase font-bold text-slate-500 tracking-wider">\s*Năng lực cung ứng\s*<\/span>\s*<div className="flex flex-col">\s*<span className="text-sm font-bold text-slate-800">\s*Giao trong \{leadTime\} ngày\s*<\/span>\s*<span className="text-xs text-slate-500 mt-0.5">\s*Năng lực: \{capacity\} tấn\/tháng\s*<\/span>/,
  '<span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">\\n              {COMP_LABELS.B2B_SUPPLY_CAP}\\n            </span>\\n            <div className="flex flex-col">\\n              <span className="text-sm font-bold text-slate-800">\\n                {COMP_LABELS.B2B_LEAD_TIME.replace(\\'{leadTime}\\', leadTime.toString())}\\n              </span>\\n              <span className="text-xs text-slate-500 mt-0.5">\\n                {COMP_LABELS.B2B_CAPACITY_MONTH.replace(\\'{capacity}\\', capacity.toString())}\\n              </span>'
);
b2bContent = b2bContent.replace(
  /<span className="text-base font-black text-primary">\s*≈ \{lengthMeters\} mét\s*<\/span>/,
  '<span className="text-base font-black text-primary">\\n                    {COMP_LABELS.B2B_EST_LENGTH.replace(\\'{lengthMeters}\\', lengthMeters !== null ? Number(lengthMeters).toFixed(1) : \\'\\')}\\n                  </span>'
);
b2bContent = b2bContent.replace(
  /<div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-100 text-xs font-medium">\s*Không đủ dữ liệu để tính chiều dài vải\.\{ \'\s*\' \}\s*\{!fabric\.target_gsm && \'Thiếu GSM\.\'\}\{ \'\s*\' \}\s*\{!fabric\.target_width_cm && \'Thiếu Khổ vải\.\'\}\s*<\/div>/,
  '<div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-100 text-xs font-medium">\\n                  {COMP_LABELS.B2B_MISSING_DATA}{\\' \\'}\\n                  {!fabric.target_gsm && COMP_LABELS.B2B_MISSING_GSM}{\\' \\'}\\n                  {!fabric.target_width_cm && COMP_LABELS.B2B_MISSING_WIDTH}\\n                </div>'
);
fs.writeFileSync('src/features/fabric-catalog/components/B2BPlanner.tsx', b2bContent, 'utf8');


// FabricHeroGallery.tsx
let heroContent = fs.readFileSync('src/features/fabric-catalog/components/detail/FabricHeroGallery.tsx', 'utf8');
heroContent = heroContent.replace(
  "PUBLIC_PAGE_LABELS as LABELS,",
  "PUBLIC_PAGE_LABELS as LABELS,\\n  PUBLIC_COMPONENT_LABELS as COMP_LABELS,"
);
heroContent = heroContent.replace(
  "`Màu ${activeColorName} - ${fabric.name}`",
  "COMP_LABELS.HERO_COLOR_NAME.replace('{color}', activeColorName).replace('{name}', fabric.name ?? '')"
);
heroContent = heroContent.replace(
  "Lượt xem: {fabric.view_count ?? 0}",
  "{COMP_LABELS.HERO_VIEWS.replace('{count}', (fabric.view_count ?? 0).toString())}"
);
fs.writeFileSync('src/features/fabric-catalog/components/detail/FabricHeroGallery.tsx', heroContent, 'utf8');


// FabricPricingTable.tsx
let ptContent = fs.readFileSync('src/features/fabric-catalog/components/detail/FabricPricingTable.tsx', 'utf8');
ptContent = ptContent.replace(
  "PUBLIC_PAGE_LABELS as LABELS,",
  "PUBLIC_PAGE_LABELS as LABELS,\\n  PUBLIC_COMPONENT_LABELS as COMP_LABELS,"
);
ptContent = ptContent.replace(
  "suffix={tier.currency === 'USD' ? ' USD' : ' đ'}",
  "suffix={tier.currency === 'USD' ? ' USD' : ` ${COMP_LABELS.CURRENCY_VND}`}"
);
fs.writeFileSync('src/features/fabric-catalog/components/detail/FabricPricingTable.tsx', ptContent, 'utf8');


// FabricSpecsList.tsx
let slContent = fs.readFileSync('src/features/fabric-catalog/components/detail/FabricSpecsList.tsx', 'utf8');
slContent = slContent.replace(
  "import { PUBLIC_PAGE_LABELS as LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';",
  "import { PUBLIC_PAGE_LABELS as LABELS, PUBLIC_COMPONENT_LABELS as COMP_LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';"
);
slContent = slContent.replace(
  "Trạng thái kho ({activeVariant.color_name})",
  "{COMP_LABELS.INVENTORY_STATUS_TITLE.replace('{color}', activeVariant.color_name)}"
);
slContent = slContent.replace("? 'Sẵn có'", "? COMP_LABELS.IN_STOCK");
slContent = slContent.replace(": 'Hết hàng'", ": COMP_LABELS.OUT_OF_STOCK");
fs.writeFileSync('src/features/fabric-catalog/components/detail/FabricSpecsList.tsx', slContent, 'utf8');


// FabricReadinessScore.tsx
let rsContent = fs.readFileSync('src/features/fabric-catalog/components/FabricReadinessScore.tsx', 'utf8');
rsContent = rsContent.replace(
  "import { LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';",
  "import { LABELS, PUBLIC_COMPONENT_LABELS as COMP_LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';"
);
rsContent = rsContent.replace(
  "Hoàn thiện: {passedCount}/{totalCount} tiêu chí",
  "{COMP_LABELS.READINESS_SCORE.replace('{passedCount}', passedCount.toString()).replace('{totalCount}', totalCount.toString())}"
);
fs.writeFileSync('src/features/fabric-catalog/components/FabricReadinessScore.tsx', rsContent, 'utf8');


// FabricSampleQRModal.tsx
let qrContent = fs.readFileSync('src/features/fabric-catalog/components/FabricSampleQRModal.tsx', 'utf8');
qrContent = qrContent.replace(
  "import { QRPreview } from '@/shared/components/QRPreview';",
  "import { QRPreview } from '@/shared/components/QRPreview';\\nimport { PUBLIC_COMPONENT_LABELS as COMP_LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';"
);
qrContent = qrContent.replace("title: 'In Tem Mẫu Vải',", "title: COMP_LABELS.QR_MODAL_TITLE,");
qrContent = qrContent.replace("download: 'Tải Ảnh',", "download: COMP_LABELS.QR_MODAL_DOWNLOAD,");
qrContent = qrContent.replace("close: 'Đóng',", "close: COMP_LABELS.QR_MODAL_CLOSE,");
qrContent = qrContent.replace("printTitlePrefix: 'Tem Mẫu - ',", "printTitlePrefix: COMP_LABELS.QR_MODAL_PRINT_PREFIX,");
qrContent = qrContent.replace("downloadError: 'Lỗi khi tải ảnh tem mẫu.',", "downloadError: COMP_LABELS.QR_MODAL_DOWNLOAD_ERR,");
qrContent = qrContent.replace(
  "⚠️ Mẫu vải này <b>chưa được bật Công khai</b>. Khách hàng quét mã QR\\n              sẽ không xem được.",
  "<span dangerouslySetInnerHTML={{ __html: COMP_LABELS.QR_MODAL_NOT_PUBLIC }} />"
);
fs.writeFileSync('src/features/fabric-catalog/components/FabricSampleQRModal.tsx', qrContent, 'utf8');


// FabricPublicCustomerSection.tsx
let custContent = fs.readFileSync('src/features/fabric-catalog/components/public-tab-sections/FabricPublicCustomerSection.tsx', 'utf8');
custContent = custContent.replace(
  "import { LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';",
  "import { PUBLIC_TAB_LABELS as TAB_LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';"
);
custContent = custContent.replace("Trải nghiệm khách hàng", "{TAB_LABELS.CUSTOMER_EXP}");
fs.writeFileSync('src/features/fabric-catalog/components/public-tab-sections/FabricPublicCustomerSection.tsx', custContent, 'utf8');


// FabricPublicPreview.tsx
let prevContent = fs.readFileSync('src/features/fabric-catalog/components/public-tab-sections/FabricPublicPreview.tsx', 'utf8');
prevContent = prevContent.replace(
  "import { LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';",
  "import { PUBLIC_TAB_LABELS as TAB_LABELS, PUBLIC_COMPONENT_LABELS as COMP_LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';"
);
prevContent = prevContent.replace(/LABELS\./g, 'TAB_LABELS.');
prevContent = prevContent.replace(
  /suffix=\{`đ\/\$\{unit\}`\}/g,
  "suffix={` ${COMP_LABELS.CURRENCY_VND}/${unit}`}"
);
prevContent = prevContent.replace(
  "&& `${stockQty} ${unit} có sẵn`",
  "&& TAB_LABELS.STOCK_QTY_AVAILABLE.replace('{stockQty}', stockQty.toString()).replace('{unit}', unit)"
);
fs.writeFileSync('src/features/fabric-catalog/components/public-tab-sections/FabricPublicPreview.tsx', prevContent, 'utf8');


// FabricPublicPricingSection.tsx
let priceContent = fs.readFileSync('src/features/fabric-catalog/components/public-tab-sections/FabricPublicPricingSection.tsx', 'utf8');
priceContent = priceContent.replace(
  "import { LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';",
  "import { PUBLIC_TAB_LABELS as TAB_LABELS, PUBLIC_COMPONENT_LABELS as COMP_LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';"
);
priceContent = priceContent.replace(/LABELS\./g, 'TAB_LABELS.');
priceContent = priceContent.replace(
  /suffix=\{`đ\/\$\{unit\}`\}/g,
  "suffix={` ${COMP_LABELS.CURRENCY_VND}/${unit}`}"
);
priceContent = priceContent.replace("Ưu tiên", "{TAB_LABELS.PRIORITY}");
priceContent = priceContent.replace("Nhóm áp dụng", "{TAB_LABELS.TARGET_GROUPS}");
priceContent = priceContent.replace("'Tất cả (Chung)'", "TAB_LABELS.ALL_GENERAL");
priceContent = priceContent.replace("Chọn nhóm khách hàng", "{TAB_LABELS.CHOOSE_CUST_GROUP}");
priceContent = priceContent.replace("Xóa tất cả (Chung)", "{TAB_LABELS.CLEAR_ALL}");
fs.writeFileSync('src/features/fabric-catalog/components/public-tab-sections/FabricPublicPricingSection.tsx', priceContent, 'utf8');


// FabricPublicStatusSection.tsx
let statusContent = fs.readFileSync('src/features/fabric-catalog/components/public-tab-sections/FabricPublicStatusSection.tsx', 'utf8');
statusContent = statusContent.replace(
  "import { LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';",
  "import { PUBLIC_TAB_LABELS as TAB_LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';"
);
statusContent = statusContent.replace("Cập nhật lần cuối", "{TAB_LABELS.LAST_UPDATED}");
fs.writeFileSync('src/features/fabric-catalog/components/public-tab-sections/FabricPublicStatusSection.tsx', statusContent, 'utf8');

