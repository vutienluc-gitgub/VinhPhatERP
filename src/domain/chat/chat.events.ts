/**
 * Chat Domain Events — Standardized events emitted by the Chat module.
 * The Notification Platform consumes these events independently.
 */

export interface ChatMessageCreatedEvent {
  type: 'CHAT_MESSAGE_CREATED';
  eventId: string;
  roomId: string;
  messageId: string;
  clientId: string;
  senderId: string | null;
  messageType: string;
  content: string;
  createdAt: string;
}

export interface ChatMessageReadEvent {
  type: 'CHAT_MESSAGE_READ';
  eventId: string;
  roomId: string;
  userId: string;
  lastReadMessageId?: string | null;
  readAt: string;
}

export interface ChatMessageReactionAddedEvent {
  type: 'CHAT_MESSAGE_REACTION_ADDED';
  eventId: string;
  roomId: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: string;
}

export interface ChatRoomClosedEvent {
  type: 'CHAT_ROOM_CLOSED';
  eventId: string;
  roomId: string;
  closedAt: string;
}

export type ChatDomainEvent =
  | ChatMessageCreatedEvent
  | ChatMessageReadEvent
  | ChatMessageReactionAddedEvent
  | ChatRoomClosedEvent;
