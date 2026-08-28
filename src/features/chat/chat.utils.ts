import type { ChatMessage } from '@/schema/chat.schema';
import type {
  DateMessageGroup,
  MessageCluster,
} from '@/features/chat/chat.types';

function formatDateLabel(isoDate: string): string {
  const date = new Date(isoDate);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  if (isSameDay(date, today)) return 'Hôm nay';
  if (isSameDay(date, yesterday)) return 'Hôm qua';

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

/**
 * Transforms raw messages into structured DateMessageGroups and MessageClusters.
 * Expects `chronologicalMessages` to be ordered from OLDEST to NEWEST.
 */
export function buildMessageGroups(
  chronologicalMessages: ChatMessage[],
  currentUserId?: string,
): DateMessageGroup[] {
  const groups: DateMessageGroup[] = [];

  let currentGroup: DateMessageGroup | null = null;
  let currentCluster: MessageCluster | null = null;

  const CLUSTER_TIME_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

  for (const msg of chronologicalMessages) {
    const dateLabel = formatDateLabel(msg.created_at);
    const dateKey = msg.created_at.split('T')[0] ?? '';
    const isMine = Boolean(currentUserId && msg.sender_id === currentUserId);
    const msgTime = new Date(msg.created_at).getTime();

    // 1. Check Date Grouping
    if (!currentGroup || currentGroup.date !== dateKey) {
      currentGroup = {
        date: dateKey,
        label: dateLabel,
        clusters: [],
      };
      groups.push(currentGroup);
      currentCluster = null; // reset cluster on new day
    }

    // 2. Check Message Clustering within the same Date Group
    const canCluster =
      currentCluster &&
      currentCluster.senderId === msg.sender_id &&
      currentCluster.isMine === isMine &&
      msgTime - new Date(currentCluster.timestamp).getTime() <=
        CLUSTER_TIME_THRESHOLD_MS;

    if (canCluster && currentCluster) {
      currentCluster.messages.push(msg);
      currentCluster.timestamp = msg.created_at; // update cluster latest time
    } else {
      currentCluster = {
        id: `cluster-${msg.id}`,
        senderId: msg.sender_id,
        isMine,
        timestamp: msg.created_at,
        messages: [msg],
      };
      currentGroup.clusters.push(currentCluster);
    }
  }

  return groups;
}
