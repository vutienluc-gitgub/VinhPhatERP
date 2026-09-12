/**
 * Sync Outbox Service -- Application Layer
 *
 * Manages the Transactional Outbox for outbound sync (ERP -> External).
 *
 * Responsibilities:
 * 1. Create sync job in integration_sync_jobs (persistent queue)
 * 2. Deterministic sync_id -- retry never creates duplicates
 * 3. Snapshot entity data at the time the job is created
 *
 * This service does NOT import GoogleSheetsAdapter.
 * It only writes to DB. The Edge Function Worker reads and processes.
 *
 * Dependency flow:
 *   DomainEvent -> IntegrationLayer -> SyncOutboxService -> DB (integration_sync_jobs)
 *   Edge Function Worker -> DB -> GoogleSheetsAdapter -> Google API
 */

import { safeUpsert } from '@/lib/db-guard';
import { generateDeterministicSyncId } from '@/integration/sync/sync-id';
import type { SafeDomainEvent } from '@/domain/core/DomainEventBus';
import type {
  ShipmentShippedEvent,
  OrderConfirmedEvent,
} from '@/domain/events/app.events';
import {
  isEventHandled,
  recordEventStart,
  recordEventSuccess,
  recordEventFailure,
} from '@/integration/integration.service';
import { untypedDb } from '@/services/supabase/untyped';

// -- Types -------------------------------------------------------------------

interface CreateSyncJobParams {
  connectionId: string;
  provider: string;
  direction: 'outbound' | 'inbound';
  entityType: string;
  entityId: string;
  version: number;
  payload: Record<string, unknown>;
}

// -- Core: Create Sync Job ---------------------------------------------------

async function createSyncJob(params: CreateSyncJobParams): Promise<void> {
  const syncId = await generateDeterministicSyncId(
    params.entityType,
    params.entityId,
    params.version,
    params.connectionId,
  );

  await safeUpsert({
    table: 'integration_sync_jobs',
    data: {
      connection_id: params.connectionId,
      provider: params.provider,
      direction: params.direction,
      entity_type: params.entityType,
      entity_id: params.entityId,
      sync_id: syncId,
      version: params.version,
      payload: params.payload,
      status: 'pending',
      attempt_count: 0,
    },
    conflictKey: 'sync_id',
  });
}

// -- Retry Calculation -------------------------------------------------------

export function calculateNextRetry(attemptCount: number): Date {
  const baseDelay = 30_000;
  const maxDelay = 3_600_000;
  const delay = Math.min(baseDelay * Math.pow(2, attemptCount), maxDelay);
  return new Date(Date.now() + delay);
}

// -- Resolve Active Connection -----------------------------------------------

async function resolveActiveConnectionId(): Promise<string | null> {
  const { data } = await untypedDb
    .from('integration_connections')
    .select('id')
    .eq('provider', 'google_sheets')
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  const row = data as { id?: string };
  return row.id ?? null;
}

// -- Handler: Shipment -> Outbound Sync --------------------------------------

export async function handleShipmentSyncOutbound(
  event: SafeDomainEvent<ShipmentShippedEvent>,
): Promise<void> {
  const handlerName = 'ShipmentShipped -> Google Sheets Outbound Sync';
  const { eventId, eventName, payload } = event;

  if (await isEventHandled(eventId, handlerName)) {
    return;
  }

  await recordEventStart(eventId, eventName, handlerName, payload);

  try {
    const connectionId = await resolveActiveConnectionId();
    if (!connectionId) {
      await recordEventSuccess(eventId, eventName, handlerName, {
        skipped: true,
        reason: 'No active Google Sheets connection configured',
      });
      return;
    }

    await createSyncJob({
      connectionId,
      provider: 'google_sheets',
      direction: 'outbound',
      entityType: 'shipment',
      entityId: payload.shipmentId,
      version: 1,
      payload: {
        shipmentId: payload.shipmentId,
        shipmentNumber: payload.shipmentNumber,
        orderId: payload.orderId,
        rollIds: payload.rollIds,
        shippedAt: payload.shippedAt,
      },
    });

    await recordEventSuccess(eventId, eventName, handlerName, {
      syncJobCreated: true,
      entityType: 'shipment',
      entityId: payload.shipmentId,
    });
  } catch (err) {
    await recordEventFailure(eventId, eventName, handlerName, err);
    throw err;
  }
}

// -- Handler: Order -> Outbound Sync -----------------------------------------

export async function handleOrderSyncOutbound(
  event: SafeDomainEvent<OrderConfirmedEvent>,
): Promise<void> {
  const handlerName = 'OrderConfirmed -> Google Sheets Outbound Sync';
  const { eventId, eventName, payload } = event;

  if (await isEventHandled(eventId, handlerName)) {
    return;
  }

  await recordEventStart(eventId, eventName, handlerName, payload);

  try {
    const connectionId = await resolveActiveConnectionId();
    if (!connectionId) {
      await recordEventSuccess(eventId, eventName, handlerName, {
        skipped: true,
        reason: 'No active Google Sheets connection configured',
      });
      return;
    }

    await createSyncJob({
      connectionId,
      provider: 'google_sheets',
      direction: 'outbound',
      entityType: 'order',
      entityId: payload.orderId,
      version: 1,
      payload: {
        orderId: payload.orderId,
        orderNumber: payload.orderNumber,
        customerId: payload.customerId,
        totalAmount: payload.totalAmount,
        confirmedAt: payload.confirmedAt,
      },
    });

    await recordEventSuccess(eventId, eventName, handlerName, {
      syncJobCreated: true,
      entityType: 'order',
      entityId: payload.orderId,
    });
  } catch (err) {
    await recordEventFailure(eventId, eventName, handlerName, err);
    throw err;
  }
}
