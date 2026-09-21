export const broadcastTypingStart = (roomId: string, user: any) => {};
export const broadcastTypingStop = (roomId: string, user: any) => {};
export const onTypingEvent = (callback: any) => {
  return () => {};
};

export const chatTypingManager = {
  start: broadcastTypingStart,
  stop: broadcastTypingStop,
  onTypingEvent,
};

export default chatTypingManager;
