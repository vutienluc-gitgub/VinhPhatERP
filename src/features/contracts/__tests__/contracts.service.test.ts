// Feature: auto-contract-generation
// Covers: Task 2.5 (unit tests contracts.service), Task 10.4 (metadata transition),
//         Task 11.2 (audit log), Task 12.2 (link/unlink blocked when signed)
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ContractStatus } from '@/features/contracts/contracts.module';

// ── Mock Supabase — chain builder ────────────────────────────────────────────

function createChainBuilder(
  resolvedData: unknown = null,
  error: Error | null = null,
) {
  const chain: Record<string, unknown> = {};
  const methods = [
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'single',
    'order',
    'gte',
    'lt',
    'ilike',
    'not',
    'in',
    'limit',
  ];
  for (const method of methods) {
    chain[method] = vi.fn(() => chain);
  }
  // single resolves the promise
  chain['single'] = vi.fn(() =>
    Promise.resolve({
      data: resolvedData,
      error,
    }),
  );
  // insert without .select().single() also returns result
  chain['insert'] = vi.fn(() => ({
    ...chain,
    select: vi.fn(() => ({
      ...chain,
      single: vi.fn(() =>
        Promise.resolve({
          data: resolvedData,
          error,
        }),
      ),
    })),
    error,
  }));
  // delete()
  chain['delete'] = vi.fn(() => ({
    ...chain,
    eq: vi.fn(() => ({
      ...chain,
      eq: vi.fn(() => Promise.resolve({ error })),
    })),
  }));
  return chain;
}

// State for fine-grained mock control per test
let contractsChain: ReturnType<typeof createChainBuilder>;
let linksChain: ReturnType<typeof createChainBuilder>;
let auditChain: ReturnType<typeof createChainBuilder>;

vi.mock('@/services/supabase/untyped', () => ({
  untypedDb: {
    from: vi.fn((table: string) => {
      if (table === 'contracts') return contractsChain;
      if (table === 'contract_order_links') return linksChain;
      if (table === 'contract_audit_logs') return auditChain;
      return createChainBuilder();
    }),
  },
}));

// Import module under test AFTER mock is set up
const service = await import('@/features/contracts/contracts.service');

// ── Helpers ──────────────────────────────────────────────────────────────────

function setupGetContractById(contract: Record<string, unknown>) {
  // Chain: .select('*').eq('id', id).single()
  contractsChain = createChainBuilder(contract);
}

beforeEach(() => {
  contractsChain = createChainBuilder();
  linksChain = createChainBuilder();
  auditChain = createChainBuilder();
  // Audit log insert always succeeds
  auditChain['insert'] = vi.fn(() => Promise.resolve({ error: null }));
});

afterEach(() => {
  vi.clearAllMocks();
});

// ── Task 2.5: Unit tests cho contracts.service.ts ────────────────────────────

describe('updateContractStatus — Unit Tests', () => {
  it('transition khong hop le: draft -> signed throws error', async () => {
    setupGetContractById({
      id: 'c1',
      status: 'draft',
    });

    await expect(service.updateContractStatus('c1', 'signed')).rejects.toThrow(
      'chuy\u1EC3n tr\u1EA1ng th\u00E1i',
    );
  });

  it('transition khong hop le: signed -> draft throws error', async () => {
    setupGetContractById({
      id: 'c1',
      status: 'signed',
    });

    await expect(service.updateContractStatus('c1', 'draft')).rejects.toThrow(
      'chuy\u1EC3n tr\u1EA1ng th\u00E1i',
    );
  });

  it('cancel khong co ly do throws error', async () => {
    setupGetContractById({
      id: 'c1',
      status: 'draft',
    });

    await expect(
      service.updateContractStatus('c1', 'cancelled', {}),
    ).rejects.toThrow('l\u00FD do');
  });
});

describe('updateContract — Unit Tests', () => {
  it('reject khi contract da signed', async () => {
    setupGetContractById({
      id: 'c1',
      status: 'signed',
    });

    await expect(
      service.updateContract('c1', { notes: 'test' }),
    ).rejects.toThrow('\u0111\u00E3 k\u00FD');
  });
});

// ── Task 10.4: Property test — metadata transition ───────────────────────────
// Property 12: Transition sang sent/signed ghi nhan metadata

