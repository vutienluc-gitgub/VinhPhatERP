import { describe, it } from 'vitest';
import * as fc from 'fast-check';

import {
  createOrderNotification,
  createProgressNotification,
  createShipmentNotification,
  processPayload,
} from '@/features/customer-portal/notifications/notificationFactory';
import {
  ORDER_STATUS_LABELS,
  PRODUCTION_STAGE_LABELS,
  STAGE_STATUS_LABELS,
  mapOrderStatus,
  mapProductionStage,
  mapStageStatus,
} from '@/features/customer-portal/notifications/notificationMappers';
import type {
  OrderStatus,
  ProductionStage,
  StageStatus,
  RealtimePayload,
  OrderRow,
  OrderProgressRow,
  ShipmentRow,
} from '@/features/customer-portal/notifications/types';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const orderStatuses = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];
const productionStages = Object.keys(
  PRODUCTION_STAGE_LABELS,
) as ProductionStage[];
const stageStatuses = Object.keys(STAGE_STATUS_LABELS) as StageStatus[];

const arbitraryOrderStatus = () => fc.constantFrom(...orderStatuses);
const arbitraryProductionStage = () => fc.constantFrom(...productionStages);
const arbitraryStageStatus = () => fc.constantFrom(...stageStatuses);

const arbitraryOrderRow = (): fc.Arbitrary<OrderRow> =>
  fc.record({
    id: fc.uuid(),
    order_number: fc.string({ minLength: 1 }),
    status: arbitraryOrderStatus(),
    customer_id: fc.uuid(),
    delivery_date: fc.option(fc.string(), { nil: null }),
    total_amount: fc.float({
      min: 0,
      max: 1e9,
    }),
    paid_amount: fc.float({
      min: 0,
      max: 1e9,
    }),
    order_date: fc.string(),
  });

const arbitraryProgressRow = (): fc.Arbitrary<OrderProgressRow> =>
  fc.record({
    id: fc.uuid(),
    order_id: fc.uuid(),
    stage: arbitraryProductionStage(),
    status: arbitraryStageStatus(),
    planned_date: fc.option(fc.string(), { nil: null }),
    actual_date: fc.option(fc.string(), { nil: null }),
  });

const arbitraryShipmentRow = (): fc.Arbitrary<ShipmentRow> =>
  fc.record({
    id: fc.uuid(),
    shipment_number: fc.string({ minLength: 1 }),
    order_id: fc.option(fc.uuid(), { nil: null }),
    customer_id: fc.uuid(),
    status: fc.string(),
    delivery_address: fc.option(fc.string(), { nil: null }),
    shipment_date: fc.string(),
  });

// ---------------------------------------------------------------------------
// Property 2: Deduplication — bỏ qua khi status không thay đổi
// ---------------------------------------------------------------------------

describe('notificationFactory — Property 2: deduplication when status unchanged', () => {
  it('createOrderNotification returns null when status unchanged', () => {
    fc.assert(
      fc.property(
        arbitraryOrderStatus(),
        arbitraryOrderRow(),
        (status, row) => {
          const payload: RealtimePayload<OrderRow> = {
            eventType: 'UPDATE',
            new: {
              ...row,
              status,
            },
            old: { status },
            table: 'orders',
            schema: 'public',
          };
          return createOrderNotification(payload) === null;
        },
      ),
      { numRuns: 100 },
    );
  });

  it('createProgressNotification returns null on UPDATE when status unchanged', () => {
    fc.assert(
      fc.property(
        arbitraryStageStatus(),
        arbitraryProgressRow(),
        (status, row) => {
          const payload: RealtimePayload<OrderProgressRow> = {
            eventType: 'UPDATE',
            new: {
              ...row,
              status,
            },
            old: { status },
            table: 'order_progress',
            schema: 'public',
          };
          return createProgressNotification(payload, 'DH-001') === null;
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 4: Tạo notification đúng từ order event
// ---------------------------------------------------------------------------

describe('notificationFactory — Property 4: order notification contains order_number and status label', () => {
  it('notification title contains order_number and body contains Vietnamese status', () => {
    fc.assert(
      fc.property(
        arbitraryOrderRow(),
        arbitraryOrderStatus(),
        (row, oldStatus) => {
          // Ensure status actually changes
          const newStatus =
            orderStatuses.find((s) => s !== oldStatus) ?? orderStatuses[0]!;
          const payload: RealtimePayload<OrderRow> = {
            eventType: 'UPDATE',
            new: {
              ...row,
              status: newStatus,
            },
            old: { status: oldStatus },
            table: 'orders',
            schema: 'public',
          };
          const item = createOrderNotification(payload);
          if (!item) return oldStatus === newStatus; // dedup case
          return (
            item.title.includes(row.order_number) &&
            item.body.includes(mapOrderStatus(newStatus))
          );
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 5: Tạo notification đúng từ order_progress event
// ---------------------------------------------------------------------------

describe('notificationFactory — Property 5: progress notification contains order_number and stage/status labels', () => {
  it('notification title contains orderNumber and body contains stage and status labels', () => {
    fc.assert(
      fc.property(
        arbitraryProgressRow(),
        fc.string({ minLength: 1 }),
        (row, orderNumber) => {
          const payload: RealtimePayload<OrderProgressRow> = {
            eventType: 'INSERT',
            new: row,
            old: {},
            table: 'order_progress',
            schema: 'public',
          };
          const item = createProgressNotification(payload, orderNumber);
          if (!item) return false;
          return (
            item.title.includes(orderNumber) &&
            item.body.includes(mapProductionStage(row.stage)) &&
            item.body.includes(mapStageStatus(row.status))
          );
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 6: Tạo notification đúng từ shipment event
// ---------------------------------------------------------------------------

describe('notificationFactory — Property 6: shipment notification contains shipment_number', () => {
  it('notification title contains shipment_number', () => {
    fc.assert(
      fc.property(arbitraryShipmentRow(), (row) => {
        const payload: RealtimePayload<ShipmentRow> = {
          eventType: 'INSERT',
          new: row,
          old: {},
          table: 'shipments',
          schema: 'public',
        };
        const item = createShipmentNotification(payload);
        if (!item) return false;
        return item.title.includes(row.shipment_number);
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 11: Security filter — bỏ qua payload của customer khác
// ---------------------------------------------------------------------------

describe('notificationFactory — Property 11: security filter rejects wrong customer_id', () => {
  it('processPayload returns null when customer_id does not match', () => {
    fc.assert(
      fc.property(arbitraryOrderRow(), fc.uuid(), (row, currentCustomerId) => {
        fc.pre(row.customer_id !== currentCustomerId);
        const payload: RealtimePayload<OrderRow> = {
          eventType: 'UPDATE',
          new: row,
          old: {},
          table: 'orders',
          schema: 'public',
        };
        return processPayload(payload, currentCustomerId) === null;
      }),
      { numRuns: 100 },
    );
  });

  it('processPayload returns payload when customer_id matches', () => {
    fc.assert(
      fc.property(arbitraryOrderRow(), (row) => {
        const payload: RealtimePayload<OrderRow> = {
          eventType: 'UPDATE',
          new: row,
          old: {},
          table: 'orders',
          schema: 'public',
        };
        return processPayload(payload, row.customer_id) !== null;
      }),
      { numRuns: 100 },
    );
  });
});
