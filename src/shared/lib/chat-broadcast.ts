export const broadcastChatMessage = (msg: any) => {};
export const broadcastNewMessage = (msg: any) => {};
export const broadcastConnectionStatus = (status: any) => {};
export const broadcastTypingStatus = (status: any) => {};
export const broadcastUserStatus = (status: any) => {};
export const onBroadcastMessage = (callback: any) => {
  return () => {};
};
export const subscribeToBroadcast = (callback: any) => {
  return () => {};
};

export const chatBroadcast = {
  broadcastChatMessage,
  broadcastNewMessage,
  broadcastConnectionStatus,
  broadcastTypingStatus,
  broadcastUserStatus,
  onBroadcastMessage,
  subscribeToBroadcast,
};

export default chatBroadcast;
