export type OfflineQueueItem = {
  id: string
  entity: string
  action: string
  createdAt: string
}

export function getOfflineQueue(): OfflineQueueItem[] {
  return []
}
