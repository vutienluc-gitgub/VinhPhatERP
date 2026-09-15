/**
 * Typing Indicator - Hybrid Supabase Realtime Broadcast & BroadcastChannel sync.
 *
 * Uses Supabase Realtime Broadcast Channels for cross-device typing indicator state sync with 0% DB overhead,
 * and BroadcastChannel for multi-tab synchronization on local machine.
 * Typing state expires after 3 seconds of inactivity.
 */

import { supabase } from '@/services/supabase/client';

const LOCAL_TYPING_CHANNEL = 'chat_typing';
export const TYPING_EXPIRY_MS = 3000; // 3 seconds

export interface TypingMessage {
  type: 'typing_start' | 'typing_stop';
  roomId: string;
  userId: string;
  userName: string;
  timestamp: number;
}

const localChannel = typeof window !== 'undefined' ? new BroadcastChannel(LOCAL_TYPING_CHANNEL) : null;

/**
 * Broadcast typing start event via local BroadcastChannel and Supabase Realtime Broadcast.
 */
export function broadcastTypingStart(params: {
  roomId: string;
  userId: string;
  userName: string;
  channel?: ReturnType<typeof supabase.channel> | null;
}): void {
  const payload: TypingMessage = {
    type: 'typing_start',
    roomId: params.roomId,
    userId: params.userId,
    userName: params.userName,
    timestamp: Date.now(),
  };

  try {
    localChannel?.postMessage(payload);
  } catch {
    // Fail silently if channel closed
  }

  if (params.channel) {
    void params.channel.send({
      type: 'broadcast',
      event: 'typing',
      payload,
    });
  }
}

/**
 * Broadcast typing stop event.
 */
export function broadcastTypingStop(params: {
  roomId: string;
  userId: string;
  userName: string;
  channel?: ReturnType<typeof supabase.channel> | null;
}): void {
  const payload: TypingMessage = {
    type: 'typing_stop',
    roomId: params.roomId,
    userId: params.userId,
    userName: params.userName,
    timestamp: Date.now(),
  };

  try {
    localChannel?.postMessage(payload);
  } catch {
    // Fail silently if channel closed
  }

  if (params.channel) {
    void params.channel.send({
      type: 'broadcast',
      event: 'typing',
      payload,
    });
  }
}

/**
 * Listen for local typing events.
 */
export function onTypingEvent(
  callback: (message: TypingMessage) => void,
): () => void {
  if (!localChannel) return () => {};

  const handler = (event: MessageEvent) => {
    callback(event.data as TypingMessage);
  };
  localChannel.addEventListener('message', handler);
  return () => localChannel.removeEventListener('message', handler);
}
