/**
 * Per-Aggregate Ordered Offline Command Queue (IndexedDB with memory fallback)
 * Ensures field execution commands are saved locally when offline
 * and synced strictly in FIFO order per aggregate when reconnected.
 */

export interface QueuedLogisticsCommand {
  id: string;
  commandId: string;
  aggregateId: string;
  commandName:
    | 'transition_delivery_attempt'
    | 'submit_delivery_epod'
    | 'report_delivery_exception';
  payload: Record<string, unknown>;
  createdAt: number;
  retryCount: number;
  lastError?: string;
}

const DB_NAME = 'vinhphat_les_offline';
const DB_VERSION = 1;
const STORE_NAME = 'offline_commands';

const memoryStore = new Map<string, QueuedLogisticsCommand>();

function isIndexedDBAvailable(): boolean {
  return (
    typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined'
  );
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('by_aggregate', 'aggregateId', { unique: false });
        store.createIndex('by_created_at', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Enqueues a command for offline execution.
 */
export async function enqueueOfflineCommand(
  cmd: Omit<QueuedLogisticsCommand, 'id' | 'createdAt' | 'retryCount'>,
): Promise<QueuedLogisticsCommand> {
  const record: QueuedLogisticsCommand = {
    ...cmd,
    id: `${cmd.aggregateId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: Date.now(),
    retryCount: 0,
  };

  if (!isIndexedDBAvailable()) {
    memoryStore.set(record.id, record);
    return record;
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.add(record);

    req.onsuccess = () => resolve(record);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Retrieves all pending commands sorted by creation time.
 */
export async function getPendingOfflineCommands(): Promise<
  QueuedLogisticsCommand[]
> {
  if (!isIndexedDBAvailable()) {
    const items = Array.from(memoryStore.values());
    items.sort((a, b) => a.createdAt - b.createdAt);
    return items;
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    req.onsuccess = () => {
      const items = (req.result as QueuedLogisticsCommand[]) || [];
      items.sort((a, b) => a.createdAt - b.createdAt);
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Removes a synced command from the offline store.
 */
export async function removeOfflineCommand(id: string): Promise<void> {
  if (!isIndexedDBAvailable()) {
    memoryStore.delete(id);
    return;
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Flushes the offline queue by executing each pending command sequentially per aggregate.
 */
export async function flushOfflineQueue(
  executor: (cmd: QueuedLogisticsCommand) => Promise<unknown>,
): Promise<{ processed: number; failed: number }> {
  const commands = await getPendingOfflineCommands();
  let processed = 0;
  let failed = 0;

  // Group commands by aggregateId to ensure per-aggregate FIFO order
  const grouped = new Map<string, QueuedLogisticsCommand[]>();
  for (const cmd of commands) {
    const list = grouped.get(cmd.aggregateId) ?? [];
    list.push(cmd);
    grouped.set(cmd.aggregateId, list);
  }

  for (const [, aggregateCommands] of grouped) {
    for (const cmd of aggregateCommands) {
      try {
        await executor(cmd);
        await removeOfflineCommand(cmd.id);
        processed++;
      } catch (err) {
        failed++;
        console.error(`[OfflineQueueSync] Failed command ${cmd.id}:`, err);
        // Break out of this aggregate's queue to preserve causal order
        break;
      }
    }
  }

  return { processed, failed };
}
