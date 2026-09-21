const offlineQueue: any[] = [];

export const enqueueMessage = (msg: any) => {
  offlineQueue.push(msg);
};

export const getQueuedMessages = (roomId?: string) => {
  if (roomId) {
    return offlineQueue.filter((m) => m.room_id === roomId);
  }
  return [...offlineQueue];
};

export const dequeueMessage = (msgId: string) => {
  const idx = offlineQueue.findIndex((m) => m.id === msgId);
  if (idx !== -1) {
    return offlineQueue.splice(idx, 1)[0];
  }
  return null;
};

export const clearQueuedMessages = (roomId?: string) => {
  if (roomId) {
    for (let i = offlineQueue.length - 1; i >= 0; i--) {
      if (offlineQueue[i].room_id === roomId) {
        offlineQueue.splice(i, 1);
      }
    }
  } else {
    offlineQueue.length = 0;
  }
};

export const chatOfflineQueue = {
  enqueueMessage,
  getQueuedMessages,
  dequeueMessage,
  clearQueuedMessages,
  add: enqueueMessage,
  flush: () => {},
};

export default chatOfflineQueue;
