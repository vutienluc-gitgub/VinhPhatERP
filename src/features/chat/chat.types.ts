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

export interface MessageCluster {
  id: string;
  senderId: string | null;
  senderName?: string;
  isMine: boolean;
  timestamp: string;
  messages: ChatMessage[];
}

export interface DateMessageGroup {
  date: string;
  label: string;
  clusters: MessageCluster[];
}
