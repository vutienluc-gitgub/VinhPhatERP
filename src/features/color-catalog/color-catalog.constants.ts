export const COLOR_CATALOG_MESSAGES = {
  PAGE_TITLE: 'Danh mục màu sắc',
  PAGE_SUBTITLE: 'Quản lý bảng màu dùng chung cho toàn hệ thống sản xuất.',

  BTN_ADD: 'Thêm màu',
  BTN_ADD_FIRST: 'Thêm màu đầu tiên',
  BTN_SAVE: 'Lưu thay đổi',
  BTN_SAVING: 'Đang lưu...',
  BTN_CREATE: 'Tạo màu',
  BTN_DELETE: 'Xóa',
  BTN_CANCEL: 'Hủy',

  TAB_ALL: 'Tất cả',
  TAB_DARK: 'Màu Đậm',
  TAB_MIDDLE: 'Màu Trung',
  TAB_LIGHT: 'Màu Lợt',
  TAB_NONE: 'Chưa phân nhóm',
  TAB_OTHER: 'Khác',

  EMPTY_TITLE: 'Chưa có màu sắc nào',
  EMPTY_DESC: 'Bấm Thêm màu để tạo màu mới dùng chung cho toàn hệ thống.',

  COL_CODE: 'Mã',
  COL_NAME: 'Tên màu',
  COL_TREND: 'Xu hướng',

  MSG_DELETE_CONFIRM: 'Bạn có chắc chắn muốn xóa màu này?',
  MSG_DELETE_SUCCESS: 'Đã xóa màu thành công',
  MSG_DELETE_ERROR: 'Lỗi khi xóa: ',

  MSG_SAVE_SUCCESS: 'Đã lưu màu sắc',
  MSG_SAVE_ERROR: 'Lỗi khi lưu: ',

  LBL_CODE: 'Mã màu',
  LBL_NAME: 'Tên màu',
  LBL_NOTE: 'Ghi chú',
  LBL_TREND: 'Năm xu hướng',
  LBL_GROUP: 'Nhóm màu',
  HINT_CODE_READONLY: 'Mã màu không thể thay đổi sau khi tạo',
  PH_CODE: 'VD: RD-02',
  PH_NAME: 'VD: Đỏ đô (Maroon)',
  PH_NOTE: 'VD: Phù hợp BST Hè',
  MSG_UPDATE_SUCCESS: 'Cập nhật thành công',
  MSG_CREATE_SUCCESS: 'Thêm mới thành công',
};

export function getColorGroupVariant(
  group?: string | null,
): 'purple' | 'warning' | 'info' | 'gray' {
  if (!group) return 'gray';
  const map: Record<string, 'purple' | 'warning' | 'info' | 'gray'> = {
    'Màu Đậm': 'purple',
    'Màu Trung': 'warning',
    'Màu Lợt': 'info',
  };
  return map[group] || 'gray';
}
