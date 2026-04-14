import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';

import { DomainEventBus } from '@/domain/core/DomainEventBus';
import { supabase } from '@/services/supabase/client';

export class RealtimeListenerService {
  private static instance: RealtimeListenerService;
  private channel: RealtimeChannel | null = null;
  private initialized = false;

  private constructor() {}

  public static getInstance(): RealtimeListenerService {
    if (!RealtimeListenerService.instance) {
      RealtimeListenerService.instance = new RealtimeListenerService();
    }
    return RealtimeListenerService.instance;
  }

  /**
   * Khởi tạo kết nối Realtime Channel cho phân hệ ERP Receivables (Công nợ).
   */
  public initialize() {
    if (this.initialized) return;

    // Kênh ERP Receivables dùng chung cho Accounts Receivable
    this.channel = supabase.channel('erp:receivables');

    this.channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customer_debt',
        },
        (payload) => {
          this.handleReceivableChanges(payload);
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'debt_transactions',
        },
        (payload) => {
          // Bất kỳ biến động Transaction nào cũng trigger Re-check nợ chung
          this.handleReceivableChanges(payload);
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.info('🟢 [RealtimeService] Subscribed to erp:receivables');
        }
      });

    this.initialized = true;
  }

  /**
   * Chuẩn hóa Supabase WAL Payload thành App Domain Event và bắn vào Internal Bus
   */
  private handleReceivableChanges(
    payload: RealtimePostgresChangesPayload<{
      id?: string;
      customer_id?: string;
      [key: string]: unknown;
    }>,
  ) {
    const eventType = payload.eventType;
    const table = payload.table;
    const newRecord = 'new' in payload ? payload.new : undefined;
    const oldRecord = 'old' in payload ? payload.old : undefined;

    // Tùy theo bảng, ta xác định customerId để invalidation có mục tiêu (Granular)
    let customerId = '';
    let entityId = '';

    const fallbackRecord = (newRecord || oldRecord || {}) as Record<
      string,
      unknown
    >;

    if (table === 'customer_debt') {
      customerId = (fallbackRecord.customer_id as string) || '';
      entityId = (fallbackRecord.id as string) || '';
    } else if (table === 'debt_transactions') {
      customerId = (fallbackRecord.customer_id as string) || '';
      entityId = (fallbackRecord.id as string) || '';
    }

    if (!customerId) return;

    const eventPayload = {
      entityId,
      customerId,
    };

    switch (eventType) {
      case 'INSERT':
        DomainEventBus.publish({
          eventName: 'ReceivableCreatedEvent',
          payload: eventPayload,
          timestamp: new Date().toISOString(),
        });
        break;
      case 'UPDATE':
        DomainEventBus.publish({
          eventName: 'ReceivableUpdatedEvent',
          payload: eventPayload,
          timestamp: new Date().toISOString(),
        });
        break;
      case 'DELETE':
        DomainEventBus.publish({
          eventName: 'ReceivableDeletedEvent',
          payload: eventPayload,
          timestamp: new Date().toISOString(),
        });
        break;
    }
  }

  public cleanup() {
    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
      this.initialized = false;
    }
  }
}

// Export singleton instance convenience function
export const realtimeService = RealtimeListenerService.getInstance();
