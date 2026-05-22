const fs = require('fs');
const path = require('path');

function replaceStrings() {
  const poCreatePath = path.join(process.cwd(), 'src/features/purchase-orders/POCreatePage.tsx');
  let content = fs.readFileSync(poCreatePath, 'utf8');

  // Add imports
  if (!content.includes('PO_CONSTANTS')) {
    content = content.replace("import { useYarnCatalogOptions } from '@/shared/hooks/useYarnCatalogOptions';", 
      "import { useYarnCatalogOptions } from '@/shared/hooks/useYarnCatalogOptions';\nimport { PO_CONSTANTS } from './purchase-orders.constants';\nimport { usePOCalculations } from './usePOCalculations';");
  }

  // Replace subtotal calculations
  content = content.replace(/const subtotal = useMemo\(\(\) => \{[\s\S]*?\}, \[watchItems\]\);\s*const vatAmount = \(subtotal \* watchVatRate\) \/ 100;\s*const totalAmount = subtotal \+ vatAmount \+ Number\(watchShippingFee\);/, 
    "const { subtotal, vatAmount, totalAmount } = usePOCalculations(watchItems, watchVatRate, watchShippingFee);");

  // Replace strings
  const replacements = {
    "'Tạo Đơn Đặt Hàng'": "PO_CONSTANTS.CREATE_PAGE_TITLE",
    "Tạo Đơn Đặt Hàng": "{PO_CONSTANTS.CREATE_PAGE_TITLE}",
    "Thông tin chung": "{PO_CONSTANTS.SECTION_GENERAL}",
    "Danh sách nguyên liệu": "{PO_CONSTANTS.SECTION_ITEMS}",
    "Tổng thanh toán": "{PO_CONSTANTS.SECTION_PAYMENT}",
    "Nhà cung cấp": "{PO_CONSTANTS.LABEL_SUPPLIER}",
    "Người phụ trách": "{PO_CONSTANTS.LABEL_PIC}",
    "Điều khoản thanh toán": "{PO_CONSTANTS.LABEL_PAYMENT_TERMS}",
    "Ngày đặt hàng": "{PO_CONSTANTS.LABEL_ORDER_DATE}",
    "Loại tiền": "{PO_CONSTANTS.LABEL_CURRENCY}",
    "Hạn thanh toán": "{PO_CONSTANTS.LABEL_PAYMENT_DEADLINE}",
    "Điều khoản VAT": "{PO_CONSTANTS.LABEL_VAT_TERMS}",
    "Giao hàng (Incoterms)": "{PO_CONSTANTS.LABEL_INCOTERMS}",
    "Mức độ ưu tiên": "{PO_CONSTANTS.LABEL_PRIORITY}",
    "Tài liệu đính kèm (Kéo thả hoặc click)": "{PO_CONSTANTS.LABEL_ATTACHMENTS}",
    "+ Thêm dòng": "{PO_CONSTANTS.BTN_ADD_ROW}",
    "Import Excel": "{PO_CONSTANTS.BTN_IMPORT_EXCEL}",
    "Copy BOM": "{PO_CONSTANTS.BTN_COPY_BOM}",
    "Mẹo: Sử dụng phím <strong>Tab</strong> hoặc <strong>Enter</strong> để chuyển nhanh giữa các ô.": "{PO_CONSTANTS.TIP_KEYBOARD_NAV}",
    "Tiền hàng (Subtotal)": "{PO_CONSTANTS.SUBTOTAL}",
    "Thuế VAT (%)": "{PO_CONSTANTS.VAT_RATE}",
    "Chi phí vận chuyển": "{PO_CONSTANTS.SHIPPING_FEE}",
    "Tổng cộng": "{PO_CONSTANTS.GRAND_TOTAL}",
    "Xác nhận Tạo PO": "{PO_CONSTANTS.BTN_CONFIRM_CREATE}",
    "'Chọn nhà cung cấp...'": "PO_CONSTANTS.SELECT_SUPPLIER",
    "Có lỗi xảy ra khi tạo PO: ": "{PO_CONSTANTS.ERR_CREATE_FAILED}"
  };

  for (const [key, value] of Object.entries(replacements)) {
    if (key.includes("Mẹo")) {
      content = content.replace(/<span>Mẹo: Sử dụng phím <strong>Tab<\/strong> hoặc <strong>Enter<\/strong> để chuyển nhanh giữa các ô.<\/span>/g, `<span>{PO_CONSTANTS.TIP_KEYBOARD_NAV}</span>`);
    } else {
      content = content.split(key).join(value);
    }
  }

  // Fix up title tags that might be wrong
  content = content.replace(/title="\{PO_CONSTANTS.LABEL_SUPPLIER\}"/g, 'title={PO_CONSTANTS.LABEL_SUPPLIER}');
  content = content.replace(/title="\{PO_CONSTANTS.LABEL_PIC\}"/g, 'title={PO_CONSTANTS.LABEL_PIC}');
  content = content.replace(/'Có lỗi xảy ra khi tạo PO: '/g, 'PO_CONSTANTS.ERR_CREATE_FAILED');

  fs.writeFileSync(poCreatePath, content, 'utf8');

  // Do the same for POListTable
  const poListPath = path.join(process.cwd(), 'src/features/purchase-orders/POListTable.tsx');
  let listContent = fs.readFileSync(poListPath, 'utf8');

  if (!listContent.includes('PO_CONSTANTS')) {
    listContent = listContent.replace("import dayjs from 'dayjs';", "import dayjs from 'dayjs';\nimport { PO_CONSTANTS } from './purchase-orders.constants';");
  }

  const listReplacements = {
    "'Mã PO'": "PO_CONSTANTS.COL_PO_CODE",
    "'Ngày đặt'": "PO_CONSTANTS.COL_ORDER_DATE",
    "'Nhà cung cấp'": "PO_CONSTANTS.COL_SUPPLIER",
    "'Tổng tiền'": "PO_CONSTANTS.COL_TOTAL_AMOUNT",
    "'Trạng thái'": "PO_CONSTANTS.COL_STATUS",
    "'Tiến độ'": "PO_CONSTANTS.COL_PROGRESS",
    "'Thao tác'": "PO_CONSTANTS.COL_ACTIONS",
    "'Xem chi tiết'": "PO_CONSTANTS.ACTION_VIEW_DETAIL",
    "Đơn đặt hàng": "{PO_CONSTANTS.PAGE_TITLE}",
    "Quản lý nhập hàng từ nhà cung cấp": "{PO_CONSTANTS.PAGE_SUBTITLE}",
    "Tạo PO mới": "{PO_CONSTANTS.BTN_CREATE_NEW}",
    ">Nháp<": ">{PO_CONSTANTS.STATUS_DRAFT}<",
    ">Đã duyệt<": ">{PO_CONSTANTS.STATUS_APPROVED}<",
    ">Nhập 1 phần<": ">{PO_CONSTANTS.STATUS_PARTIAL}<",
    ">Hoàn tất<": ">{PO_CONSTANTS.STATUS_COMPLETED}<",
    ">Từ chối<": ">{PO_CONSTANTS.STATUS_REJECTED}<",
    ">Đã huỷ<": ">{PO_CONSTANTS.STATUS_CANCELLED}<",
    'label="Tạo PO mới"': 'label={PO_CONSTANTS.BTN_CREATE_NEW}',
    'header: () => <div className="text-right">{PO_CONSTANTS.COL_ACTIONS}</div>': 'header: () => <div className="text-right">{PO_CONSTANTS.COL_ACTIONS}</div>', // fix
  };

  for (const [key, value] of Object.entries(listReplacements)) {
    listContent = listContent.split(key).join(value);
  }
  listContent = listContent.replace(/header: \(\) => <div className="text-right">\{PO_CONSTANTS\.COL_ACTIONS\}<\/div>/g, 'header: () => <div className="text-right">{PO_CONSTANTS.COL_ACTIONS}</div>');
  // the string 'Thao tác' was replaced, so it becomes {PO_CONSTANTS.COL_ACTIONS}.
  // Let's just fix it if needed.

  fs.writeFileSync(poListPath, listContent, 'utf8');
}

replaceStrings();
console.log('Refactor script completed.');
