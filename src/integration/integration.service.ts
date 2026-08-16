/**
 * Integration Service — Tầng điều phối hạ tầng cho Integration Layer.
 *
 * Nhiệm vụ:
 * 1. Đảm bảo tính Idempotent cho các Event Handlers qua `business_audit_log` & memory cache.
 * 2. Lưu vết trạng thái thực thi (processing, completed, failed, retry_count, last_error).
 * 3. Thực hiện các API calls & updates tương ứng qua Bounded Contexts.
 *
 * Nguyên tắc:
 * - KHÔNG chứa business logic quyết định (business calculations nằm ở Domain layer).
 * - Mọi thao tác ghi DB đều idempotent và an toàn.
 */

import { supabase } from '@/services/supabase/client';
import { safeUpsert } from '@/lib/db-guard';
import {
  DomainEventBus,
  type SafeDomainEvent,
} from '@/domain/core/DomainEventBus';
import type {
  OrderConfirmedEvent,
  ShipmentShippedEvent,
  FabricReceivedEvent,
} from '@/domain/events/app.events';
import {
  evaluateMaterialMatching,
  type WorkOrderDemand,
  type IncomingMaterialSpec,
} from '@/domain/production/MaterialMatchingEngine';

// ─── Idempotency & State Tracking ─────────────────────────────────────────────

const inMemoryProcessedEvents = new Set<string>();

/**
 * Tạo unique key định danh cho một lượt xử lý của handler đối với một event cụ thể.
 */
function getExecutionKey(eventId: string, handlerName: string): string {
  return `${eventId}:${handlerName}`;
}

/**
 * Kiểm tra xem event với handler tương ứng đã được thực thi thành công chưa.
 */
export async function isEventHandled(
  eventId: string,
  handlerName: string,
): Promise<boolean> {
  const key = getExecutionKey(eventId, handlerName);
  if (inMemoryProcessedEvents.has(key)) {
    return true;
  }

  try {
    const { data } = await supabase
      .from('business_audit_log')
      .select('id, payload')
      .eq('entity_type', 'integration_event')
      .eq('entity_id', key)
      .maybeSingle();

    if (data) {
      const payload = data.payload as Record<string, unknown> | null;
      if (payload?.status === 'completed') {
        inMemoryProcessedEvents.add(key);
        return true;
      }
    }
  } catch (err) {
    console.warn('[Integration] Error checking idempotency log:', err);
  }

  return false;
}

/**
 * Ghi nhận bắt đầu xử lý event.
 */
export async function recordEventStart(
  eventId: string,
  eventName: string,
  handlerName: string,
  payload?: unknown,
): Promise<void> {
  const key = getExecutionKey(eventId, handlerName);
  try {
    await safeUpsert({
      table: 'business_audit_log',
      data: {
        entity_id: key,
        entity_type: 'integration_event',
        event_type: 'INTEGRATION_EVENT_START',
        payload: {
          eventId,
          eventName,
          handlerName,
          status: 'processing',
          startedAt: new Date().toISOString(),
          payloadSnapshot: payload,
        },
      },
      conflictKey: 'entity_id',
    });
  } catch (err) {
    console.warn('[Integration] Error recording event start:', err);
  }
}

/**
 * Ghi nhận xử lý event thành công (đảm bảo idempotent cho các lần sau).
 */
export async function recordEventSuccess(
  eventId: string,
  eventName: string,
  handlerName: string,
  resultSnapshot?: unknown,
): Promise<void> {
  const key = getExecutionKey(eventId, handlerName);
  inMemoryProcessedEvents.add(key);

  try {
    await safeUpsert({
      table: 'business_audit_log',
      data: {
        entity_id: key,
        entity_type: 'integration_event',
        event_type: 'INTEGRATION_EVENT_SUCCESS',
        payload: {
          eventId,
          eventName,
          handlerName,
          status: 'completed',
          processedAt: new Date().toISOString(),
          resultSnapshot,
        },
      },
      conflictKey: 'entity_id',
    });
  } catch (err) {
    console.warn('[Integration] Error recording event success:', err);
  }
}

/**
 * Ghi nhận xử lý event thất bại.
 */
