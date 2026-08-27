/**
 * Pure calculator for application badge count.
 * Badge is always a derived state from Single Source of Truth counters.
 */
export class BadgeCalculator {
  /**
   * Computes total badge count from all subsystem unread metrics.
   */
  static computeTotalBadge(params: {
    systemNotificationsUnread?: number | null;
    chatMessagesUnread?: number | null;
    tasksPendingUnread?: number | null;
  }): number {
    const system = Math.max(0, params.systemNotificationsUnread || 0);
    const chat = Math.max(0, params.chatMessagesUnread || 0);
    const tasks = Math.max(0, params.tasksPendingUnread || 0);

    return system + chat + tasks;
  }

  /**
   * Sanitizes count to a safe non-negative integer.
   */
  static sanitizeBadgeCount(count: number): number {
    if (isNaN(count) || count < 0) return 0;
    return Math.floor(count);
  }
}
