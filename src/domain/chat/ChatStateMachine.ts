import { StateMachine } from '@/domain/shared/StateMachine';
import type { ChatMessageStatus, ChatRoomStatus } from '@/schema/chat.schema';

export type ChatMessageTransition = 'send_success' | 'send_error' | 'retry';

export const chatMessageStateMachine = new StateMachine<
  ChatMessageStatus,
  ChatMessageTransition
>(
  {
    pending: ['send_success', 'send_error'],
    sent: [],
    error: ['retry'],
  },
  {
    send_success: 'sent',
    send_error: 'error',
    retry: 'pending',
  },
);

export type ChatRoomTransition = 'close' | 'reopen';

export const chatRoomStateMachine = new StateMachine<
  ChatRoomStatus,
  ChatRoomTransition
>(
  {
    active: ['close'],
    closed: ['reopen'],
  },
  {
    close: 'closed',
    reopen: 'active',
  },
);

export function canSendMessage(roomStatus: ChatRoomStatus): boolean {
  return roomStatus === 'active';
}

export function isMessageFailed(status: ChatMessageStatus): boolean {
  return status === 'error';
}