export async function recordEventFailure(
  eventId: string,
  eventName: string,
  handlerName: string,
  error: unknown,
): Promise<void> {
  const key = getExecutionKey(eventId, handlerName);
  const errorMessage = error instanceof Error ? error.message : String(error);

  try {
    await safeUpsert({
      table: 'business_audit_log',
      data: {
        entity_id: key,
        entity_type: 'integration_event',
        event_type: 'INTEGRATION_EVENT_FAILED',
        payload: {
          eventId,
          eventName,
          handlerName,
          status: 'failed',
          lastError: errorMessage,
          failedAt: new Date().toISOString(),
        },
      },
      conflictKey: 'entity_id',
    });
  } catch (err) {
    console.warn('[Integration] Error recording event failure:', err);
  }
}

// ─── Order Context Orchestration ──────────────────────────────────────────────

/**
 * Xử lý khi đơn hàng được xác nhận:
 * - Đặt trạng thái phân bổ kho `inventory_allocation_status = 'pending'`
 * - Ghi nhận Audit Log
 */
export async function handleOrderConfirmedIntegration(
  event: SafeDomainEvent<OrderConfirmedEvent>,
): Promise<void> {
  const handlerName = 'OrderConfirmed -> Inventory Allocation Required';
  const { eventId, eventName, payload } = event;

  if (await isEventHandled(eventId, handlerName)) {
    console.info(
      `[Integration] Skipping duplicate event ${eventId} for ${handlerName}`,
    );
    return;
  }

  await recordEventStart(eventId, eventName, handlerName, payload);

  try {
    // 1. Ghi nhận audit trail cho đơn hàng
    await safeUpsert({
      table: 'business_audit_log',
      data: {
        entity_id: payload.orderId,
        entity_type: 'orders',
        event_type: 'ORDER_CONFIRMED_ALLOCATION_REQUIRED',
        payload: {
          orderNumber: payload.orderNumber,
          customerId: payload.customerId,
          allocationStatus: 'pending',
          confirmedAt: payload.confirmedAt || event.timestamp,
        },
      },
      conflictKey: 'id',
    });

    await recordEventSuccess(eventId, eventName, handlerName, {
      orderId: payload.orderId,
      allocationStatus: 'pending',
    });
  } catch (err) {
    await recordEventFailure(eventId, eventName, handlerName, err);
    throw err;
  }
}

// ─── Shipment Context Orchestration ───────────────────────────────────────────

/**
 * Xử lý khi lô hàng được xuất kho (ShipmentShippedEvent):
 * - Chuyển trạng thái các cuộn vải liên kết từ `reserved` sang `shipped`
 * - Ghi nhận Audit Log xuất kho
 */
export async function handleShipmentShippedIntegration(
  event: SafeDomainEvent<ShipmentShippedEvent>,
): Promise<void> {
  const handlerName = 'ShipmentShipped -> Mark Allocated Rolls as Shipped';
  const { eventId, eventName, payload } = event;

  if (await isEventHandled(eventId, handlerName)) {
    console.info(
      `[Integration] Skipping duplicate event ${eventId} for ${handlerName}`,
    );
    return;
  }

  await recordEventStart(eventId, eventName, handlerName, payload);

  try {
    const rollIds = payload.rollIds || [];
    if (rollIds.length > 0) {
      const { error: updateError } = await supabase
        .from('finished_fabric_rolls')
        .update({
          status: 'shipped',
        })
        .in('id', rollIds);

      if (updateError) {
        throw new Error(updateError.message);
      }
    }

    // Ghi nhận audit log cho lô hàng
    await safeUpsert({
      table: 'business_audit_log',
      data: {
        entity_id: payload.shipmentId,
        entity_type: 'shipments',
        event_type: 'SHIPMENT_ROLLS_SHIPPED',
        payload: {
          shipmentNumber: payload.shipmentNumber,
          orderId: payload.orderId,
          rollsCount: rollIds.length,
          shippedRollIds: rollIds,
          shippedAt: payload.shippedAt,
        },
      },
      conflictKey: 'id',
    });

    await recordEventSuccess(eventId, eventName, handlerName, {
      shipmentId: payload.shipmentId,
      updatedRollsCount: rollIds.length,
    });
  } catch (err) {
    await recordEventFailure(eventId, eventName, handlerName, err);
    throw err;
  }
}

