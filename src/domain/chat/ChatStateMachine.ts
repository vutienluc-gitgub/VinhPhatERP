import { StateMachine } from '@/domain/shared/StateMachine';
import type { ChatMessageStatus, ChatRoomStatus } from '@/schema/chat.schema';

/**
 * MessageSendState: High-fidelity lifecycle states for message sending
 * Distinct from static presentation status (○, ✓, !)
 */
export type MessageSendState =
  | 'idle'
  | 'pending'
  | 'sent'
  | 'failed'
  | 'retrying';

export type MessageSendTransition =
  | 'start_send'
  | 'send_success'
  | 'send_error'
  | 'retry';

export const messageSendStateMachine = new StateMachine<
  MessageSendState,
  MessageSendTransition
>(
  {
    idle: ['start_send'],
    pending: ['send_success', 'send_error'],
    sent: [],
    failed: ['retry'],
    retrying: ['start_send', 'send_success', 'send_error'],
  },
  {
    start_send: 'pending',
    send_success: 'sent',
    send_error: 'failed',
    retry: 'retrying',
  },
);

// ── Backwards Compatible ChatMessageStatus StateMachine ──

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

export function isMessageFailed(
  status: ChatMessageStatus | MessageSendState,
): boolean {
  return status === 'error' || status === 'failed';
}

/**
 * Maps architectural MessageSendState to UI presentation status
 */
export function mapSendStateToPresentationStatus(
  state: MessageSendState,
): 'sending' | 'sent' | 'failed' {
  switch (state) {
    case 'pending':
    case 'retrying':
      return 'sending';
    case 'sent':
      return 'sent';
    case 'failed':
      return 'failed';
    default:
      return 'sending';
  }
}
