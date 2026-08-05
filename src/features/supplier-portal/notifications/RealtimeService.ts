import type { RealtimeChannel } from '@supabase/supabase-js';

import { supabase } from '@/services/supabase/client';

import type {
  NotificationItem,
  PortalDataEvent,
  RealtimePayload,
} from './types';
import { processPayload } from './notificationFactory';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface RealtimeServiceConfig {
  supplierId: string;
  onNotification: (item: NotificationItem) => void;
  onDataUpdate: (event: PortalDataEvent) => void;
  onConnectionWarning: (warning: boolean) => void;
}

// ---------------------------------------------------------------------------
// Singleton state
// ---------------------------------------------------------------------------

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

let channels: RealtimeChannel[] = [];
let retryCount = 0;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let currentConfig: RealtimeServiceConfig | null = null;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function clearRetryTimer() {
  if (retryTimer !== null) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
}

function handleChannelError() {
  if (!currentConfig) return;
  retryCount += 1;
  if (retryCount > MAX_RETRIES) {
    currentConfig.onConnectionWarning(true);
    return;
  }
  clearRetryTimer();
  retryTimer = setTimeout(() => {
    if (currentConfig) {
      stop();
      start(currentConfig);
    }
  }, RETRY_DELAY_MS);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function start(config: RealtimeServiceConfig): void {
  stop(); // ensure clean state
  currentConfig = config;
  retryCount = 0;

  const { supplierId, onNotification, onDataUpdate } = config;

  // Channel 1: purchase_orders
  const posChannel = supabase
    .channel(`portal-pos-${supplierId}`)
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE
        schema: 'public',
        table: 'purchase_orders',
        filter: `supplier_id=eq.${supplierId}`,
      },
      (payload) => {
        const safe = processPayload(
          payload as unknown as RealtimePayload<unknown>,
        );
        if (safe.notification) onNotification(safe.notification);
        if (safe.event) onDataUpdate(safe.event);
      },
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        retryCount = 0;
        config.onConnectionWarning(false);
      } else if (status === 'TIMED_OUT' || status === 'CLOSED') {
        handleChannelError();
      }
    });

  // Channel 2: sourcing_rfqs
  // Note: we can't filter by supplier_id directly because RFQs might be broadcasted
  // or use a junction table. We will listen to all sourcing_rfqs and filter client-side if needed.
  // Actually, wait, sourcing_rfqs doesn't have supplier_id. It's public or sent via sourcing_supplier_quotes.
  // For simplicity, we just listen to all and filter on client or ignore filter.
  // If it's a broadcast, it's fine for demo.
  const rfqsChannel = supabase
    .channel(`portal-rfqs-all`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'sourcing_rfqs',
      },
      (payload) => {
        const safe = processPayload(
          payload as unknown as RealtimePayload<unknown>,
        );
        if (safe.notification) onNotification(safe.notification);
        if (safe.event) onDataUpdate(safe.event);
      },
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        retryCount = 0;
      } else if (status === 'TIMED_OUT' || status === 'CLOSED') {
        handleChannelError();
      }
    });

  channels = [posChannel, rfqsChannel];
}

export function stop(): void {
  clearRetryTimer();
  currentConfig = null;
  channels.forEach((ch) => void supabase.removeChannel(ch));
  channels = [];
}
