import { untypedDb } from '@/services/supabase/untyped';
import { safeUpsertOne } from '@/lib/db-guard';
import { ApprovalHistory } from '@/domains/approval/models/types';

export interface HistoryFilterOptions {
  resourceType?: string;
  eventType?: string;
  limit?: number;
}

export interface ApprovalHistoryWithRequest extends ApprovalHistory {
  request?: {
    resource_type: string;
    resource_id: string;
    status: string;
  } | null;
}

export class HistoryRepository {
  static async appendEvent(
    history: Omit<ApprovalHistory, 'id' | 'created_at'>,
  ): Promise<ApprovalHistory> {
    return (await safeUpsertOne({
      table: 'approval_histories',
      data: {
        id: crypto.randomUUID(),
        ...history,
      },
      conflictKey: 'id',
    })) as ApprovalHistory;
  }

  static async getHistoryByRequestId(
    requestId: string,
  ): Promise<ApprovalHistory[]> {
    const { data, error } = await untypedDb
      .from('approval_histories')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true });

    if (error)
      throw new Error(
        `[HistoryRepository] getHistoryByRequestId failed: ${error.message}`,
      );
    return (data as ApprovalHistory[]) || [];
  }

  static async getAllHistories(
    options: HistoryFilterOptions = {},
  ): Promise<ApprovalHistoryWithRequest[]> {
    let query = untypedDb
      .from('approval_histories')
      .select(
        '*, request:approval_requests(resource_type, resource_id, status)',
      )
      .order('created_at', { ascending: false });

    if (options.eventType && options.eventType !== 'ALL') {
      query = query.eq('event_type', options.eventType);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    } else {
      query = query.limit(100);
    }

    const { data, error } = await query;
    if (error)
      throw new Error(
        `[HistoryRepository] getAllHistories failed: ${error.message}`,
      );

    let list = (data as ApprovalHistoryWithRequest[]) || [];
    if (options.resourceType && options.resourceType !== 'ALL') {
      list = list.filter(
        (item) => item.request?.resource_type === options.resourceType,
      );
    }

    return list;
  }
}
