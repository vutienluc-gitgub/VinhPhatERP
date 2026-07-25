import { untypedDb } from '@/services/supabase/untyped';
import {
  ApprovalOutboxEvent,
  ApprovalEvent,
  ApprovalRequest,
  ApprovalHistory,
} from '@/domains/approval/models/types';

import { eventPublisher } from './domain-event-publisher';

export class OutboxWorker {
  static async processPendingEvents(): Promise<void> {
    // 1. Fetch pending events
    const { data: events, error } = await untypedDb
      .from('approval_outbox_events')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(50);

    if (error || !events || events.length === 0) return;

    // 2. Process each event
    for (const event of events as ApprovalOutboxEvent[]) {
      try {
        await eventPublisher.publish({
          event_type: event.event_type as ApprovalEvent['event_type'],
          request: event.payload.request as ApprovalRequest,
          history: event.payload.history as ApprovalHistory,
        });

        await untypedDb
          .from('approval_outbox_events')
          .update({
            status: 'processed',
            processed_at: new Date().toISOString(),
          })
          .eq('id', event.id);
      } catch (err) {
        await untypedDb
          .from('approval_outbox_events')
          .update({ status: 'failed', error_message: String(err) })
          .eq('id', event.id);
      }
    }
  }
}
