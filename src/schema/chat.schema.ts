import { z } from 'zod';

// ── Room Status ──

export type ChatRoomStatus = 'active' | 'closed';

export const CHAT_ROOM_STATUS_LABELS: Record<ChatRoomStatus, string> = {
  active: 'Dang hoat dong',
  closed: 'Da dong',
};

// ── Message Type ──

export type ChatMessageType =
  | 'text'
  | 'image'
  | 'system'
  | 'system_epod'
  | 'file';

// ── Message Status ──

export type ChatMessageStatus = 'pending' | 'sent' | 'error';

export type ChatMention = {
  type: 'user' | 'role' | 'document';
  id?: string; // Used for user or role
  entity_type?: string; // Used for document
  entity_id?: string; // Used for document
  label: string;
};

// ── Participant Role ──

export type ChatParticipantRole = 'admin' | 'driver' | 'customer';

// ── Zod Schemas ──

const chatMentionSchema = z.object({
  type: z.enum(['user', 'role', 'document']),
  id: z.string().optional(),
  entity_type: z.string().optional(),
  entity_id: z.string().optional(),
  label: z.string(),
});

export const chatMessageInputSchema = z.object({
  content: z.string().trim().min(1, 'Noi dung khong duoc de trong').max(2000),
  messageType: z.enum(['text', 'image', 'system', 'file']).default('text'),
  imageUrl: z.string().url().optional(),
  fileUrl: z.string().url().optional(),
  fileName: z.string().optional(),
  fileType: z.string().optional(),
});

export type ChatMessageInput = z.infer<typeof chatMessageInputSchema>;

// ── Response Types (from DB) ──

export interface ChatRoom {
  id: string;
  tenant_id: string;
  entity_type: string;
  entity_id: string;
  status: ChatRoomStatus;
  created_at: string;
  updated_at: string;
}

export interface ChatReaction {
  id: string;
  message_id: string;
  user_id: string;
  user_name: string;
  emoji: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  client_id: string;
  tenant_id: string;
  room_id: string;
  sender_id: string | null;
  sender_name?: string | null;
  sender_role?: string | null;
  message_type: ChatMessageType;
  content: string;
  image_url: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  reply_to_id?: string | null;
  reply_to_message?: {
    id: string;
    sender_name: string;
    content: string;
    message_type: string;
  } | null;
  status: ChatMessageStatus;
  created_at: string;
  deleted_at: string | null;
  is_pinned: boolean;
  pinned_at: string | null;
  pinned_by: string | null;
  mentions?: ChatMention[];
  reactions?: ChatReaction[];
  read_at?: string | null;
  read_by?: string | null;
}

export interface UnifiedTimelineItem extends ChatMessage {
  entity_type: string;
  entity_id: string;
  sender_name: string | null;
  sender_role: string | null;
}

export interface ChatParticipant {
  room_id: string;
  user_id: string;
  role: ChatParticipantRole;
  joined_at: string;
  last_read_message_id: string | null;
  last_read_at: string;
}

// ── Optimistic Message (client-side pending state) ──

export interface OptimisticChatMessage extends ChatMessage {
  _optimistic?: boolean;
}

/**
 * Type guard to check if a message is an optimistic (pending) message.
 * Optimistic messages are created client-side before server confirmation.
 */
export function isOptimisticMessage(
  message: ChatMessage,
): message is OptimisticChatMessage {
  return (message as OptimisticChatMessage)._optimistic === true;
}

// ── API Response Schema ──

export const chatMessageResponseSchema = z
  .object({
    id: z.string().uuid(),
    client_id: z.string().uuid(),
    room_id: z.string().uuid(),
    sender_id: z.string().uuid().nullable(),
    message_type: z.string(),
    content: z.string(),
    image_url: z.string().nullable(),
    status: z.string(),
    created_at: z.string(),
    deleted_at: z.string().nullable(),
    is_pinned: z.boolean().default(false),
    pinned_at: z.string().nullable(),
    pinned_by: z.string().nullable(),
    mentions: z.array(chatMentionSchema).optional().nullable(),
  })
  .passthrough();

