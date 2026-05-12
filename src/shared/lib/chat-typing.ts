/**
 * Typing Indicator - BroadcastChannel-based typing state sync.
 *
 * Uses BroadcastChannel for multi-tab synchronization without database.
 * Typing state expires after 3 seconds of inactivity.
 */

const TYPING_CHANNEL = 'chat_typing';
const TYPING_EXPIRY_MS = 3000; // 3 seconds

export interface TypingMessage {
  type: 'typing_start' | 'typing_stop';
  roomId: string;
  userId: string;
  userName: string;
  timestamp: number;
}

const channel = new BroadcastChannel(TYPING_CHANNEL);

// Active typing states (userId -> { timestamp, userName })
const typingStates = new Map<string, { timestamp: number; userName: string }>();

// Cleanup expired typing states
setInterval(() => {
  const now = Date.now();
  for (const [userId, state] of typingStates.entries()) {
    if (now - state.timestamp > TYPING_EXPIRY_MS) {
      typingStates.delete(userId);
    }
  }
}, 1000);

/**
 * Broadcast typing start event.
 */
export function broadcastTypingStart(params: {
  roomId: string;
  userId: string;
  userName: string;
}): void {
  channel.postMessage({
    type: 'typing_start',
    ...params,
    timestamp: Date.now(),
  } satisfies TypingMessage);
}

/**
 * Broadcast typing stop event.
 */
export function broadcastTypingStop(params: {
  roomId: string;
  userId: string;
  userName: string;
}): void {
  channel.postMessage({
    type: 'typing_stop',
    ...params,
    timestamp: Date.now(),
  } satisfies TypingMessage);
}

/**
 * Listen for typing events.
 */
export function onTypingEvent(
  callback: (message: TypingMessage) => void,
): () => void {
  const handler = (event: MessageEvent) => {
    callback(event.data as TypingMessage);
  };
  channel.addEventListener('message', handler);
  return () => channel.removeEventListener('message', handler);
}
