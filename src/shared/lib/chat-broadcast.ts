/**
 * Chat Multi-tab Sync — BroadcastChannel API.
 *
 * Prevents duplicate Supabase Realtime connections when multiple tabs are open.
 * Only one tab (the "leader") subscribes to Realtime.
 * Other tabs receive messages via BroadcastChannel relay.
 */

const CHANNEL_NAME = 'erp_chat_sync';

export interface ChatBroadcastPayload {
  type: 'new_message' | 'connection_status';
  roomId: string;
  data: unknown;
}

let broadcastChannel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel {
  if (!broadcastChannel) {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  }
  return broadcastChannel;
}

/**
 * Broadcast a new message to all other tabs.
 * Called by the tab that has the active Realtime subscription.
 */
export function broadcastNewMessage(roomId: string, message: unknown): void {
  try {
    getChannel().postMessage({
      type: 'new_message',
      roomId,
      data: message,
    } satisfies ChatBroadcastPayload);
  } catch {
    // BroadcastChannel not supported or closed — fail silently
  }
}

/**
 * Broadcast connection status change to all tabs.
 */
export function broadcastConnectionStatus(
  roomId: string,
  status: 'connected' | 'disconnected' | 'reconnecting',
): void {
  try {
    getChannel().postMessage({
      type: 'connection_status',
      roomId,
      data: status,
    } satisfies ChatBroadcastPayload);
  } catch {
    // fail silently
  }
}

/**
 * Listen for messages from other tabs.
 * Returns cleanup function.
 */
export function onBroadcastMessage(
  handler: (payload: ChatBroadcastPayload) => void,
): () => void {
  const channel = getChannel();
  const listener = (event: MessageEvent<ChatBroadcastPayload>) => {
    handler(event.data);
  };
  channel.addEventListener('message', listener);

  return () => {
    channel.removeEventListener('message', listener);
  };
}

/**
 * Close the BroadcastChannel (call on app unmount).
 */
export function closeBroadcastChannel(): void {
  if (broadcastChannel) {
    broadcastChannel.close();
    broadcastChannel = null;
  }
}
