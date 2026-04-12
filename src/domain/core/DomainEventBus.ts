export interface DomainEvent {
  eventName: string;
  timestamp: string;
  payload: unknown;
}

export type EventHandler<T extends DomainEvent> = (
  event: T,
) => void | Promise<void>;

class DomainEventBusClass {
  private handlers: Map<
    string,
    Array<(event: DomainEvent) => void | Promise<void>>
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
      event: DomainEvent,
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
   */
  publish<T extends DomainEvent>(event: T) {
    const handlers = this.handlers.get(event.eventName) ?? [];
    // Chạy bất đồng bộ để không block UI/Luồng chính
    setTimeout(() => {
      handlers.forEach((handler) => {
        try {
          const result = handler(event);
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