export const chatRoomResponseSchema = z
  .object({
    id: z.string().uuid(),
    entity_type: z.string(),
    entity_id: z.string().uuid(),
    status: z.string(),
    created_at: z.string(),
  })
  .passthrough();

// ── Constants ──

export const CHAT_MESSAGES_PAGE_SIZE = 30;

export const CHAT_LABELS = {
  TITLE: 'Chat',
  SEND: 'Gửi',
  TYPE_MESSAGE: 'Nhập tin nhắn...',
  ATTACH_IMAGE: 'Đính kèm hình ảnh',
  LOADING: 'Đang tải...',
  NO_MESSAGES: 'Chưa có tin nhắn nào',
  ROOM_CLOSED: 'Phòng chat đã đóng',
  SEND_ERROR: 'Không gửi được tin nhắn',
  LOAD_ERROR: 'Không thể tải tin nhắn',
  FORBIDDEN: 'Bạn không có quyền truy cập cuộc trò chuyện này',
  ROOM_NOT_FOUND: 'Phòng chat không tồn tại hoặc đã bị xóa',
  IMAGE_TOO_LARGE: 'Hình ảnh không được vượt quá 5MB',
  CONNECTION_LOST: 'Mất kết nối, đang thử kết nối lại...',
  RECONNECTED: 'Đã kết nối lại',
  CANCEL: 'Hủy',
  IMAGE: 'Hình ảnh',
  RETRY: 'Thử lại',
  OPEN_CHAT: 'Mở chat',
  CLOSE_CHAT: 'Đóng chat',
  NEW_IMAGE: 'Hình ảnh mới',
  CLOSE: 'Đóng',
  OFFLINE_PENDING_MSG: 'tin nhắn chờ gửi',
  LOAD_MORE: 'Tải thêm tin nhắn cũ',
  PIN_MESSAGE: 'Ghim tin nhắn',
  UNPIN_MESSAGE: 'Bỏ ghim',
  PINNED_MESSAGES: 'Tin nhắn đã ghim',
  COPY_TEXT: 'Sao chép nội dung',
  LIKE: 'Thích',
  HEART: 'Yêu thích',
  REPLY_MESSAGE: 'Trả lời tin nhắn',
  COPY_TEXT_ACTION: 'Sao chép văn bản',
  ADD_REACTION: 'Thêm reaction',
  REACTED_SUFFIX: 'người đã react',
  DEPARTMENT: 'Bộ phận',
  UNKNOWN_USER: 'Chưa rõ tên',
  REPLYING_TO: 'Đang trả lời tin nhắn:',
  CANCEL_REPLY: 'Hủy trả lời',
  CHOOSE_EMOJI: 'Chọn emoji',
  EMOJI_TOOLTIP: 'Biểu tượng cảm xúc',
  UPLOAD_ATTACHMENT_TOOLTIP: 'Tải lên tệp/hình ảnh',
  START_CONVERSATION_HINT: 'Bắt đầu cuộc trò chuyện ngay!',
  LOADING_OLDER_MESSAGES: 'Đang tải tin nhắn cũ...',
  LOAD_OLDER_MESSAGES: 'Tải thêm tin nhắn cũ',
  SCROLL_TO_BOTTOM: 'Cuộn xuống dưới cùng',
  NEW_MESSAGES_COUNT_SUFFIX: 'tin nhắn mới',
  ACTIVE_NOW: 'Đang hoạt động',
  ACCESSED_MINS_AGO: 'Truy cập {mins} phút trước',
  ACCESSED_HOURS_AGO: 'Truy cập {hours} giờ trước',
  ACCESSED_JUST_NOW: 'Vừa mới truy cập',
  ACCESSED_LONG_AGO: 'Ngoại tuyến',
  TYPING_STATUS: 'Đang nhập tin nhắn...',
  ATTACH_IMAGE_QUICK: 'Gửi hình ảnh',
  UTILITIES_MENU: 'Tiện ích mở rộng',
  UTILITY_ORDER_TITLE: 'Thông tin Đơn hàng',
  UTILITY_ORDER_DESC: 'Chia sẻ tiến độ đơn hàng dệt/nhuộm',
  UTILITY_SHIPMENT_TITLE: 'Chuyến giao hàng',
  UTILITY_SHIPMENT_DESC: 'Chia sẻ phiếu giao và vị trí',
  UTILITY_QUOTATION_TITLE: 'Báo giá sản phẩm',
  UTILITY_QUOTATION_DESC: 'Gửi bảng giá sợi và vải mộc',
  MORE_OPTIONS: 'Tùy chọn khác',
  VIEW_PARTNER_INFO: 'Xem thông tin đối tác',
  SEARCH: 'Tìm kiếm',
  SEARCH_MESSAGES: 'Tìm kiếm tin nhắn',
} as const;

