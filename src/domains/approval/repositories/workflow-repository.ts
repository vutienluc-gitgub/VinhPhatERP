import { untypedDb } from '@/services/supabase/untyped';
import {
  ApprovalWorkflow,
  ApprovalWorkflowStep,
} from '@/domains/approval/models/types';
import { safeUpsert } from '@/lib/db-guard';

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
    const data = (await safeUpsert({
      table: 'approval_workflows',
      data: workflow,
      conflictKey: 'id',
    })) as ApprovalWorkflow[];

    if (!data[0]) throw new Error('Failed to save workflow');
    return data[0];
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
      await safeUpsert({
        table: 'approval_workflow_steps',
        data: steps,
        conflictKey: 'id',
      });
    }
  }

  static async seedDefaultWorkflowsIfEmpty(): Promise<ApprovalWorkflow[]> {
    const existing = await this.getAllWorkflows();
    if (existing.length > 0) return existing;

    const defaultDefs = [
      {
        workflow_key: 'PO_STANDARD',
        name: 'Quy trình duyệt Đơn mua hàng (PO)',
        description: 'Phê duyệt đơn đặt hàng mua sợi, phụ liệu và hóa chất',
        steps: [
          {
            role: 'manager',
            step_order: 1,
            description: 'Trưởng bộ phận Thu mua / Quản lý xưởng xác nhận',
            sla_hours: 24,
            escalation_action: 'notify',
            escalation_role: 'admin',
          },
          {
            role: 'admin',
            step_order: 2,
            description: 'Ban Giám đốc phê duyệt thanh toán & cam kết hợp đồng',
            sla_hours: 48,
            escalation_action: 'notify',
            escalation_role: 'admin',
          },
        ],
      },
      {
        workflow_key: 'PR_STANDARD',
        name: 'Quy trình duyệt Yêu cầu mua vật tư (PR)',
        description: 'Phê duyệt phiếu đề xuất mua sắm vật tư từ các phân xưởng',
        steps: [
          {
            role: 'manager',
            step_order: 1,
            description: 'Quản đốc xưởng dệt/nhuộm duyệt nhu cầu thực tế',
            sla_hours: 12,
            escalation_action: 'notify',
            escalation_role: 'admin',
          },
          {
            role: 'staff',
            step_order: 2,
            description: 'Chuyên viên Mua hàng tiếp nhận và lập RFQ',
            sla_hours: 24,
            escalation_action: 'notify',
            escalation_role: 'manager',
          },
        ],
      },
      {
        workflow_key: 'EXPENSE_STANDARD',
        name: 'Quy trình duyệt Chi tiêu & Tạm ứng',
        description:
          'Phê duyệt các khoản đề xuất chi tiêu nội bộ và thanh toán công tác phí',
        steps: [
          {
            role: 'manager',
            step_order: 1,
            description: 'Trưởng phòng ban ký duyệt dự toán',
            sla_hours: 24,
            escalation_action: 'notify',
            escalation_role: 'admin',
          },
          {
            role: 'admin',
            step_order: 2,
            description:
              'Kế toán trưởng / Giám đốc phê duyệt xuất quỹ tiền mặt',
            sla_hours: 48,
            escalation_action: 'notify',
            escalation_role: 'admin',
          },
        ],
      },
    ];

    const created: ApprovalWorkflow[] = [];
    for (const def of defaultDefs) {
      const wfId = crypto.randomUUID();
      const savedWf = await this.saveWorkflow({
        id: wfId,
        workflow_key: def.workflow_key,
        version: 1,
        name: def.name,
        description: def.description,
        is_active: true,
      });

      const stepsPayload = def.steps.map((s) => ({
        id: crypto.randomUUID(),
        workflow_id: savedWf.id,
        role: s.role,
        step_order: s.step_order,
        description: s.description,
        is_parallel: false,
        conditions: {},
        sla_hours: s.sla_hours,
        escalation_action: s.escalation_action as 'notify',
        escalation_role: s.escalation_role,
      }));

      await this.saveWorkflowSteps(savedWf.id, stepsPayload);
      created.push(savedWf);
    }

    return created;
  }
}
