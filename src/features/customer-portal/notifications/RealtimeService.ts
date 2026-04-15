import type { RealtimeChannel } from '@supabase/supabase-js';

import { supabase } from '@/services/supabase/client';

import type {
  NotificationItem,
  PortalDataEvent,
  RealtimePayload,
  OrderRow,
  OrderProgressRow,
  ShipmentRow,
  QuotationRow,
} from './types';
import {
  createOrderNotification,
  createOrderDataEvent,
  createProgressNotification,
  createProgressDataEvent,
  createShipmentNotification,
  createQuotationNotification,
  createQuotationDataEvent,
  processPayload,
} from './notificationFactory';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface RealtimeServiceConfig {
  customerId: string;
  onNotification: (item: NotificationItem) => void;
  onDataUpdate: (event: PortalDataEvent) => void;
  onConnectionWarning: (warning: boolean) => void;
  /** Cache of order_id → order_number for progress notifications */
  orderNumberCache?: Map<string, string>;
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

  const { customerId, onNotification, onDataUpdate, orderNumberCache } = config;

  // Channel 1: orders — UPDATE only, filter by customer_id
  const ordersChannel = supabase
    .channel(`portal-orders-${customerId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `customer_id=eq.${customerId}`,
      },
      (payload) => {
        const safe = processPayload(
          payload as unknown as RealtimePayload<OrderRow>,
          customerId,
        );
        if (!safe) return;

        const notification = createOrderNotification(safe);
        if (notification) onNotification(notification);

        const dataEvent = createOrderDataEvent(safe);
        if (dataEvent) onDataUpdate(dataEvent);
      },
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR') handleChannelError();
      else if (status === 'SUBSCRIBED') {
        retryCount = 0;
        config.onConnectionWarning(false);
      }
    });

  // Channel 2: order_progress — INSERT + UPDATE
  const progressChannel = supabase
    .channel(`portal-progress-${customerId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'order_progress',
      },
      (payload) => {
        const row = (payload as unknown as RealtimePayload<OrderProgressRow>)
          .new;
        const orderNumber = orderNumberCache?.get(row.order_id) ?? row.order_id;
        const notification = createProgressNotification(
          payload as unknown as RealtimePayload<OrderProgressRow>,
          orderNumber,
        );
        if (notification) onNotification(notification);

        const dataEvent = createProgressDataEvent(
          payload as unknown as RealtimePayload<OrderProgressRow>,
        );
        if (dataEvent) onDataUpdate(dataEvent);
      },
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'order_progress',
      },
      (payload) => {
        const row = (payload as unknown as RealtimePayload<OrderProgressRow>)
          .new;
        const orderNumber = orderNumberCache?.get(row.order_id) ?? row.order_id;
        const notification = createProgressNotification(
          payload as unknown as RealtimePayload<OrderProgressRow>,
          orderNumber,
        );
        if (notification) onNotification(notification);

        const dataEvent = createProgressDataEvent(
          payload as unknown as RealtimePayload<OrderProgressRow>,
        );
        if (dataEvent) onDataUpdate(dataEvent);
      },
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR') handleChannelError();
    });

  // Channel 3: shipments — INSERT only, filter by customer_id
  const shipmentsChannel = supabase
    .channel(`portal-shipments-${customerId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'shipments',
        filter: `customer_id=eq.${customerId}`,
      },
      (payload) => {
        const safe = processPayload(
          payload as unknown as RealtimePayload<ShipmentRow>,
          customerId,
        );
        if (!safe) return;

        const notification = createShipmentNotification(safe);
        if (notification) onNotification(notification);

        const shipmentRow = safe.new;
        onDataUpdate({
          type: 'shipment_created',
          shipment: {
            id: shipmentRow.id,
            shipment_number: shipmentRow.shipment_number,
            shipment_date: shipmentRow.shipment_date,
            order_number: null, // will be resolved by hook
            status: shipmentRow.status as never,
            delivery_address: shipmentRow.delivery_address,
            customer_id: shipmentRow.customer_id,
          },
        });
      },
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR') handleChannelError();
    });

  // Channel 4: quotations — INSERT + UPDATE, filter by customer_id
  const quotationsChannel = supabase
    .channel(`portal-quotations-${customerId}`)
    .on(
      'postgres_changes',
      {
        event: '*', // Listen to all status changes (draft -> sent, confirmed, etc.)
        schema: 'public',
        table: 'quotations',
        filter: `customer_id=eq.${customerId}`,
      },
      (payload) => {
        const safe = processPayload(
          payload as unknown as RealtimePayload<QuotationRow>,
          customerId,
        );
        if (!safe) return;

        const notification = createQuotationNotification(safe);
        if (notification) onNotification(notification);

        const dataEvent = createQuotationDataEvent(safe);
        if (dataEvent) onDataUpdate(dataEvent);
      },
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR') handleChannelError();
    });

  channels = [
    ordersChannel,
    progressChannel,
    shipmentsChannel,
    quotationsChannel,
  ];
}

export function stop(): void {
  clearRetryTimer();
  channels.forEach((ch) => {
    supabase.removeChannel(ch);
  });
  channels = [];
  currentConfig = null;
}

export function isConnected(): boolean {
  return channels.length > 0;
}
