import { ApprovalStatus } from '@/domains/approval/models/constants';

export interface WorkflowSnapshot {
  workflow_key: string;
  version: number;
  name: string;
}

export interface ApproverSnapshot {
  id: string;
  name: string;
  role: string;
  email?: string;
}

export interface ApprovalSnapshotData {
  document: Record<string, unknown>;
  workflow: WorkflowSnapshot;
  approvers: Record<string, ApproverSnapshot[]>; // mapping of role to assigned approvers, if any
  metadata: Record<string, unknown>;
}

export interface ApprovalRequest {
  id: string;
  resource_type: string;
  resource_id: string;
  resource_version: string | null;
  workflow_id: string;
  workflow_version: number;
  status: ApprovalStatus;
  snapshot_data: ApprovalSnapshotData;
  row_version: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApprovalWorkflow {
  id: string;
  workflow_key: string;
  version: number;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApprovalWorkflowStep {
  id: string;
  workflow_id: string;
  role: string;
  step_order: number;
  description?: string;
  is_parallel: boolean;
  conditions: Record<string, unknown>;
  sla_hours?: number;
  escalation_action?:
    | 'notify'
    | 'auto_approve'
    | 'auto_reject'
    | 'escalate_role';
  escalation_role?: string;
}

export interface ApprovalStep {
  id: string;
  request_id: string;
  step_order: number;
  role: string;
  role_name: string | null;
  status: 'pending' | 'approved' | 'rejected';
  approver_snapshot?: ApproverSnapshot | null;
  comment?: string;
  approved_at?: string;
  is_parallel: boolean;
  created_at?: string;
  deadline?: string;
  is_overdue?: boolean;
  delegated_to_user_id?: string;
  sla_hours?: number;
  escalation_action?:
    | 'notify'
    | 'auto_approve'
    | 'auto_reject'
    | 'escalate_role';
  escalation_role?: string;
}

export interface ApprovalHistory {
  id: string;
  request_id: string;
  event_type: string;
  actor_snapshot: ApproverSnapshot;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface ApprovalEvent {
  event_type:
    | 'ApprovalSubmitted'
    | 'ApprovalApproved'
    | 'ApprovalRejected'
    | 'ApprovalCancelled'
    | 'ApprovalStepApproved'
    | 'ApprovalDelegated'
    | 'ApprovalSlaBreached'
    | 'ApprovalEscalated';
  request: ApprovalRequest;
  history: ApprovalHistory;
}

export interface ApprovalOutboxEvent {
  id?: string;
  event_type: string;
  payload: Record<string, unknown>;
  status?: 'pending' | 'processed' | 'failed';
  error_message?: string | null;
  created_at?: string;
  processed_at?: string | null;
}

export interface Notification {
  id?: string;
  target_user_id?: string | null;
  target_role?: string | null;
  title: string;
  message: string;
  resource_type?: string;
  resource_id?: string;
  is_read?: boolean;
  created_at?: string;
}
