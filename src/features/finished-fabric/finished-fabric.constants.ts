export const FINISHED_FABRIC_MESSAGES = {
  PAGE_TITLE: 'Kho Thành Phẩm',
  PAGE_SUBTITLE: 'Quản lý vải thành phẩm sau khi nhuộm và KCS',

  BTN_NEW: 'Nhập mới',
  BTN_BULK_NEW: 'Nhập mẻ',
  BTN_EXPORT: 'Xuất Excel',

  STAT_TOTAL_ROLLS: 'Tổng thành phẩm',
  STAT_TOTAL_ROLLS_DESC: 'Cuộn đã hoàn tất công đoạn nhuộm',
  STAT_TOTAL_LENGTH: 'Tổng chiều dài',
  STAT_TOTAL_LENGTH_DESC: 'Đã kiểm tra chất lượng (QC)',
  STAT_TOTAL_WEIGHT: 'Tổng khối lượng',
  STAT_TOTAL_WEIGHT_DESC: 'Trọng lượng tịnh xuất kho',

  FILTER_FABRIC_LABEL: 'Loại vải',
  FILTER_FABRIC_PLACEHOLDER: 'Tìm loại vải...',
  FILTER_STATUS_LABEL: 'Trạng thái',
  FILTER_QUALITY_LABEL: 'Chất lượng',

  EMPTY_STATE_FILTER_TITLE: 'Không tìm thấy cuộn thành phẩm',
  EMPTY_STATE_DEFAULT_TITLE: 'Chưa có cuộn thành phẩm nào',
  EMPTY_STATE_DEFAULT_DESC: 'Bắt đầu bằng cách nhập thành phẩm mới.',

  COL_ROLL_NUMBER: 'Mã cuộn',
  COL_RAW_ROLL: 'Mộc gốc',
  COL_LOT_NUMBER: 'Số lô',
  COL_FABRIC_TYPE: 'Loại vải / Màu',
  COL_WEIGHT: 'Khối lượng',
  COL_LENGTH: 'Chiều dài',
  COL_STATUS: 'Trạng thái',
  COL_ACTIONS: 'Thao tác',

  LBL_LOT: 'Lô:',
  LBL_NO_LOT: 'KHÔNG CÓ LÔ',
  LBL_CLEAR_FILTER: 'Xóa bộ lọc',
  BTN_EDIT_TITLE: 'Chỉnh sửa',
  BTN_DELETE_TITLE: 'Xóa',
  BTN_TRACE_TITLE: 'Truy vết',

  ERR_LOAD: 'Lỗi tải dữ liệu:',
  ERR_EXPORT: 'Lỗi xuất Excel:',

  CONFIRM_DELETE_MSG: (num: string) =>
    `Xóa cuộn "${num}"? Hành động này không thể hoàn tác.`,
};