// ─── Production / MES Context Orchestration ───────────────────────────────────

/**
 * Xử lý khi nhận vải mộc mới (FabricReceivedEvent):
 * - Tìm các Work Orders đang ở trạng thái 'planned' hoặc 'draft'
 * - Dùng MaterialMatchingEngine đánh giá mức độ sẵn sàng nguyên liệu
 * - Ghi nhận kết quả và phát sinh MaterialAvailableEvent nếu có WO đủ điều kiện
 */
export async function handleFabricReceivedIntegration(
  event: SafeDomainEvent<FabricReceivedEvent>,
): Promise<void> {
  const handlerName = 'FabricReceived -> Material Availability Evaluation';
  const { eventId, eventName, payload } = event;

  if (await isEventHandled(eventId, handlerName)) {
    console.info(
      `[Integration] Skipping duplicate event ${eventId} for ${handlerName}`,
    );
    return;
  }

  await recordEventStart(eventId, eventName, handlerName, payload);

  try {
    // 1. Fetch danh sách Work Orders đang chờ nguyên liệu
    const { data: rawWOs, error: woError } = await supabase
      .from('work_orders')
      .select(
        `
        id,
        work_order_number,
        target_quantity,
        target_unit,
        target_weight_kg,
        status,
        bom_template:bom_templates(
          id,
          target_fabric:fabric_catalogs(id, code, name)
        )
      `,
      )
      .in('status', ['draft', 'yarn_issued', 'in_progress'])
      .limit(50);

    if (woError) throw woError;

    const pendingDemands: WorkOrderDemand[] = (rawWOs || []).map((wo) => {
      const bomTpl = wo.bom_template as {
        id?: string;
        target_fabric?: { id?: string; code?: string; name?: string };
      } | null;

      const targetKg = wo.target_weight_kg || wo.target_quantity || 0;
      return {
        workOrderId: wo.id,
        workOrderNumber: wo.work_order_number,
        fabricType:
          bomTpl?.target_fabric?.name ||
          bomTpl?.target_fabric?.code ||
          undefined,
        color: undefined,
        targetQuantityKg: targetKg,
        allocatedKg: 0,
        missingKg: targetKg,
      };
    });

    const incomingSpec: IncomingMaterialSpec = {
      materialId: payload.materialId,
      fabricType: payload.fabricType,
      color: payload.color,
      gsm: payload.gsm,
      quantityKg: payload.totalWeight || 0,
    };

    // 2. Chạy Material Matching Engine (Pure Domain Evaluation)
    const evaluation = evaluateMaterialMatching(incomingSpec, pendingDemands);

    // 3. Ghi nhận audit và phát sinh Event cho các WO khả dụng
    for (const match of evaluation.matchedWorkOrders) {
      if (
        match.matchStatus === 'ready_to_start' ||
        match.matchStatus === 'partially_available'
      ) {
        DomainEventBus.publish({
          eventName: 'MaterialAvailableEvent',
          timestamp: new Date().toISOString(),
          producer: 'IntegrationLayer',
          payload: {
            workOrderId: match.workOrderId,
            workOrderNumber: match.workOrderNumber,
            fabricType: match.fabricType,
            color: match.color,
            requiredKg: match.requiredKg,
            availableKg: match.matchedKg,
            status: match.matchStatus,
          },
        });
      }
    }

    // 4. Lưu vết Audit log
    await safeUpsert({
      table: 'business_audit_log',
      data: {
        entity_id: payload.receiptId,
        entity_type: 'raw_fabric_receipts',
        event_type: 'MES_MATERIAL_EVALUATION_COMPLETED',
        payload: {
          receiptId: payload.receiptId,
          incomingKg: evaluation.incomingKg,
          matchedWOCount: evaluation.matchedWorkOrders.length,
          readyCount: evaluation.readyWorkOrderCount,
          partialCount: evaluation.partialWorkOrderCount,
        },
      },
      conflictKey: 'id',
    });

    await recordEventSuccess(eventId, eventName, handlerName, {
      readyWorkOrderCount: evaluation.readyWorkOrderCount,
      partialWorkOrderCount: evaluation.partialWorkOrderCount,
    });
  } catch (err) {
    await recordEventFailure(eventId, eventName, handlerName, err);
    throw err;
  }
}
