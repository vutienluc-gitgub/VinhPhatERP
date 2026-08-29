import type { ChatMessage } from '@/schema/chat.schema';

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

export interface ChatMessageViewModel {
  message: ChatMessage;
  position: MessagePosition;
  senderId: string | null;
  senderName: string;
  senderInitials: string;
  senderAvatarUrl?: string;
  isMine: boolean;
  timeFormatted: string;
  status: MessageStatus;
}

export interface MessageCluster {
  id: string;
  senderId: string | null;
  senderName: string;
  senderInitials: string;
  senderAvatarUrl?: string;
  isMine: boolean;
  timestamp: string;
  messages: ChatMessageViewModel[];
}

export interface DateMessageGroup {
  date: string;
  label: string;
  clusters: MessageCluster[];
}
