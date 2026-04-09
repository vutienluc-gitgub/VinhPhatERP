/**
 * ContractDomain — business logic thuần cho hợp đồng.
 * Pure TypeScript, không phụ thuộc React hay Supabase.
 *
 * Đây là nguồn sự thật duy nhất cho:
 * - Validation rules
 * - State transitions
 * - Revision management
 * - Audit log generation
 * - Document generation data
 */

import { buildAuditEntry } from '@/domain/shared/AuditLog';
import type { AuditEntry } from '@/domain/shared/AuditLog';

import {
  contractStateMachine,
  isContractEditable,
  canCreateRevision,
} from './ContractStateMachine';
import type {
  Contract,
  ContractItem,
  ContractSnapshot,
  ContractStatus,
  ContractTerms,
  ContractTransition,
} from './ContractTypes';

// ─── Validation ──────────────────────────────────────────────────────────────

export type ContractValidationError = {
  field: string;
  message: string;
};

export function validateContractItems(
  items: ContractItem[],
): ContractValidationError[] {
  const errors: ContractValidationError[] = [];

  if (items.length === 0) {
    errors.push({
      field: 'items',
      message: 'Hợp đồng phải có ít nhất 1 dòng hàng',
    });
  }

  items.forEach((item, idx) => {
    if (!item.fabric_type.trim()) {
      errors.push({
        field: `items.${idx}.fabric_type`,
        message: 'Loại vải không được để trống',
      });
    }
    if (item.quantity <= 0) {
      errors.push({
        field: `items.${idx}.quantity`,
        message: 'Số lượng phải > 0',
      });
    }
    if (item.unit_price < 0) {
      errors.push({
        field: `items.${idx}.unit_price`,
        message: 'Đơn giá không được âm',
      });
    }
  });

  return errors;
}

export function validateContractTerms(
  terms: ContractTerms,
): ContractValidationError[] {
  const errors: ContractValidationError[] = [];

  if (terms.tolerance_pct < 0 || terms.tolerance_pct > 100) {
    errors.push({
      field: 'terms.tolerance_pct',
      message: 'Hao hụt phải từ 0–100%',
    });
  }
  if (terms.delivery_days <= 0) {
    errors.push({
      field: 'terms.delivery_days',
      message: 'Thời gian giao hàng phải > 0 ngày',
    });
  }
  if (!terms.delivery_address.trim()) {
    errors.push({
      field: 'terms.delivery_address',
      message: 'Địa điểm giao hàng không được để trống',
    });
  }
  if (terms.penalty_pct < 0 || terms.penalty_pct > 100) {
    errors.push({
      field: 'terms.penalty_pct',
      message: 'Phạt vi phạm phải từ 0–100%',
    });
  }

  return errors;
}

// ─── Calculations ─────────────────────────────────────────────────────────────

export function calculateContractItems(
  items: Omit<ContractItem, 'amount'>[],
): ContractItem[] {
  return items.map((item) => ({
    ...item,
    amount: item.quantity * item.unit_price,
  }));
}

export function calculateContractTotal(items: ContractItem[]): number {
  return items.reduce((sum, item) => sum + item.amount, 0);
}

// ─── State Transitions ────────────────────────────────────────────────────────

export type TransitionResult = {
  newStatus: ContractStatus;
  auditEntry: AuditEntry;
};

export function applyContractTransition(
  contract: Pick<Contract, 'id' | 'status'>,
  transition: ContractTransition,
  actorId: string,
  meta?: Record<string, unknown>,
): TransitionResult {
  const newStatus = contractStateMachine.apply(contract.status, transition);

  const auditEntry = buildAuditEntry(
    'contract',
    contract.id,
    actorId,
    transition,
    { status: contract.status },
    {
      status: newStatus,
      ...meta,
    },
  );

  return {
    newStatus,
    auditEntry,
  };
}

export function getAllowedTransitions(
  status: ContractStatus,
): ContractTransition[] {
  return contractStateMachine.allowedTransitions(status);
}

// ─── Revision Management ──────────────────────────────────────────────────────

export type NewRevisionData = {
  revision: number;
  parent_contract_id: string;
  snapshot: ContractSnapshot;
  auditEntry: AuditEntry;
};

export function buildNewRevision(
  contract: Contract,
  actorId: string,
): NewRevisionData {
  if (!canCreateRevision(contract.status)) {
    throw new Error(
      `Không thể tạo phiên bản mới từ trạng thái "${contract.status}"`,
    );
  }

  const snapshot: ContractSnapshot = {
    contract_number: contract.contract_number,
    status: contract.status,
    revision: contract.revision,
    parent_contract_id: contract.parent_contract_id,
    customer_id: contract.customer_id,
    quotation_id: contract.quotation_id,
    order_id: contract.order_id,
    party_a: contract.party_a,
    party_b: contract.party_b,
    items: contract.items,
    terms: contract.terms,
    signed_date: contract.signed_date,
    valid_until: contract.valid_until,
    notes: contract.notes,
    created_by: contract.created_by,
    approved_by: contract.approved_by,
    approved_at: contract.approved_at,
  };

  const auditEntry = buildAuditEntry(
    'contract',
    contract.id,
    actorId,
    'create_revision',
    { revision: contract.revision },
    { revision: contract.revision + 1 },
  );

  return {
    revision: contract.revision + 1,
    parent_contract_id: contract.id,
    snapshot,
    auditEntry,
  };
}

// ─── Contract Number Generation ───────────────────────────────────────────────

export function generateContractNumber(
  sequence: number,
  year: number = new Date().getFullYear(),
  suffix = 'HĐNT',
): string {
  const seq = String(sequence).padStart(3, '0');
  return `${seq}/${year}/${suffix}`;
}

// ─── Guards ───────────────────────────────────────────────────────────────────

export { isContractEditable, canCreateRevision };
