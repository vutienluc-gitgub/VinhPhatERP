import { untypedDb } from '@/services/supabase/untyped';
import {
  ApprovalWorkflow,
  ApprovalWorkflowStep,
} from '@/domains/approval/models/types';

export class WorkflowRepository {
  static async getActiveWorkflow(
    workflowKey: string,
  ): Promise<ApprovalWorkflow | null> {
    const { data, error } = await untypedDb
      .from('approval_workflows')
      .select('*')
      .eq('workflow_key', workflowKey)
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error)
      throw new Error(
        `[WorkflowRepository] getActiveWorkflow failed: ${error.message}`,
      );
    return data as ApprovalWorkflow | null;
  }

  static async getWorkflowSteps(
    workflowId: string,
  ): Promise<ApprovalWorkflowStep[]> {
    const { data, error } = await untypedDb
      .from('approval_workflow_steps')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('step_order', { ascending: true });

    if (error)
      throw new Error(
        `[WorkflowRepository] getWorkflowSteps failed: ${error.message}`,
      );
    return (data as ApprovalWorkflowStep[]) || [];
  }

  static async getAllWorkflows(): Promise<ApprovalWorkflow[]> {
    const { data, error } = await untypedDb
      .from('approval_workflows')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error)
      throw new Error(
        `[WorkflowRepository] getAllWorkflows failed: ${error.message}`,
      );
    return (data as ApprovalWorkflow[]) || [];
  }

  static async getWorkflowById(id: string): Promise<ApprovalWorkflow | null> {
    const { data, error } = await untypedDb
      .from('approval_workflows')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error)
      throw new Error(
        `[WorkflowRepository] getWorkflowById failed: ${error.message}`,
      );
    return data as ApprovalWorkflow | null;
  }

  static async saveWorkflow(
    workflow: Partial<ApprovalWorkflow> & { id: string },
  ): Promise<ApprovalWorkflow> {
    const { data, error } = await untypedDb
      .from('approval_workflows')
      .upsert(workflow)
      .select('*')
      .single();

    if (error)
      throw new Error(
        `[WorkflowRepository] saveWorkflow failed: ${error.message}`,
      );
    return data as ApprovalWorkflow;
  }

  static async saveWorkflowSteps(
    workflowId: string,
    steps: (Partial<ApprovalWorkflowStep> & { id: string })[],
  ): Promise<void> {
    // Basic approach: delete old steps, insert new ones.
    // In a production system we might want to do this in an RPC transaction to be safe.
    await untypedDb
      .from('approval_workflow_steps')
      .delete()
      .eq('workflow_id', workflowId);

    if (steps.length > 0) {
      const { error } = await untypedDb
        .from('approval_workflow_steps')
        .insert(steps);
      if (error)
        throw new Error(
          `[WorkflowRepository] saveWorkflowSteps failed: ${error.message}`,
        );
    }
  }
}
