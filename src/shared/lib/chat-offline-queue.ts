/**
 * Chat Offline Queue — IndexedDB-based queue for Driver offline messages.
 *
 * When network is lost, messages are stored locally in IndexedDB.
 * When `navigator.onLine` becomes true, the queue auto-flushes.
 */

const DB_NAME = 'erp_chat_offline';
const DB_VERSION = 1;
const STORE_NAME = 'pending_messages';

interface QueuedMessage {
  clientId: string;
  roomId: string;
  content: string;
  messageType: string;
  imageUrl?: string;
  queuedAt: number;
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
    tx.objectStore(STORE_NAME).put(msg);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Get all queued messages, ordered by queuedAt. */
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
