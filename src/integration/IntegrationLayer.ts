/**
 * Integration Layer — Tầng tích hợp giữa các Bounded Contexts.
 *
 * File này là "nhạc trưởng" (Orchestrator) duy nhất trong hệ thống.
 * Nó lắng nghe Domain Events từ EventBus và điều phối hành động
 * giữa các Context mà KHÔNG để chúng biết về nhau.
 *
 * Quy tắc:
 * 1. KHÔNG chứa business logic — chỉ điều phối (orchestrate).
 * 2. KHÔNG import trực tiếp từ @/features — chỉ dùng @/api và @/domain.
 * 3. Mỗi handler là một "Saga" hoặc "Policy" nhỏ gọn.
 * 4. Luôn có try/catch — lỗi ở Saga KHÔNG được crash app.
 */

import { DomainEventBus } from '@/domain/core/DomainEventBus';
import type {
  OrderConfirmedEvent,
  OrderCompletedEvent,
  FabricReceivedEvent,
} from '@/domain/events/app.events';

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

function registerHandler<
  T extends { eventName: string; timestamp: string; payload: unknown },
>(
  eventName: T['eventName'],
  description: string,
  handler: (event: T) => void | Promise<void>,
) {
  const unsubscribe = DomainEventBus.subscribe<T>(eventName, handler);
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

  // ─── Saga: Order → Inventory ────────────────────────────────────────────────

  /**
   * Khi đơn hàng được xác nhận (OrderConfirmedEvent):
   * - Tạo 7 công đoạn tiến độ tự động (đã có DB Trigger).
   * - Thông báo Inventory Context chuẩn bị giữ cuộn vải.
   * - Log sự kiện vào Audit trail.
   *
   * Hiện tại: Log và chuẩn bị hook point cho tương lai.
   * Khi hệ thống scale, thay console.log bằng API call thực tế.
   */
  registerHandler<OrderConfirmedEvent>(
    'OrderConfirmedEvent',
    'Order → Inventory: Chuẩn bị giữ kho khi đơn hàng xác nhận',
    (event) => {
      console.info(
        `[Integration] OrderConfirmed → Preparing inventory reservation for order ${event.payload.orderNumber}`,
      );
      // TODO: Gọi API giữ cuộn vải khi sẵn sàng
      // await reserveRollsForOrder(event.payload.orderId);
    },
  );

  // ─── Saga: Order → Shipments ────────────────────────────────────────────────

  /**
   * Khi đơn hàng hoàn thành (OrderCompletedEvent):
   * - Đánh dấu tất cả cuộn vải liên quan đã xuất kho (shipped).
   * - Cập nhật công nợ khách hàng.
   */
  registerHandler<OrderCompletedEvent>(
    'OrderCompletedEvent',
    'Order → Payments: Cập nhật công nợ khi đơn hàng hoàn thành',
    (event) => {
      console.info(
        `[Integration] OrderCompleted → Finalizing payments for order ${event.payload.orderId}`,
      );
      // TODO: Gọi API cập nhật trạng thái thanh toán
      // await finalizeOrderPayments(event.payload.orderId);
    },
  );

  // ─── Saga: Inventory → Production ───────────────────────────────────────────

  /**
   * Khi nhận vải mộc mới (FabricReceivedEvent):
   * - Cập nhật tồn kho tổng.
   * - Kiểm tra xem có Work Order nào đang chờ nguyên liệu không.
   */
  registerHandler<FabricReceivedEvent>(
    'FabricReceivedEvent',
    'Inventory → Production: Kiểm tra Work Order chờ nguyên liệu',
    (event) => {
      console.info(
        `[Integration] FabricReceived → ${event.payload.rollsCount} rolls (${event.payload.totalWeight}kg) received. Checking pending work orders...`,
      );
      // TODO: Gọi API kiểm tra Work Orders đang thiếu nguyên liệu
      // await checkPendingWorkOrders(event.payload.receiptId);
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
