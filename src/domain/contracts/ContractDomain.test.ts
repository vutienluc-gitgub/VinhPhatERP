import { describe, expect, it } from 'vitest';
import fc from 'fast-check';

import {
  applyContractTransition,
  buildNewRevision,
  calculateContractItems,
  calculateContractTotal,
  generateContractNumber,
  getAllowedTransitions,
  isContractEditable,
  canCreateRevision,
  validateContractItems,
  validateContractTerms,
} from './ContractDomain';
import { contractStateMachine } from './ContractStateMachine';
import type { Contract, ContractItem, ContractTerms } from './ContractTypes';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const ACTOR_ID = '00000000-0000-0000-0000-000000000001';
const CONTRACT_ID = '00000000-0000-0000-0000-000000000002';

const baseTerms: ContractTerms = {
  tolerance_pct: 5,
  delivery_days: 10,
  delivery_address: '15 Đoàn Hồng Phước, TP HCM',
  payment_terms: 'Thanh toán 100% trước khi nhận hàng',
  penalty_pct: 8,
};

const baseContract: Contract = {
  id: CONTRACT_ID,
  contract_number: '001/2026/HĐNT',
  status: 'draft',
  revision: 1,
  parent_contract_id: null,
  customer_id: '00000000-0000-0000-0000-000000000003',
  quotation_id: null,
  order_id: null,
  party_a: {
    name: 'Thanh KS',
    address: '15 Đoàn Hồng Phước',
    tax_code: '0319306521',
    bank_account: null,
    representative: 'Trần Văn Chí Linh',
    title: 'Giám Đốc',
  },
  party_b: {
    name: 'Vĩnh Phát',
    address: '80A Trương Phước Phan',
    tax_code: '0318633734',
    bank_account: '80000346931',
    representative: 'Vũ Tiến Lực',
    title: 'Giám Đốc',
  },
  items: [],
  terms: baseTerms,
  signed_date: '2026-03-06',
  valid_until: '2026-12-31',
  notes: null,
  created_by: ACTOR_ID,
  approved_by: null,
  approved_at: null,
  created_at: '2026-03-06T00:00:00Z',
  updated_at: '2026-03-06T00:00:00Z',
};

// ─── State Machine ────────────────────────────────────────────────────────────

describe('ContractStateMachine', () => {
  it('draft → pending_approval khi submit_for_approval', () => {
    const result = contractStateMachine.apply('draft', 'submit_for_approval');
    expect(result).toBe('pending_approval');
  });

  it('pending_approval → approved khi approve', () => {
    expect(contractStateMachine.apply('pending_approval', 'approve')).toBe(
      'approved',
    );
  });

  it('pending_approval → draft khi reject', () => {
    expect(contractStateMachine.apply('pending_approval', 'reject')).toBe(
      'draft',
    );
  });

  it('approved → active khi activate', () => {
    expect(contractStateMachine.apply('approved', 'activate')).toBe('active');
  });

  it('throw khi transition không hợp lệ', () => {
    expect(() => contractStateMachine.apply('expired', 'approve')).toThrow();
    expect(() => contractStateMachine.apply('cancelled', 'activate')).toThrow();
    expect(() => contractStateMachine.apply('draft', 'approve')).toThrow();
  });

  it('expired và cancelled không có transition nào', () => {
    expect(contractStateMachine.allowedTransitions('expired')).toHaveLength(0);
    expect(contractStateMachine.allowedTransitions('cancelled')).toHaveLength(
      0,
    );
  });
});

// ─── Guards ───────────────────────────────────────────────────────────────────

describe('Guards', () => {
  it('chỉ draft mới có thể edit', () => {
    expect(isContractEditable('draft')).toBe(true);
    expect(isContractEditable('pending_approval')).toBe(false);
    expect(isContractEditable('active')).toBe(false);
  });

  it('chỉ active và approved mới có thể tạo revision', () => {
    expect(canCreateRevision('active')).toBe(true);
    expect(canCreateRevision('approved')).toBe(true);
    expect(canCreateRevision('draft')).toBe(false);
    expect(canCreateRevision('cancelled')).toBe(false);
  });
});

// ─── Calculations ─────────────────────────────────────────────────────────────

