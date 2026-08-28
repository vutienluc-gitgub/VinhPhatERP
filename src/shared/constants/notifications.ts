export const NOTIFICATION_CARD_LABELS = {
  PUSH_DEVICE_TITLE: 'Thông báo đẩy trên thiết bị này (Web Push & Badging)',
  PUSH_DEVICE_DESC:
    'Nhận banner thông báo trên màn hình khóa và hiển thị số đếm đỏ trên icon app ngoài màn hình chính khi có công việc mới.',
  BTN_ENABLE_PUSH: 'Bật thông báo ngay',
  BTN_DISABLE_PUSH: 'Tắt thông báo thiết bị',
  PUSH_STATUS_ON: 'Đang hoạt động trên thiết bị này',
  PUSH_STATUS_OFF: 'Chưa kích hoạt thông báo trên thiết bị này',
  BANNER_TITLE: 'Bật thông báo trên thiết bị',
  BANNER_RECOMMENDED: 'Khuyên dùng',
  BANNER_DESC:
    'Nhận tin nhắn chat và cập nhật đơn hàng tức thì ngay cả khi đóng ứng dụng.',
  BTN_ENABLING: 'Đang bật...',
  ARIA_CLOSE_BANNER: 'Đóng biểu ngữ thông báo',
  ARIA_ENABLE_NOTIFICATION: 'Kích hoạt thông báo',
} as const;

export const CHAT_TOAST_LABELS = {
  NEW_IMAGE: 'Hình ảnh mới',
  NEW_FILE: 'Đã gửi tệp đính kèm',
  SENDER_DEFAULT: 'Tin nhắn mới',
  SENDER_UNKNOWN: 'Người dùng',
  GROUP_SUFFIX: 'tin nhắn mới',
  OPEN_CHAT: 'Mở cuộc trò chuyện',
} as const;

export const IOS_PWA_LABELS = {
  TITLE: 'Cần thêm ứng dụng vào Màn hình chính',
  DESC: 'Theo quy định bảo mật của Apple, để nhận thông báo trên iPhone, bạn cần thêm ứng dụng ra Màn hình chính:',
  STEP_1:
    '1. Chạm nút Chia sẻ ở thanh dưới Safari (biểu tượng ô vuông có mũi tên lên)',
  STEP_2: '2. Vuốt xuống và chọn "Thêm vào MH chính" (Add to Home Screen)',
  STEP_3: '3. Mở ứng dụng từ Màn hình chính để bật thông báo',
  GOT_IT: 'Đã hiểu',
} as const;
