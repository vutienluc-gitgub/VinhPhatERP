import { ApprovalEvent } from '@/domains/approval/models/types';

export type ApprovalEventType =
  | 'ApprovalSubmitted'
  | 'ApprovalApproved'
  | 'ApprovalRejected'
  | 'ApprovalCancelled'
  | 'ApprovalStepApproved';

export interface DomainEventHandler {
  (event: ApprovalEvent): Promise<void> | void;
}

export interface IDomainEventPublisher {
  publish(event: ApprovalEvent): Promise<void>;
  subscribe(
    eventType: ApprovalEvent['event_type'],
    handler: DomainEventHandler,
  ): void;
}

/**
 * MVP In-Memory Implementation
 * In a future phase, this will be replaced with an Outbox Pattern or Message Queue (Kafka/RabbitMQ/Supabase Realtime).
 */
export class InMemoryDomainEventPublisher implements IDomainEventPublisher {
  private handlers: Record<string, DomainEventHandler[]> = {};

  async publish(event: ApprovalEvent): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(
      `[DomainEventPublisher] Emitting ${event.event_type} for Request ${event.request.id}`,
    );

    const eventHandlers = this.handlers[event.event_type] || [];

    // Execute handlers asynchronously (fire and forget) so we don't block the approval engine transaction
    Promise.allSettled(eventHandlers.map((handler) => handler(event))).then(
      (results) => {
        results.forEach((result, idx) => {
          if (result.status === 'rejected') {
            // eslint-disable-next-line no-console
            console.error(
              `[DomainEventPublisher] Handler ${idx} failed for ${event.event_type}:`,
              result.reason,
            );
          }
        });
      },
    );
  }

  subscribe(
    eventType: ApprovalEvent['event_type'],
    handler: DomainEventHandler,
  ): void {
    if (!this.handlers[eventType]) {
      this.handlers[eventType] = [];
    }
    this.handlers[eventType].push(handler);
  }
}

// Singleton instance for MVP
export const eventPublisher = new InMemoryDomainEventPublisher();