describe('calculateContractItems', () => {
  it('tính amount = quantity × unit_price', () => {
    const items = calculateContractItems([
      {
        fabric_type: 'Cotton',
        color_name: null,
        color_code: null,
        width_cm: null,
        quantity: 100,
        unit: 'm',
        unit_price: 50000,
      },
      {
        fabric_type: 'Polyester',
        color_name: null,
        color_code: null,
        width_cm: null,
        quantity: 50,
        unit: 'kg',
        unit_price: 80000,
      },
    ]);
    expect(items[0]!.amount).toBe(5_000_000);
    expect(items[1]!.amount).toBe(4_000_000);
  });

  it('Property: tổng amount luôn = sum(quantity × unit_price)', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            quantity: fc.integer({
              min: 1,
              max: 10_000,
            }),
            unit_price: fc.integer({
              min: 0,
              max: 1_000_000,
            }),
          }),
          {
            minLength: 1,
            maxLength: 20,
          },
        ),
        (rawItems) => {
          const items = calculateContractItems(
            rawItems.map((r) => ({
              fabric_type: 'Test',
              color_name: null,
              color_code: null,
              width_cm: null,
              unit: 'm',
              ...r,
            })),
          );
          const total = calculateContractTotal(items);
          const expected = rawItems.reduce(
            (s, r) => s + r.quantity * r.unit_price,
            0,
          );
          return total === expected;
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─── Validation ───────────────────────────────────────────────────────────────

describe('validateContractItems', () => {
  it('lỗi khi items rỗng', () => {
    const errors = validateContractItems([]);
    expect(errors.some((e) => e.field === 'items')).toBe(true);
  });

  it('lỗi khi fabric_type trống', () => {
    const item: ContractItem = {
      fabric_type: '',
      color_name: null,
      color_code: null,
      width_cm: null,
      quantity: 10,
      unit: 'm',
      unit_price: 50000,
      amount: 500000,
    };
    const errors = validateContractItems([item]);
    expect(errors.some((e) => e.field.includes('fabric_type'))).toBe(true);
  });

  it('lỗi khi quantity <= 0', () => {
    const item: ContractItem = {
      fabric_type: 'Cotton',
      color_name: null,
      color_code: null,
      width_cm: null,
      quantity: 0,
      unit: 'm',
      unit_price: 50000,
      amount: 0,
    };
    const errors = validateContractItems([item]);
    expect(errors.some((e) => e.field.includes('quantity'))).toBe(true);
  });

  it('không lỗi khi items hợp lệ', () => {
    const item: ContractItem = {
      fabric_type: 'Cotton',
      color_name: null,
      color_code: null,
      width_cm: null,
      quantity: 100,
      unit: 'm',
      unit_price: 50000,
      amount: 5000000,
    };
    expect(validateContractItems([item])).toHaveLength(0);
  });
});

describe('validateContractTerms', () => {
  it('không lỗi khi terms hợp lệ', () => {
    expect(validateContractTerms(baseTerms)).toHaveLength(0);
  });

  it('lỗi khi tolerance_pct > 100', () => {
    const errors = validateContractTerms({
      ...baseTerms,
      tolerance_pct: 101,
    });
    expect(errors.some((e) => e.field.includes('tolerance_pct'))).toBe(true);
  });

  it('lỗi khi delivery_days <= 0', () => {
    const errors = validateContractTerms({
      ...baseTerms,
      delivery_days: 0,
    });
    expect(errors.some((e) => e.field.includes('delivery_days'))).toBe(true);
  });
});

// ─── Transition với Audit ─────────────────────────────────────────────────────

describe('applyContractTransition', () => {
  it('trả về newStatus và auditEntry đúng', () => {
    const { newStatus, auditEntry } = applyContractTransition(
      {
        id: CONTRACT_ID,
        status: 'draft',
      },
      'submit_for_approval',
      ACTOR_ID,
    );
    expect(newStatus).toBe('pending_approval');
    expect(auditEntry.entity_id).toBe(CONTRACT_ID);
    expect(auditEntry.actor_id).toBe(ACTOR_ID);
    expect(auditEntry.action).toBe('submit_for_approval');
    expect(auditEntry.before).toEqual({ status: 'draft' });
    expect(auditEntry.after).toMatchObject({ status: 'pending_approval' });
  });

  it('throw khi transition không hợp lệ', () => {
    expect(() =>
      applyContractTransition(
        {
          id: CONTRACT_ID,
          status: 'expired',
        },
        'approve',
        ACTOR_ID,
      ),
    ).toThrow();
  });
});

// ─── Revision ─────────────────────────────────────────────────────────────────

describe('buildNewRevision', () => {
  it('tạo revision mới với số tăng lên 1', () => {
    const activeContract = {
      ...baseContract,
      status: 'active' as const,
    };
    const {
      revision,
      parent_contract_id: parentContractId,
      auditEntry,
    } = buildNewRevision(activeContract, ACTOR_ID);
    expect(revision).toBe(2);
    expect(parentContractId).toBe(CONTRACT_ID);
    expect(auditEntry.action).toBe('create_revision');
  });

  it('throw khi contract ở trạng thái không cho phép revision', () => {
    expect(() => buildNewRevision(baseContract, ACTOR_ID)).toThrow(); // draft
    const cancelled = {
      ...baseContract,
      status: 'cancelled' as const,
    };
    expect(() => buildNewRevision(cancelled, ACTOR_ID)).toThrow();
  });
});

// ─── Contract Number ──────────────────────────────────────────────────────────

describe('generateContractNumber', () => {
  it('format đúng 001/2026/HĐNT', () => {
    expect(generateContractNumber(1, 2026)).toBe('001/2026/HĐNT');
    expect(generateContractNumber(42, 2026)).toBe('042/2026/HĐNT');
    expect(generateContractNumber(100, 2026)).toBe('100/2026/HĐNT');
  });

  it('Property: sequence luôn được pad đủ 3 chữ số', () => {
    fc.assert(
      fc.property(
        fc.integer({
          min: 1,
          max: 999,
        }),
        (seq) => {
          const num = generateContractNumber(seq, 2026);
          const parts = num.split('/');
          return parts[0]!.length === 3;
        },
      ),
    );
  });
});

// ─── getAllowedTransitions ────────────────────────────────────────────────────

describe('getAllowedTransitions', () => {
  it('draft có 2 transitions', () => {
    const transitions = getAllowedTransitions('draft');
    expect(transitions).toContain('submit_for_approval');
    expect(transitions).toContain('cancel');
  });

  it('expired không có transition nào', () => {
    expect(getAllowedTransitions('expired')).toHaveLength(0);
  });
});
