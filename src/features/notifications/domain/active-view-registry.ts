/**
 * ActiveViewRegistry: Tracks which rooms, entities, or screens the user is currently viewing.
 * Prevents disruptive notification spam (In-App toast, audio chime, Web Push)
 * when the user is already actively engaged with that specific entity.
 */

const activeViews = new Set<string>();

const CHANNEL_NAME = 'vinhphat_active_views';
let broadcastChannel: BroadcastChannel | null = null;

function getBroadcastChannel(): BroadcastChannel | null {
  if (
    typeof window !== 'undefined' &&
    typeof window.BroadcastChannel !== 'undefined'
  ) {
    if (!broadcastChannel) {
      try {
        broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
        broadcastChannel.onmessage = (
          event: MessageEvent<{ type: string; key: string }>,
        ) => {
          if (event.data?.type === 'REGISTER') {
            activeViews.add(event.data.key);
          } else if (event.data?.type === 'UNREGISTER') {
            activeViews.delete(event.data.key);
          }
        };
      } catch {
        broadcastChannel = null;
      }
    }
  }
  return broadcastChannel;
}

function formatKey(viewType: string, viewId: string): string {
  return `${viewType}:${viewId}`;
}

export function registerActiveView(viewType: string, viewId: string): void {
  if (!viewId) return;
  const key = formatKey(viewType, viewId);
  activeViews.add(key);

  const bc = getBroadcastChannel();
  if (bc) {
    try {
      bc.postMessage({ type: 'REGISTER', key });
    } catch {
      // Ignore broadcast errors
    }
  }
}

export function unregisterActiveView(viewType: string, viewId: string): void {
  if (!viewId) return;
  const key = formatKey(viewType, viewId);
  activeViews.delete(key);

  const bc = getBroadcastChannel();
  if (bc) {
    try {
      bc.postMessage({ type: 'UNREGISTER', key });
    } catch {
      // Ignore broadcast errors
    }
  }
}

export function isViewActive(viewType: string, viewId: string): boolean {
  if (!viewId) return false;
  return activeViews.has(formatKey(viewType, viewId));
}

export function getActiveViews(): string[] {
  return Array.from(activeViews);
}

export function clearActiveViews(): void {
  activeViews.clear();
}
