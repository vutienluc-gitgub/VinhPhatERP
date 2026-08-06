import type { Database } from '@/schema/database.types';

export type DBWorkOrderStatus =
  Database['public']['Enums']['work_order_status'];

export type WorkOrderStatus = DBWorkOrderStatus;

export type WorkOrderAction =
  | 'start'
  | 'pause'
  | 'resume'
  | 'complete'
  | 'confirm_receipt'
  | 'report_quality';

export type ExceptionFlag =
  | 'blocked'
  | 'waiting_material'
  | 'waiting_qc'
  | 'machine_breakdown';

export interface WorkOrderCapabilities {
  canView: boolean;
  canUpdateProduction: boolean;
  canConfirmMaterials: boolean;
  canReportComplete: boolean;
  canDownloadDocuments: boolean;
  canComment: boolean;
}

export interface WorkOrderStatePayload {
  status: WorkOrderStatus;
  flags: ExceptionFlag[];
  availableActions: WorkOrderAction[];
  capabilities: WorkOrderCapabilities;
}
