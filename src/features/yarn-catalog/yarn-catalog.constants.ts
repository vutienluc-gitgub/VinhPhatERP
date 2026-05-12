import type { FilterFieldConfig } from '@/shared/components';

export const YARN_CATALOG_MESSAGES = {
  EMPTY_TITLE: 'Chưa có loại sợi nào',
  EMPTY_DESC: 'Nhấn "+ Thêm loại sợi" để bắt đầu quản lý danh mục sợi.',
  NOT_FOUND_TITLE: 'Không tìm thấy loại sợi phù hợp',
  NOT_FOUND_DESC: 'Thử điều chỉnh bộ lọc.',
  BTN_ADD: '+ Thêm loại sợi',
  LOAD_ERROR: 'Lỗi tải dữ liệu',
  DELETE_ERROR: 'Lỗi xóa',
  DELETE_CONFIRM: 'Xóa loại sợi "{name}"? Hành động này không thể hoàn tác.',
  EXPORT_FILENAME: 'Danh_Muc_Soi',
  PAGINATION_LABEL: 'loại sợi',
  ARIA_LIST_CONTAINER: 'Danh sách danh mục sợi',
  ARIA_ADD_NEW: 'Thêm loại sợi mới',
  ARIA_FILTER_BAR: 'Bộ lọc danh sách',
  ARIA_DATA_TABLE: 'Bảng dữ liệu mã sợi',
} as const;

export const YARN_CATALOG_FILTER_SCHEMA: FilterFieldConfig[] = [
  {
    key: 'search',
    type: 'search',
    label: 'Tìm kiếm',
    placeholder: 'Tên, mã, thành phần...',
  },
  {
    key: 'status',
    type: 'combobox',
    label: 'Trạng thái',
    options: [
      {
        value: 'active',
        label: 'Đang dùng',
      },
      {
        value: 'inactive',
        label: 'Ngừng dùng',
      },
    ],
  },
  {
    key: 'lot_no',
    type: 'search',
    label: 'Mã lô',
    placeholder: 'Tìm theo lô...',
  },
  {
    key: 'grade',
    type: 'search',
    label: 'Phân loại',
    placeholder: 'Loại A, B...',
  },
];