export const CHAT_CONTEXT_LABELS = {
  CUSTOMER_SUPPORT_BADGE: 'Tư vấn viên / CSKH',
  DRIVER_SUPPORT_BADGE: 'Điều phối Vận tải',
  SUPPLIER_SUPPORT_BADGE: 'Bộ phận Thu mua',
  COMPANY_NAME: 'Dệt may Vĩnh Phát',
  COMPANY_HOTLINE: '0989072670',
  CHANNEL_LABEL: 'Kênh hỗ trợ:',
  CHANNEL_VALUE_CUSTOMER: 'Tư vấn kỹ thuật & Tiến độ đơn hàng',
  CHANNEL_VALUE_DRIVER: 'Điều phối Kho & Giao vận',
  CHANNEL_VALUE_SUPPLIER: 'Trao đổi Vật tư & Công nợ',
  TARGET_LABEL: 'Đối tượng:',
  SYSTEM_CODE_LABEL: 'Mã hệ thống:',
  VIEW_DETAIL: 'Chi tiết',
  EXPAND_INFO: 'Mở rộng thông tin',
} as const;

export const AVAILABLE_ROLES = [
  'admin',
  'manager',
  'driver',
  'customer',
  'staff',
  'kho',
] as const;

export const CUSTOMER_QUICK_REPLIES = [
  'Kiểm tra tiến độ đơn hàng giúp tôi',
  'Cho tôi xin báo giá mới nhất',
  'Thời gian giao hàng dự kiến khi nào?',
  'Tôi muốn đặt thêm hàng',
  'Hỗ trợ kiểm tra công nợ giúp tôi',
] as const;

export const DRIVER_QUICK_REPLIES = [
  'Tôi đã nhận hàng và đang bắt đầu giao',
  'Đã tới địa chỉ giao hàng',
  'Khách chưa nghe máy, đang chờ',
  'Đã giao hàng thành công',
  'Có sự cố giao hàng cần hỗ trợ',
] as const;

export const STAFF_QUICK_REPLIES = [
  'Dạ em đã nhận được thông tin ạ',
  'Dạ đơn hàng đang được xử lý',
  'Dạ tài xế đang trên đường giao hàng',
  'Dạ đã chuẩn bị xong hàng',
  'Dạ vâng ạ, cảm ơn quý khách!',
] as const;

export const CANNED_RESPONSES = STAFF_QUICK_REPLIES;

export function getQuickRepliesByRole(role?: string | null): readonly string[] {
  if (role === 'customer') return CUSTOMER_QUICK_REPLIES;
  if (role === 'driver') return DRIVER_QUICK_REPLIES;
  return STAFF_QUICK_REPLIES;
}

export const CHAT_INBOX_LABELS = {
  TITLE: 'Hộp thư hệ thống',
  CONVERSATIONS_SUFFIX: 'cuộc trò chuyện',
  SEARCH_PLACEHOLDER: 'Tìm cuộc trò chuyện, lô hàng...',
  FILTER_ALL: 'Tất cả',
  FILTER_CUSTOMER: 'Khách hàng',
  FILTER_SHIPMENT: 'Lô hàng',
  FILTER_UNREAD: 'Chưa đọc',
  EMPTY_ROOMS: 'Chưa có cuộc trò chuyện nào',
  NOT_FOUND: 'Không tìm thấy cuộc trò chuyện phù hợp.',
  NO_MESSAGES_YET: 'Chưa có tin nhắn',
  JUST_NOW: 'vừa xong',
  MINS_AGO: 'phút',
  HOURS_AGO: 'giờ',
  DAYS_AGO: 'ngày',
} as const;
