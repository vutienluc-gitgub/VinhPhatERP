export const chatCache = new Map<string, any[]>();

export const saveCachedMessages = (roomId: string, messages: any[]) => {
  chatCache.set(roomId, messages);
  try {
    localStorage.setItem(`chat_cache_${roomId}`, JSON.stringify(messages));
  } catch (e) {
    // Ignore quota errors
  }
};

export const getCachedMessages = (roomId: string): any[] => {
  if (chatCache.has(roomId)) {
    return chatCache.get(roomId) || [];
  }
  try {
    const raw = localStorage.getItem(`chat_cache_${roomId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      chatCache.set(roomId, parsed);
      return parsed;
    }
  } catch (e) {
    // Ignore parse errors
  }
  return [];
};

export default {
  saveCachedMessages,
  getCachedMessages,
  chatCache,
};
