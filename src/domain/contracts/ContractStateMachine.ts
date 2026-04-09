/**
 * ContractStateMachine — state machine cho vòng đời hợp đồng.
 * Pure TypeScript, không phụ thuộc React hay Supabase.
 *
 * Luồng:
 *   draft → pending_approval → approved → active → expired
 *                           ↘ (reject) → draft
 *   Bất kỳ trạng thái nào (trừ expired) → cancelled
 */

import { StateMachine } from '@/domain/shared/StateMachine';

import type { ContractStatus, ContractTransition } from './ContractTypes';

export const contractStateMachine = new StateMachine<
  ContractStatus,
  ContractTransition
>(
  // Allowed transitions per status
  {
    draft: ['submit_for_approval', 'cancel'],
    pending_approval: ['approve', 'reject', 'cancel'],
    approved: ['activate', 'cancel'],
    active: ['expire', 'cancel'],
    expired: [],
    cancelled: [],
  },
  // Result of each transition
  {
    submit_for_approval: 'pending_approval',
    approve: 'approved',
    reject: 'draft',
    activate: 'active',
    expire: 'expired',
    cancel: 'cancelled',
  },
);

/** Labels tiếng Việt cho UI */
export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  draft: 'Nháp',
  pending_approval: 'Chờ duyệt',
  approved: 'Đã duyệt',
  active: 'Hiệu lực',
  expired: 'Hết hạn',
  cancelled: 'Đã huỷ',
};

export const CONTRACT_TRANSITION_LABELS: Record<ContractTransition, string> = {
  submit_for_approval: 'Gửi duyệt',
  approve: 'Phê duyệt',
  reject: 'Từ chối',
  activate: 'Kích hoạt',
  expire: 'Hết hạn',
  cancel: 'Huỷ hợp đồng',
};

/** Kiểm tra hợp đồng có thể chỉnh sửa không */
export function isContractEditable(status: ContractStatus): boolean {
  return status === 'draft';
}

/** Kiểm tra hợp đồng có thể tạo revision không */
export function canCreateRevision(status: ContractStatus): boolean {
  return status === 'active' || status === 'approved';
}

/** Kiểm tra hợp đồng đã hết hạn chưa (dựa trên ngày) */
export function isContractExpiredByDate(validUntil: string | null): boolean {
  if (!validUntil) return false;
  return new Date(validUntil) < new Date();
}
