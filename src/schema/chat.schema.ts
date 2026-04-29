import { z } from 'zod';

// ── Room Status ──

export type ChatRoomStatus = 'active' | 'closed';

export const CHAT_ROOM_STATUS_LABELS: Record<ChatRoomStatus, string> = {
  active: 'Dang hoat dong',
  closed: 'Da dong',
};

// ── Message Type ──

export type ChatMessageType = 'text' | 'image' | 'system';

// ── Message Status ──

export type ChatMessageStatus = 'pending' | 'sent' | 'error';

// ── Participant Role ──

export type ChatParticipantRole = 'admin' | 'driver' | 'customer';

// ── Zod Schemas ──

export const chatMessageInputSchema = z.object({
  content: z.string().trim().min(1, 'Noi dung khong duoc de trong').max(2000),
  messageType: z.enum(['text', 'image', 'system']).default('text'),
  imageUrl: z.string().url().optional(),
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

export interface ChatMessage {
  id: string;
  client_id: string;
  tenant_id: string;
  room_id: string;
  sender_id: string | null;
  message_type: ChatMessageType;
  content: string;
  image_url: string | null;
  status: ChatMessageStatus;
  created_at: string;
  deleted_at: string | null;
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
  IMAGE_TOO_LARGE: 'Hình ảnh không được vượt quá 5MB',
  CONNECTION_LOST: 'Mất kết nối, đang thử kết nối lại...',
  RECONNECTED: 'Đã kết nối lại',
  CANCEL: 'Hủy',
  IMAGE: 'Hình ảnh',
  RETRY: 'Thử lại',
  OPEN_CHAT: 'Mở chat',
  CLOSE_CHAT: 'Đóng chat',
  NEW_IMAGE: 'Hình ảnh mới',
} as const;
