/**
 * Sheet Type Definitions -- 2 types of sheets for VinhPhatERP
 *
 * A. ERP_REPORT_*  -- Read-only projection from ERP (Outbound)
 * B. ERP_IMPORT_*  -- Controlled input channel (Inbound -- Phase 3)
 *
 * All sheets live in ONE Spreadsheet (multiple tabs).
 */

// -- A. Report Sheet Column Definitions ------------------------------------

export const REPORT_SHEET_COLUMNS = {
  XUAT_KHO: [
    'Ngay',
    'So chung tu',
    'Khach hang',
    'Ma VT',
    'Ten san pham',
    'DVT',
    'SL Xuat',
    'Hoa don',
    'ERP Status',
    // Hidden columns -- Idempotency
    'ERP Record ID',
    'ERP Version',
    'Sync ID',
  ],
  DON_HANG: [
    'Ngay',
    'So don hang',
    'Khach hang',
    'San pham',
    'SL',
    'Tong tien',
    'Trang thai',
    // Hidden columns -- Idempotency
    'ERP Record ID',
    'ERP Version',
    'Sync ID',
  ],
} as const;

// -- B. Import Sheet Column Definitions (Phase 3) -------------------------

export const IMPORT_SHEET_COLUMNS = {
  XUAT_KHO: [
    'Import ID',
    'Ngay',
    'Khach hang',
    'Ma VT',
    'SL',
    'Ghi chu',
    'Trang thai',
    'Loi',
  ],
  DON_HANG: [
    'Import ID',
    'Ngay',
    'Khach hang',
    'San pham',
    'SL',
    'Don gia',
    'Ghi chu',
    'Trang thai',
    'Loi',
  ],
} as const;

// -- Import Row Status Lifecycle -------------------------------------------

export type ImportRowStatus =
  | 'READY'
  | 'VALIDATING'
  | 'VALID'
  | 'INVALID'
  | 'DRAFT_CREATED'
  | 'APPROVED';

export const IMPORT_VALIDATION_MESSAGES = {
  MISSING_CUSTOMER: 'Thiếu thông tin khách hàng',
  MISSING_MATERIAL: 'Thiếu mã vật tư',
  MISSING_PRODUCT: 'Thiếu tên sản phẩm',
  INVALID_QUANTITY: 'Số lượng phải là số lớn hơn 0',
  INVALID_UNIT_PRICE: 'Đơn giá không hợp lệ',
  INVALID_DATE_FORMAT: 'Định dạng ngày không hợp lệ',
} as const;

// -- Tab Names Convention --------------------------------------------------

export const SHEET_TAB_NAMES = {
  REPORT_XUAT_KHO: 'ERP_REPORT_XUAT_KHO',
  REPORT_DON_HANG: 'ERP_REPORT_DON_HANG',
  IMPORT_XUAT_KHO: 'ERP_IMPORT_XUAT_KHO',
  IMPORT_DON_HANG: 'ERP_IMPORT_DON_HANG',
} as const;

// -- Sync Job Status -------------------------------------------------------

export type SyncJobStatus =
  | 'pending'
  | 'processing'
  | 'success'
  | 'failed'
  | 'dead_letter';

export type SyncDirection = 'outbound' | 'inbound';

export type SyncProvider = 'google_sheets';

export type SyncEntityType = 'shipment' | 'order';
