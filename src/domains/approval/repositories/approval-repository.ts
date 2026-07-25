import { untypedDb } from '@/services/supabase/untyped';
import { safeUpsertOne } from '@/lib/db-guard';
import {
  ApprovalRequest,
  ApprovalStep,
  ApprovalHistory,
} from '@/domains/approval/models/types';

export class ApprovalRepository {
  static async getRequestById(id: string): Promise<ApprovalRequest | null> {
    const { data, error } = await untypedDb
      .from('approval_requests')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error)
      throw new Error(
        `[ApprovalRepository] getRequestById failed: ${error.message}`,
      );
    return data as ApprovalRequest | null;
  }

  static async getRequestByResource(
    resourceType: string,
    resourceId: string,
  ): Promise<ApprovalRequest | null> {
    const { data, error } = await untypedDb
      .from('approval_requests')
      .select('*')
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error)
      throw new Error(
        `[ApprovalRepository] getRequestByResource failed: ${error.message}`,
      );
    return data as ApprovalRequest | null;
  }

  static async saveRequest(
    request: Partial<ApprovalRequest> & { id: string },
  ): Promise<ApprovalRequest> {
    return (await safeUpsertOne({
      table: 'approval_requests',
      data: request,
      conflictKey: 'id',
    })) as ApprovalRequest;
  }

  static async getStepsByRequestId(requestId: string): Promise<ApprovalStep[]> {
    const { data, error } = await untypedDb
      .from('approval_steps')
      .select('*')
      .eq('request_id', requestId)
      .order('step_order', { ascending: true });

    if (error)
      throw new Error(
        `[ApprovalRepository] getStepsByRequestId failed: ${error.message}`,
      );
    return (data as ApprovalStep[]) || [];
  }

  static async saveStep(
    step: Partial<ApprovalStep> & { id: string },
  ): Promise<ApprovalStep> {
    return (await safeUpsertOne({
      table: 'approval_steps',
      data: step,
      conflictKey: 'id',
    })) as ApprovalStep;
  }

  static async saveSteps(
    steps: (Partial<ApprovalStep> & { id: string })[],
  ): Promise<void> {
    for (const step of steps) {
      await this.saveStep(step);
    }
  }

  static async executeTransaction(
    requests: Partial<ApprovalRequest>[],
    steps: Partial<ApprovalStep>[],
    histories: Partial<ApprovalHistory>[],
    outboxEvents: Partial<
      import('@/domains/approval/models/types').ApprovalOutboxEvent
    >[],
  ): Promise<void> {
    const { error } = await untypedDb.rpc('rpc_execute_approval_transaction', {
      p_requests: requests,
      p_steps: steps,
      p_histories: histories,
      p_outbox_events: outboxEvents,
    });
    if (error) {
      throw new Error(
        `[ApprovalRepository] executeTransaction failed: ${error.message}`,
      );
    }
  }
}
