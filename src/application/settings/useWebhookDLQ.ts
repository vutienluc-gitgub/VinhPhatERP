import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  webhookDlqApi,
  type WebhookMetricsSummary,
  type DeadLetterEvent,
} from '@/api/webhook-dlq.api';

export const WEBHOOK_DLQ_QUERY_KEYS = {
  all: ['webhook_dlq'] as const,
  metrics: (hours: number) => ['webhook_dlq', 'metrics', hours] as const,
  events: (limit: number, offset: number) =>
    ['webhook_dlq', 'events', limit, offset] as const,
};

export function useWebhookMetrics(windowHours = 24) {
  return useQuery<WebhookMetricsSummary, Error>({
    queryKey: WEBHOOK_DLQ_QUERY_KEYS.metrics(windowHours),
    queryFn: () => webhookDlqApi.getMetrics(windowHours),
    refetchInterval: 15_000, // Poll every 15s for live dashboard
  });
}

export function useDeadLetterEvents(limit = 50, offset = 0) {
  return useQuery<DeadLetterEvent[], Error>({
    queryKey: WEBHOOK_DLQ_QUERY_KEYS.events(limit, offset),
    queryFn: () => webhookDlqApi.getDeadLetterEvents(limit, offset),
    refetchInterval: 10_000,
  });
}

export function useReplayWebhookEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, source }: { eventId: string; source: string }) =>
      webhookDlqApi.replaySingleEvent(eventId, source),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: WEBHOOK_DLQ_QUERY_KEYS.all,
      });
    },
  });
}

export function useReplayAllDeadLetterEvents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (source?: string | void) =>
      webhookDlqApi.replayAllEvents(source ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: WEBHOOK_DLQ_QUERY_KEYS.all,
      });
    },
  });
}
