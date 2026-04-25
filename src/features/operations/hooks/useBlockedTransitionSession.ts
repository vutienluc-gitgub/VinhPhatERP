import { useCallback, useEffect, useState } from 'react';

export interface BlockedTransitionEventDetail {
  taskId: string;
  fromStatus: string;
  targetStatus: string;
  reason: string;
  source: 'preview' | 'commit';
  timestamp: string;
  module?: string;
}

const BLOCKED_TRANSITIONS_SESSION_COUNT_KEY =
  'operations-blocked-transitions-session-count';
const MAX_SESSION_EVENTS = 200;
const MAX_RECENT_EVENTS = 3;
const BLOCKED_TRANSITION_EVENT_NAME = 'ops:blocked-transition';

function loadSessionCount(): number {
  if (typeof window === 'undefined') {
    return 0;
  }

  try {
    const raw = window.localStorage.getItem(
      BLOCKED_TRANSITIONS_SESSION_COUNT_KEY,
    );
    if (!raw) {
      return 0;
    }

    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

export function useBlockedTransitionSession() {
  const [recentEvents, setRecentEvents] = useState<
    BlockedTransitionEventDetail[]
  >([]);
  const [sessionEvents, setSessionEvents] = useState<
    BlockedTransitionEventDetail[]
  >([]);
  const [sessionCount, setSessionCount] = useState<number>(loadSessionCount);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        BLOCKED_TRANSITIONS_SESSION_COUNT_KEY,
        String(sessionCount),
      );
    } catch {
      // ignore storage errors
    }
  }, [sessionCount]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<BlockedTransitionEventDetail>)
        .detail;
      if (!detail) {
        return;
      }

      setSessionCount((value) => value + 1);
      setSessionEvents((previous) =>
        [detail, ...previous].slice(0, MAX_SESSION_EVENTS),
      );
      setRecentEvents((previous) =>
        [
          detail,
          ...previous.filter(
            (item) =>
              !(
                item.taskId === detail.taskId &&
                item.targetStatus === detail.targetStatus &&
                item.timestamp === detail.timestamp
              ),
          ),
        ].slice(0, MAX_RECENT_EVENTS),
      );
    };

    window.addEventListener(
      BLOCKED_TRANSITION_EVENT_NAME,
      handler as EventListener,
    );

    return () => {
      window.removeEventListener(
        BLOCKED_TRANSITION_EVENT_NAME,
        handler as EventListener,
      );
    };
  }, []);

  const reset = useCallback(() => {
    setSessionCount(0);
    setRecentEvents([]);
    setSessionEvents([]);
  }, []);

  return {
    recentEvents,
    sessionEvents,
    sessionCount,
    reset,
  };
}
