export interface DomainEvent {
  eventId?: string;
  eventName: string;
  timestamp?: string;
  producer?: string;
  payload: unknown;
}

export type SafeDomainEvent<T extends DomainEvent = DomainEvent> = T & {
  eventId: string;
  timestamp: string;
};

export type EventHandler<T extends DomainEvent> = (
  event: SafeDomainEvent<T>,
) => void | Promise<void>;

/**
 * Factory helper để tạo một Domain Event với eventId và timestamp chuẩn.
 */
export function createDomainEvent<T extends DomainEvent>(
  eventName: T['eventName'],
  payload: T['payload'],
  producer?: string,
): SafeDomainEvent<T> {
  return {
    eventId: crypto.randomUUID(),
    eventName,
    timestamp: new Date().toISOString(),
    producer,
    payload,
  } as SafeDomainEvent<T>;
}

class DomainEventBusClass {
  private handlers: Map<
    string,
    Array<(event: SafeDomainEvent) => void | Promise<void>>
  > = new Map();

  /**
   * Đăng ký lắng nghe một Domain Event.
   * @returns Hàm unsubscribe để huỷ đăng ký.
   */
  subscribe<T extends DomainEvent>(
    eventName: T['eventName'],
    handler: EventHandler<T>,
  ): () => void {
    const currentHandlers = this.handlers.get(eventName) ?? [];
    const safeHandler = handler as unknown as (
      event: SafeDomainEvent,
    ) => void | Promise<void>;
    this.handlers.set(eventName, [...currentHandlers, safeHandler]);

    return () => {
      this.unsubscribe(eventName, handler);
    };
  }

  /**
   * Bỏ lắng nghe.
   */
  private unsubscribe<T extends DomainEvent>(
    eventName: T['eventName'],
    handler: EventHandler<T>,
  ) {
    const currentHandlers = this.handlers.get(eventName);
    if (!currentHandlers) return;

    this.handlers.set(
      eventName,
      currentHandlers.filter((h) => h !== (handler as unknown)),
    );
  }

  /**
   * Publish (Bắn) một Domain Event đi toàn hệ thống.
   * Tự động chuẩn hóa eventId và timestamp nếu chưa có.
   */
  publish<T extends DomainEvent>(event: T) {
    const safeEvent: SafeDomainEvent<T> = {
      ...event,
      eventId: event.eventId || crypto.randomUUID(),
      timestamp: event.timestamp || new Date().toISOString(),
    };

    const handlers = this.handlers.get(event.eventName) ?? [];
    // Chạy bất đồng bộ để không block UI/Luồng chính
    setTimeout(() => {
      handlers.forEach((handler) => {
        try {
          const result = handler(safeEvent as SafeDomainEvent);
          if (result instanceof Promise) {
            result.catch((err) => {
              console.error(
                `[EventBus] Error handling ${event.eventName}:`,
                err,
              );
            });
          }
        } catch (err) {
          console.error(
            `[EventBus] Error in synchronous handler for ${event.eventName}:`,
            err,
          );
        }
      });
    }, 0);
  }
}

export const DomainEventBus = new DomainEventBusClass();
