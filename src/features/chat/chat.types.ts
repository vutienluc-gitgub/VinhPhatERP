import type { ChatMessage } from '@/schema/chat.schema';
import type {
  ChatParticipantParty,
  ChatMessageSide,
} from '@/domain/chat/chat.party';

export type { ChatParticipantParty, ChatMessageSide };

export type MessagePresence =
  | 'online'
  | 'offline'
  | 'typing'
  | 'away'
  | 'error';

export type MessageStatus =
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed';

export type MessagePosition = 'single' | 'first' | 'middle' | 'last';

export interface ChatRoomContext {
  currentUserId?: string;
  currentUserRole?: string;
  partnerName?: string;
  partnerRole?: 'customer' | 'driver' | 'staff';
  entityType?: string;
}

export interface ChatMessageViewModel {
  message: ChatMessage;
  position: MessagePosition;
  senderId: string | null;
  senderName: string;
  senderInitials: string;
  senderAvatarUrl?: string;
  party: ChatParticipantParty;
  side: ChatMessageSide;
  isMine: boolean;
  timeFormatted: string;
  status: MessageStatus;
  isEmojiOnly?: boolean;
}

export interface MessageCluster {
  id: string;
  senderId: string | null;
  senderName: string;
  senderInitials: string;
  senderAvatarUrl?: string;
  party: ChatParticipantParty;
  side: ChatMessageSide;
  isMine: boolean;
  timestamp: string;
  messages: ChatMessageViewModel[];
}

export interface DateMessageGroup {
  date: string;
  label: string;
  clusters: MessageCluster[];
}
