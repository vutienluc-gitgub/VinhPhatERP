import { untypedDb } from '@/services/supabase/untyped';
import { safeUpsertOne } from '@/lib/db-guard';
import { ApprovalHistory } from '@/domains/approval/models/types';

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
}
