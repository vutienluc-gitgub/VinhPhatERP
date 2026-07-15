export const YARN_UNIT_OPTIONS = [
  { value: 'kg', label: 'kg' },
  { value: 'cuộn', label: 'cuộn' },
  { value: 'tấn', label: 'tấn' },
];

export const ITEM_ROW_LABELS = {
  YARN_TYPE: 'Loại sợi',
  YARN_TYPE_PLACEHOLDER: 'Chọn hoặc nhập loại sợi...',
  COLOR: 'Màu sợi',
  COLOR_PLACEHOLDER: 'Chọn hoặc nhập màu...',
  QUANTITY: 'Số lượng',
  UNIT_PRICE: 'Đơn giá',
  LOT_NUMBER: 'Số lô (Lot)',
  LOT_NUMBER_PLACEHOLDER: 'VD: LOT-2026-03-A',
  GRADE: 'Phân loại (Grade)',
  GRADE_PLACEHOLDER: 'VD: A, B...',
  UNIT: 'Đơn vị',
  UNIT_PLACEHOLDER: 'Chọn...',
  TENSILE_STRENGTH: 'Cường lực',
  TENSILE_STRENGTH_PLACEHOLDER: 'VD: 18 cN/tex',
  COMPOSITION: 'Thành phần',
  COMPOSITION_PLACEHOLDER: 'VD: 100% Cotton',
  DTEX: 'DTEX/F',
  DTEX_PLACEHOLDER: 'VD: 333dtex/96f',
  TWIST: 'Twist (Xoắn)',
  TWIST_PLACEHOLDER: 'VD: Z, S',
  MACHINE_NO: 'Machine No',
  MACHINE_NO_PLACEHOLDER: 'VD: B755',
  NET_WEIGHT: 'N.W (KL tịnh)',
  NET_WEIGHT_PLACEHOLDER: 'VD: 27.0',
  GROSS_WEIGHT: 'G.W (KL gộp)',
  GROSS_WEIGHT_PLACEHOLDER: 'VD: 31.0',
  SERIAL_NUMBER: 'Serial Number',
  SERIAL_NUMBER_PLACEHOLDER: 'VD: 4610037442 DYA5-DA',
  PROD_WEEK: 'Tuần SX (Week)',
  PROD_WEEK_PLACEHOLDER: 'VD: 8',
  DIST: 'Dist',
  DIST_PLACEHOLDER: 'VD: A, B...',
  CONES_PER_BOX: 'Côn/thùng',
  CONES_PER_BOX_PLACEHOLDER: 'VD: 18',
  BOX_COUNT: 'Số thùng',
  BOX_COUNT_PLACEHOLDER: 'VD: 10',
  BOX_NO: 'Mã thùng (Box No)',
  BOX_NO_PLACEHOLDER: 'VD: 19',
  NOTES: 'Ghi chú (Tự động điền khi quét Barcode)',
  NOTES_PLACEHOLDER: "VD: Q'TY: 6 cuộn | Twist: Z | Machine: B755",
  ROW: 'Dòng',
  DELETE_ROW: 'Xóa dòng',
};

export const FORM_LABELS = {
  receiptNumber: 'Số phiếu',
  receiptNumberAuto: 'Tự động',
  receiptDate: 'Ngày nhập',
  supplier: 'Nhà cung cấp',
  createSupplier: '+ Tạo NCC mới',
  addItemRow: '+ Thêm dòng sợi',
  scanBarcode: 'Quét Barcode',
  scanningBarcode: 'Đang tra cứu API...',
  notes: 'Ghi chú',
  notesPlaceholder: 'Ghi chú về phiếu nhập...',
  supplierPlaceholder: '— Chọn nhà cung cấp —',
  update: 'Cập nhật',
  create: 'Tạo phiếu',
};

export const FORM_MESSAGES = {
  genericError: 'Có lỗi xảy ra',
  scanError: 'Lỗi quét mã',
  scanSuccess: 'Bóc tách Barcode thành công!',
  errorPrefix: 'Lỗi:',
  unsavedConfirm: 'Bạn có thông tin chưa lưu. Bạn có chắc chắn muốn đóng?',
};

/** Sample barcode for dev/demo — will be used as prompt default value */
export const DEV_SAMPLE_BARCODE = '2510-F000016';

export const MODAL_LABELS = {
  barcodeTitle: 'Barcode Truy xuất Lô',
  qrTitle: 'QR Code Truy xuất Lô',
  receiptNumber: 'Số phiếu',
  supplier: 'Nhà cung cấp',
  receiptDate: 'Ngày nhập',
  yarnType: 'Loại sợi',
  lotNumber: 'Mã lô',
  quantity: 'Số lượng',
  packaging: 'Đóng gói',
  print: 'In',
  close: 'Đóng',
  noItems: 'Không có dòng hàng nào',
};

export const LIST_LABELS = {
  COL_RECEIPT_DATE: 'Ngày nhập',
  COL_SUPPLIER: 'Nhà cung cấp',
  COL_UNIT_PRICE: 'Đơn giá',
  COL_TOTAL_AMOUNT: 'Tổng tiền',
};

export const LOGISTICS_LABELS = {
  title: 'Thông tin Vận chuyển & Chi phí',
  vehicleInfo: 'Thông tin xe / Tài xế',
  vehicleInfoPlaceholder: 'VD: Xe 51C-123.45, Tài xế Hải',
  additionalFees:
    'Các khoản phí khác (Sẽ được phân bổ vào Giá vốn / Landed Cost)',
  feeNamePlaceholder: 'Tên loại phí (VD: Cước vận chuyển)',
  addFeeBtn: '+ Thêm chi phí',
  notes: 'Ghi chú',
};
