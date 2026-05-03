/**
 * Media Manager — Constants
 *
 * Centralized labels, messages, and configuration.
 * No hardcoded Vietnamese strings in components.
 */

// ─── Buckets ───────────────────────────────────────

export const MEDIA_BUCKETS = {
  PUBLIC: 'public-media',
  SECURE: 'secure-media',
} as const;

// ─── File size limits ──────────────────────────────

export const MEDIA_LIMITS = {
  MAX_FILE_SIZE_MB: 50,
  MAX_FILE_SIZE_BYTES: 50 * 1024 * 1024,
  MAX_BATCH_FILES: 20,
  SIGNED_URL_EXPIRY_SECONDS: 3600, // 1 hour
} as const;

// ─── MIME type groups ──────────────────────────────

export const MIME_GROUPS = {
  image: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
  ],
} as const;

export const ACCEPTED_FILE_TYPES = [
  ...MIME_GROUPS.image,
  ...MIME_GROUPS.video,
  ...MIME_GROUPS.document,
].join(',');

// ─── Vietnamese Labels ─────────────────────────────

export const MEDIA_LABELS = {
  PAGE_TITLE: 'Quản lý Media',
  PAGE_DESCRIPTION: 'Quản lý hình ảnh, tài liệu và file đính kèm.',
  UPLOAD: 'Tải lên',
  NEW_FOLDER: 'Thư mục mới',
  ALL_FILES: 'Tất cả',
  IMAGES: 'Hình ảnh',
  VIDEOS: 'Video',
  DOCUMENTS: 'Tài liệu',
  OTHERS: 'Khác',
  ROOT_FOLDER: 'Thư mục gốc',
  SEARCH_PLACEHOLDER: 'Tìm kiếm file...',
  FOLDER_NAME_PLACEHOLDER: 'Nhập tên thư mục',
  DROP_HINT: 'Kéo thả file vào đây hoặc nhấn để chọn',
  DROP_ACTIVE: 'Thả file vào đây...',
  NO_FILES: 'Chưa có file nào',
  NO_FILES_DESCRIPTION: 'Tải lên file hoặc tạo thư mục mới.',
  UPLOAD_SUCCESS: 'Tải lên thành công',
  UPLOAD_ERROR: 'Lỗi khi tải lên',
  DELETE_CONFIRM: 'Bạn có chắc muốn xoá file này?',
  DELETE_FOLDER_CONFIRM: 'Xoá thư mục sẽ xoá tất cả file bên trong.',
  FOLDER_CREATED: 'Tạo thư mục thành công',
  FILE_DELETED: 'Xoá file thành công',
  COPY_URL_SUCCESS: 'Đã sao chép URL',
  RENAME: 'Đổi tên',
  MOVE: 'Di chuyển',
  SELECT_FOLDER: 'Chọn thư mục',
  MOVE_SUCCESS: 'Đã di chuyển file',
  RENAME_SUCCESS: 'Đã đổi tên',
  RENAME_FOLDER_SUCCESS: 'Đã đổi tên thư mục',
  ANALYZE_RECEIPT: 'Trích xuất giao dịch',
  ANALYZING: 'Đang phân tích...',
  EXTRACTION_SUCCESS: 'Đã trích xuất thông tin thành công!',
  EXTRACTION_ERROR: 'Không thể trích xuất thông tin từ file này.',
} as const;

// ─── Messages ──────────────────────────────────────

export const MEDIA_MESSAGES = {
  FILE_TOO_LARGE: `File vượt quá ${MEDIA_LIMITS.MAX_FILE_SIZE_MB}MB`,
  BATCH_LIMIT: `Tối đa ${MEDIA_LIMITS.MAX_BATCH_FILES} file mỗi lần tải`,
  UNSUPPORTED_TYPE: 'Loại file không được hỗ trợ',
  FOLDER_NAME_REQUIRED: 'Tên thư mục không được để trống',
  FOLDER_EXISTS: 'Thư mục đã tồn tại',
} as const;

// ─── Query keys ────────────────────────────────────

export const MEDIA_QUERY_KEYS = {
  FOLDERS: 'media-folders',
  ASSETS: 'media-assets',
  ASSET_DETAIL: 'media-asset-detail',
} as const;