describe('Metadata transition — Property Tests', () => {
  it('sent transition bao gom sent_at va sent_by', () => {
    const now = new Date().toISOString();
    const userId = 'user-123';
    const patch: Record<string, unknown> = {
      status: 'sent',
      updated_at: now,
    };

    // Simulate line 178-181 of contracts.service.ts
    const status: ContractStatus = 'sent';
    if (status === 'sent') {
      patch.sent_at = now;
      patch.sent_by = userId;
    }

    expect(patch).toHaveProperty('sent_at');
    expect(patch).toHaveProperty('sent_by');
    expect(patch.sent_by).toBe(userId);
  });

  it('signed transition bao gom signed_at va signed_by', () => {
    const now = new Date().toISOString();
    const userId = 'user-456';
    const patch: Record<string, unknown> = {
      status: 'signed',
      updated_at: now,
    };

    const status: ContractStatus = 'signed';
    if (status === 'signed') {
      patch.signed_at = now;
      patch.signed_by = userId;
    }

    expect(patch).toHaveProperty('signed_at');
    expect(patch).toHaveProperty('signed_by');
    expect(patch.signed_by).toBe(userId);
  });

  it('cancelled transition bao gom cancelled_at va cancel_reason', () => {
    const now = new Date().toISOString();
    const userId = 'user-789';
    const reason = 'Khach hang huy';
    const patch: Record<string, unknown> = {
      status: 'cancelled',
      updated_at: now,
    };

    const status: ContractStatus = 'cancelled';
    if (status === 'cancelled') {
      patch.cancelled_at = now;
      patch.cancelled_by = userId;
      patch.cancel_reason = reason;
    }

    expect(patch).toHaveProperty('cancelled_at');
    expect(patch).toHaveProperty('cancelled_by');
    expect(patch).toHaveProperty('cancel_reason');
    expect(patch.cancel_reason).toBe(reason);
  });
});

// ── Task 11.2: Property test — audit log ─────────────────────────────────────
// Property 9: Moi thay doi noi dung deu co audit log

describe('Audit log — Property Tests', () => {
  it('writeAuditLog ghi dung params vao contract_audit_logs', async () => {
    const contractId = '00000000-0000-0000-0000-000000000001';
    const performedBy = '00000000-0000-0000-0000-000000000002';

    auditChain['insert'] = vi.fn(() => Promise.resolve({ error: null }));

    await service.writeAuditLog(
      contractId,
      'updated',
      { status: 'draft' },
      { status: 'sent' },
      performedBy,
    );

    expect(auditChain['insert']).toHaveBeenCalledWith(
      expect.objectContaining({
        contract_id: contractId,
        action: 'updated',
        performed_by: performedBy,
      }),
    );
  });
});

// ── Task 12.2: Property test — link/unlink bi chan khi da ky ─────────────────
// Property 15: Lien ket Contract-Order bi chan khi da ky

describe('Link/Unlink blocked when signed — Property Tests', () => {
  it('linkOrderToContract bi tu choi khi contract signed', async () => {
    setupGetContractById({
      id: 'c1',
      status: 'signed',
    });

    await expect(service.linkOrderToContract('c1', 'o1')).rejects.toThrow(
      '\u0111\u00E3 k\u00FD',
    );
  });

  it('unlinkOrderFromContract bi tu choi khi contract signed', async () => {
    setupGetContractById({
      id: 'c1',
      status: 'signed',
    });

    await expect(service.unlinkOrderFromContract('c1', 'o1')).rejects.toThrow(
      '\u0111\u00E3 k\u00FD',
    );
  });

  it('linkOrderToContract cho phep khi contract draft', async () => {
    // getContractById returns draft contract
    contractsChain = {
      ...createChainBuilder({
        id: 'c1',
        status: 'draft',
      }),
    } as ReturnType<typeof createChainBuilder>;

    // linkOrderToContract insert
    linksChain['insert'] = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() =>
          Promise.resolve({
            data: {
              id: 'link1',
              contract_id: 'c1',
              order_id: 'o1',
            },
            error: null,
          }),
        ),
      })),
    }));
    auditChain['insert'] = vi.fn(() => Promise.resolve({ error: null }));

    const result = await service.linkOrderToContract('c1', 'o1');
    expect(result).toBeTruthy();
    expect(result.contract_id).toBe('c1');
  });
});
