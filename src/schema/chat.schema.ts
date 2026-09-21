import { z } from 'zod';

export const CHAT_LABELS = {
  TITLE: 'Trao đổi nội bộ & Đối tác',
  SEND: 'Gửi',
  TYPE_A_MESSAGE: 'Nhập tin nhắn (hỗ trợ @tag)...',
  ATTACHMENT: 'Đính kèm tệp / ảnh',
  CLOSE: 'Đóng',
  LOADING: 'Đang tải tin nhắn...',
  OFFLINE: 'Ngoại tuyến (Tin nhắn sẽ được gửi khi có mạng)',
  SEARCH: 'Tìm kiếm tin nhắn...',
  ONLINE: 'Đang hoạt động',
  TYPING: 'đang soạn tin nhắn...',
  NO_MESSAGES: 'Chưa có tin nhắn nào',
  NO_MESSAGES_YET: 'Chưa có tin nhắn',
  UNREAD: 'Chưa đọc',
};

export const CHAT_INBOX_LABELS = {
  TITLE: 'Hộp thư trao đổi',
  JUST_NOW: 'Vừa xong',
  MINS_AGO: 'phút trước',
  HOURS_AGO: 'giờ trước',
  DAYS_AGO: 'ngày trước',
  NO_MESSAGES_YET: 'Chưa có tin nhắn nào',
  MARK_ALL_READ: 'Đánh dấu đã đọc',
  SEARCH_ROOMS: 'Tìm kiếm hội thoại...',
  ALL_ROOMS: 'Tất cả cuộc hội thoại',
};

export const CHAT_MESSAGES_PAGE_SIZE = 50;

export const chatMentionSchema = z.object({
  user_id: z.string(),
  user_name: z.string(),
  offset: z.number().optional(),
  length: z.number().optional(),
});

export const chatMessageSchema = z.object({
  id: z.string(),
  room_id: z.string(),
  sender_id: z.string(),
  sender_name: z.string(),
  sender_avatar: z.string().optional().nullable(),
  content: z.string(),
  attachments: z.array(z.any()).optional().default([]),
  mentions: z.array(chatMentionSchema).optional().default([]),
  created_at: z.string(),
  is_offline: z.boolean().optional(),
  reactions: z.record(z.any()).optional(),
  read_by: z.array(z.string()).optional().default([]),
});

export const chatRoomSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  entity_type: z.string().optional(),
  entity_id: z.string().optional(),
  last_message: chatMessageSchema.optional().nullable(),
  unread_count: z.number().optional().default(0),
  participants: z.array(z.any()).optional().default([]),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type ChatMention = z.infer<typeof chatMentionSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatRoom = z.infer<typeof chatRoomSchema>;
export type OptimisticChatMessage = ChatMessage & { is_optimistic?: boolean; is_sending?: boolean; error?: string };

export const chatMessageResponseSchema = chatMessageSchema;
export const chat_schema = chatMessageSchema;
export default chatMessageSchema;


// Auto-generated missing exports
export const AVAILABLE_ROLES = [] as const;


// Auto-generated missing exports
export const CANNED_RESPONSES = [] as const;
