/**
 * Integration Layer v2 — Event-Driven Workflow Foundation.
 *
 * File này là "nhạc trưởng" (Orchestrator) duy nhất trong hệ thống.
 * Nó lắng nghe Domain Events từ EventBus và điều phối hành động
 * giữa các Bounded Contexts mà KHÔNG để chúng phụ thuộc chéo vào nhau.
 *
 * Nguyên tắc kiến trúc:
 * 1. Single Source of Truth: Mỗi business fact chỉ có một nơi chịu trách nhiệm chính.
 * 2. Decoupled Handlers: Không import chéo giữa các features.
 * 3. Idempotency & Failure Handling: Tích hợp qua integration.service.
 * 4. Không chứa domain calculation logic (chỉ orchestrate).
 */

import {
  DomainEventBus,
  type DomainEvent,
  type SafeDomainEvent,
} from '@/domain/core/DomainEventBus';
import type {
  OrderConfirmedEvent,
  ShipmentShippedEvent,
  FabricReceivedEvent,
} from '@/domain/events/app.events';

import {
  handleOrderConfirmedIntegration,
  handleShipmentShippedIntegration,
  handleFabricReceivedIntegration,
} from './integration.service';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * IntegrationHandler — Một bộ xử lý tích hợp được đăng ký.
 * Lưu lại unsubscribe để hỗ trợ cleanup khi cần (testing, HMR).
 */
interface RegisteredHandler {
  eventName: string;
  description: string;
  unsubscribe: () => void;
}

// ─── Registry ─────────────────────────────────────────────────────────────────

const registeredHandlers: RegisteredHandler[] = [];
let integrationsInitialized = false;

function registerHandler<T extends DomainEvent>(
  eventName: T['eventName'],
  description: string,
  handler: (event: SafeDomainEvent<T>) => void | Promise<void>,
) {
  const unsubscribe = DomainEventBus.subscribe<T>(eventName, handler as never);
  registeredHandlers.push({
    eventName,
    description,
    unsubscribe,
  });
}

export function initIntegration() {
  if (integrationsInitialized) {
    return;
  }

  // ─── Workflow 1: Order → Inventory Allocation Required ──────────────────────

  /**
   * Khi đơn hàng được xác nhận (OrderConfirmedEvent):
   * - Ghi nhận Audit trail ORDER_CONFIRMED
   * - Đặt trạng thái phân bổ kho: inventory_allocation_status = 'pending'
   * - Chuẩn bị để người dùng chọn cuộn vải thủ công (không tự động gán roll mù quáng).
   */
  registerHandler<OrderConfirmedEvent>(
    'OrderConfirmedEvent',
    'Order → Inventory: Khởi tạo yêu cầu phân bổ kho khi đơn hàng xác nhận',
    async (event) => {
      try {
        console.info(
          `[Integration] OrderConfirmed → Setting allocation pending for order ${event.payload.orderNumber}`,
        );
        await handleOrderConfirmedIntegration(event);
      } catch (err) {
        console.error('[Integration] Error in OrderConfirmed handler:', err);
      }
    },
  );

  // ─── Workflow 2: Shipment → Mark Allocated Rolls as Shipped ─────────────────

  /**
   * Khi lô hàng thực tế được xuất kho (ShipmentShippedEvent):
   * - Chuyển trạng thái các cuộn vải liên kết từ 'reserved' sang 'shipped'.
   * - Ghi nhận Audit trail xuất kho.
   * - Lưu ý: Công nợ được đồng bộ tự động qua DB Trigger của shipments (không duplicate tại đây).
   */
  registerHandler<ShipmentShippedEvent>(
    'ShipmentShippedEvent',
    'Shipment → Inventory: Chuyển trạng thái cuộn vải sang shipped khi lô hàng xuất kho',
    async (event) => {
      try {
        console.info(
          `[Integration] ShipmentShipped → Marking rolls as shipped for shipment ${event.payload.shipmentNumber}`,
        );
        await handleShipmentShippedIntegration(event);
      } catch (err) {
        console.error('[Integration] Error in ShipmentShipped handler:', err);
      }
    },
  );

  // ─── Workflow 3: Inventory → MES Material Availability Evaluation ───────────

  /**
   * Khi nhận vải mộc mới vào kho (FabricReceivedEvent):
   * - Đánh giá nhu cầu nguyên liệu của các Work Orders đang chờ (MaterialMatchingEngine).
   * - Phân loại trạng thái khả dụng: READY_TO_START / PARTIALLY_AVAILABLE / WAITING_MATERIAL.
   * - Phát sinh MaterialAvailableEvent cho các Work Orders sẵn sàng.
   */
  registerHandler<FabricReceivedEvent>(
    'FabricReceivedEvent',
    'Inventory → MES: Đánh giá khả năng đáp ứng nguyên liệu cho các Work Orders đang chờ',
    async (event) => {
      try {
        console.info(
          `[Integration] FabricReceived → Evaluating material demand for ${event.payload.rollsCount} rolls (${event.payload.totalWeight}kg)`,
        );
        await handleFabricReceivedIntegration(event);
      } catch (err) {
        console.error('[Integration] Error in FabricReceived handler:', err);
      }
    },
  );

  integrationsInitialized = true;
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

/**
 * Trả về danh sách handlers đã đăng ký (để debug/monitoring).
 */
export function getRegisteredIntegrations(): ReadonlyArray<{
  eventName: string;
  description: string;
}> {
  return registeredHandlers.map(({ eventName, description }) => ({
    eventName,
    description,
  }));
}

/**
 * Huỷ tất cả handlers (dùng trong testing hoặc HMR cleanup).
 */
export function teardownIntegrations() {
  registeredHandlers.forEach((h) => h.unsubscribe());
  registeredHandlers.length = 0;
  integrationsInitialized = false;
}
