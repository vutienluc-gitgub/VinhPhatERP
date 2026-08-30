/**
 * Chat Cache Storage — IndexedDB persistent cache for fast chat startup.
 *
 * Saves the latest messages for each room to local IndexedDB.
 * Hydrates query cache instantly on cold open (0ms delay).
 */
import type { ChatMessage } from '@/schema/chat.schema';

const DB_NAME = 'erp_chat_cache';
const DB_VERSION = 1;
const STORE_NAME = 'room_messages';

interface CachedRoomMessages {
  roomId: string;
  messages: ChatMessage[];
  cachedAt: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'roomId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save latest messages for a room to IndexedDB cache (fire-and-forget).
 */
export async function saveCachedMessages(
  roomId: string,
  messages: ChatMessage[],
): Promise<void> {
  try {
    const list = Array.isArray(messages)
      ? messages
      : messages &&
          typeof messages === 'object' &&
          'messages' in messages &&
          Array.isArray((messages as { messages: unknown }).messages)
        ? (messages as { messages: ChatMessage[] }).messages
        : [];
    if (list.length === 0) return;

    const db = await openDb();
    const payload: CachedRoomMessages = {
      roomId,
      messages: list.slice(0, 50), // keep latest 50 for fast startup
      cachedAt: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(payload);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignore IndexedDB write errors in private browsing / restricted environments
  }
}

/**
 * Read cached messages for a room from IndexedDB.
 */
export async function getCachedMessages(
  roomId: string,
): Promise<ChatMessage[] | null> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(roomId);
      request.onsuccess = () => {
        const result = request.result as CachedRoomMessages | undefined;
        if (!result || !result.messages) {
          resolve(null);
          return;
        }
        if (Array.isArray(result.messages)) {
          resolve(result.messages);
        } else if (
          result.messages &&
          typeof result.messages === 'object' &&
          'messages' in result.messages &&
          Array.isArray((result.messages as { messages: unknown }).messages)
        ) {
          resolve((result.messages as { messages: ChatMessage[] }).messages);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}
