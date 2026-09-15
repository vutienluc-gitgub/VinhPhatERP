/**
 * Chat Offline Queue — IndexedDB-based queue for Driver & Warehouse offline messages.
 *
 * Stores pending messages in IndexedDB when network is lost.
 * Flushes queue sequentially with Exponential Backoff retry limits when `navigator.onLine` becomes true.
 */

const DB_NAME = 'erp_chat_offline';
const DB_VERSION = 1;
const STORE_NAME = 'pending_messages';

export const MAX_QUEUE_RETRIES = 5;

export interface QueuedMessage {
  clientId: string;
  roomId: string;
  content: string;
  messageType: string;
  imageUrl?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  queuedAt: number;
  retryCount?: number;
  lastAttemptAt?: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'clientId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Enqueue a message for later sending. */
export async function enqueueMessage(msg: QueuedMessage): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({
      ...msg,
      retryCount: msg.retryCount ?? 0,
      lastAttemptAt: msg.lastAttemptAt ?? Date.now(),
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Get all queued messages, ordered chronologically by queuedAt. */
export async function getQueuedMessages(): Promise<QueuedMessage[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => {
      const items = (request.result as QueuedMessage[]).sort(
        (a, b) => a.queuedAt - b.queuedAt,
      );
      resolve(items);
    };
    request.onerror = () => reject(request.error);
  });
}

/** Update retry metadata for a queued message. */
export async function updateQueueRetry(
  clientId: string,
  retryCount: number,
): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(clientId);

    getReq.onsuccess = () => {
      const existing = getReq.result as QueuedMessage | undefined;
      if (existing) {
        store.put({
          ...existing,
          retryCount,
          lastAttemptAt: Date.now(),
        });
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Remove a message from the queue after successful send. */
export async function dequeueMessage(clientId: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(clientId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Get count of pending messages. */
export async function getQueueSize(): Promise<number> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).count();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
