export const SYNC_MONITOR_LABELS = {
  // Page Title & Header
  PAGE_TITLE: 'Theo dõi đồng bộ Google Sheets',
  PAGE_SUBTITLE:
    'Giám sát hàng đợi xuất dữ liệu, trạng thái kết nối và nhật ký đồng bộ tự động.',
  BACK_TO_SETTINGS: 'Quay lại Cài đặt hệ thống',

  // Connection Card
  CONNECTION_TITLE: 'Kết nối Google Sheets',
  CONNECTION_SUBTITLE:
    'Cấu hình thông qua Service Account và Supabase Secrets bảo mật.',
  STATUS_CONNECTED: 'Đã kết nối',
  STATUS_PAUSED: 'Tạm dừng',
  STATUS_ERROR: 'Lỗi kết nối',
  STATUS_DISCONNECTED: 'Chưa kết nối',
  LAST_SYNCED_AT: 'Lần đồng bộ gần nhất',
  NEVER_SYNCED: 'Chưa từng đồng bộ',
  SPREADSHEET_ID: 'Spreadsheet ID',
  SERVICE_ACCOUNT_EMAIL: 'Service Account Email',
  CONFIG_ENV_HINT:
    'Cấu hình bảo mật được lưu trong Supabase Secrets (GOOGLE_SA_PRIVATE_KEY)',
  UNCONFIGURED: 'Chưa cấu hình',
  LOADING_ELLIPSIS: 'Đang tải...',
  LOADING_LOGS: 'Đang tải nhật ký...',
  TASK_COUNT_SUFFIX: 'tác vụ',

  // Stat Cards
  STAT_PENDING_LABEL: 'Đang chờ xử lý',
  STAT_PENDING_DESC: 'Hàng đợi outbound sync',
  STAT_SUCCESS_TODAY_LABEL: 'Thành công hôm nay',
  STAT_SUCCESS_TODAY_DESC: 'Bản ghi xuất thành công',
  STAT_FAILED_LABEL: 'Thất bại (chờ retry)',
  STAT_FAILED_DESC: 'Đang theo lịch backoff',
  STAT_DEAD_LETTER_LABEL: 'Đã hủy (Dead Letter)',
  STAT_DEAD_LETTER_DESC: 'Vượt quá 5 lần retry',

  // Actions
  BTN_TEST_CONNECTION: 'Kiểm tra kết nối',
  BTN_TESTING: 'Đang kiểm tra...',
  BTN_RETRY_FAILED: 'Thử lại các job lỗi',
  BTN_RETRYING: 'Đang thử lại...',
  BTN_REFRESH: 'Làm mới',
  BTN_VIEW_LOGS: 'Xem nhật ký',
  BTN_CLOSE_LOGS: 'Đóng',
  BTN_RETRY_SINGLE: 'Thử lại',
  BTN_GO_TO_MONITOR: 'Mở trang theo dõi đồng bộ',
  BTN_PULL_IMPORT: 'Kéo dữ liệu từ Sheet',
  BTN_PULLING_IMPORT: 'Đang kéo dữ liệu...',
  BTN_FORCE_RECONCILE: 'Đối soát dữ liệu',
  BTN_RECONCILING: 'Đang đối soát...',

  // Reconciliation Modal
  RECONCILE_MODAL_TITLE: 'Báo cáo đối soát dữ liệu (Consistency Guard)',
  RECONCILE_MODAL_SUBTITLE:
    'Kết quả so sánh giữa Supabase SSOT và Google Sheets Projection.',
  RECONCILE_EXEC_TIME: 'Thời điểm thực hiện đối soát:',
  RECONCILE_SCANNED: 'Tổng số quét',
  RECONCILE_MISSING_FIXED: 'Bản ghi thiếu (Đã tạo job bù)',
  RECONCILE_STALE_UPDATED: 'Bản ghi cũ (Đã tạo job cập nhật)',
  RECONCILE_ORPHAN_DETECTED: 'Bản ghi thừa trên Sheet (Cảnh báo)',
  RECONCILE_TOTAL_JOBS: 'Tổng sync job tự động sinh ra',
  RECONCILE_CLOSE: 'Đóng báo cáo',

  // Jobs Table
  TABLE_TITLE: 'Danh sách tác vụ đồng bộ gần đây',
  TABLE_SUBTITLE:
    'Hiển thị tối đa 20 tác vụ gần nhất theo cơ chế Transactional Outbox.',
  COL_ENTITY: 'Đối tượng',
  COL_NUMBER: 'Mã chứng từ / ID',
  COL_DIRECTION: 'Hướng',
  COL_STATUS: 'Trạng thái',
  COL_RETRIES: 'Số lần thử',
  COL_CREATED_AT: 'Thời điểm tạo',
  COL_ACTIONS: 'Thao tác',

  // Direction labels
  DIR_OUTBOUND: 'ERP → Sheets',
  DIR_INBOUND: 'Sheets → ERP',

  // Entity types
  ENTITY_SHIPMENT: 'Phiếu xuất kho',
  ENTITY_ORDER: 'Đơn hàng',

  // Status badges
  STATUS_JOB_PENDING: 'Chờ xử lý',
  STATUS_JOB_PROCESSING: 'Đang xử lý',
  STATUS_JOB_SUCCESS: 'Thành công',
  STATUS_JOB_FAILED: 'Thất bại',
  STATUS_JOB_DEAD_LETTER: 'Hủy (Dead letter)',

  // Logs Modal / Drawer
  LOGS_TITLE: 'Nhật ký đồng bộ chi tiết',
  LOGS_SUBTITLE: 'Audit trail của tác vụ đồng bộ.',
  LOG_COL_TIME: 'Thời gian',
  LOG_COL_LEVEL: 'Mức độ',
  LOG_COL_MESSAGE: 'Nội dung',
  LOG_COL_DETAILS: 'Chi tiết',

  // Empty States
  EMPTY_JOBS_TITLE: 'Chưa có tác vụ đồng bộ nào',
  EMPTY_JOBS_DESC:
    'Khi có phiếu xuất kho hoặc đơn hàng được xác nhận, các tác vụ đồng bộ sẽ tự động xuất hiện tại đây.',
  EMPTY_LOGS_TITLE: 'Chưa có nhật ký ghi nhận',
  EMPTY_LOGS_DESC: 'Tác vụ này chưa có thông điệp nhật ký nào được lưu trữ.',
} as const;

export const SYNC_MONITOR_MESSAGES = {
  RETRY_SUCCESS: 'Đã đưa các tác vụ lỗi trở lại hàng đợi pending.',
  RETRY_ERROR: 'Lỗi khi thử lại tác vụ:',
  TEST_SUCCESS: 'Kết nối Google Sheets thành công!',
  TEST_ERROR: 'Kiểm tra kết nối thất bại:',
  LOAD_ERROR: 'Không thể tải dữ liệu đồng bộ:',
  TEST_EDGE_FN_ERROR: 'Lỗi kiểm tra kết nối với Edge Function',
  IMPORT_TRIGGER_ERROR: 'Lỗi kích hoạt kéo dữ liệu',
  IMPORT_TRIGGER_SUCCESS: 'Đã kích hoạt kéo dữ liệu từ Google Sheets',
  RECONCILE_TRIGGER_ERROR: 'Lỗi kích hoạt đối soát dữ liệu',
  RECONCILE_TRIGGER_SUCCESS: 'Đã kích hoạt đối soát dữ liệu với Google Sheets',
} as const;
