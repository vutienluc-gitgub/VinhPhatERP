import { untypedDb } from '@/services/supabase/untyped';
import { supabase } from '@/services/supabase/client';
import { safeUpsertOne } from '@/lib/db-guard';

import type {
  Contract,
  ContractAuditLog,
  ContractOrderLink,
  ContractStatus,
  ContractsFilter,
  UpdateContractInput,
} from './contracts.module';

// ── Helpers ──────────────────────────────────────────────────────────────────

const db = {
  contracts: () => untypedDb.from('contracts'),
  contractOrderLinks: () => untypedDb.from('contract_order_links'),
  contractAuditLogs: () => untypedDb.from('contract_audit_logs'),
};

/**
 * Valid status transitions for the contract lifecycle state machine.
 * draft → sent | cancelled
 * sent  → signed | cancelled | expired
 */
const VALID_TRANSITIONS: Record<ContractStatus, ContractStatus[]> = {
  draft: ['sent', 'cancelled'],
  sent: ['signed', 'cancelled', 'expired'],
  signed: [],
  expired: [],
  cancelled: [],
};

export function validateStatusTransition(
  current: ContractStatus,
  next: ContractStatus,
): boolean {
  return VALID_TRANSITIONS[current]?.includes(next) ?? false;
}

// ── Audit log ────────────────────────────────────────────────────────────────

export async function writeAuditLog(
  contractId: string,
  action: string,
  oldValues: Record<string, unknown> | null,
  newValues: Record<string, unknown> | null,
  performedBy: string | null,
): Promise<void> {
  await safeUpsertOne({
    table: 'contract_audit_logs',
    data: {
      contract_id: contractId,
      action,
      old_values: oldValues,
      new_values: newValues,
      performed_by: performedBy,
      performed_at: new Date().toISOString(),
    },
    conflictKey: 'id',
  });
}

// ── Read operations ──────────────────────────────────────────────────────────

export async function getContracts(
  filters: ContractsFilter = {},
): Promise<Contract[]> {
  let query = db
    .contracts()
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.type) {
    query = query.eq('type', filters.type);
  }
  if (filters.partyAId) {
    query = query.eq('party_a_id', filters.partyAId);
  }
  if (filters.dateFrom) {
    query = query.gte('created_at', filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte('created_at', filters.dateTo);
  }
  if (filters.search) {
    query = query.or(
      `contract_number.ilike.%${filters.search}%,party_a_name.ilike.%${filters.search}%`,
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Contract[];
}

export async function getContractById(id: string): Promise<Contract> {
  const { data, error } = await db
    .contracts()
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Contract;
}

// ── Write operations ─────────────────────────────────────────────────────────

/**
 * Update editable fields of a contract.
 * Requirement 4.2: Only allowed when status is 'draft' or 'sent'.
 * Requirement 4.3: Rejected when status is 'signed'.
 */
export async function updateContract(
  id: string,
  data: UpdateContractInput,
  performedBy: string | null = null,
): Promise<Contract> {
  const current = await getContractById(id);

  if (current.status === 'signed') {
    throw new Error('Hợp đồng đã ký không thể chỉnh sửa.');
  }

  const { data: updated, error } = await db
    .contracts()
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;

  await writeAuditLog(
    id,
    'updated',
    current as unknown as Record<string, unknown>,
    data as unknown as Record<string, unknown>,
    performedBy,
  );

  return updated as Contract;
}

/**
 * Transition a contract to a new status.
 * Requirements 6.1, 6.2, 6.3: Validates state machine and records metadata.
 */
export async function updateContractStatus(
  id: string,
  status: ContractStatus,
  meta: {
    performedBy?: string | null;
    cancelReason?: string;
    signedFileUrl?: string;
  } = {},
): Promise<Contract> {
  const current = await getContractById(id);

  if (!validateStatusTransition(current.status, status)) {
    throw new Error(
      `Không thể chuyển trạng thái từ "${current.status}" sang "${status}".`,
    );
  }

  if (status === 'cancelled' && !meta.cancelReason?.trim()) {
    throw new Error('Vui lòng nhập lý do huỷ hợp đồng.');
  }

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    status,
    updated_at: now,
  };

  // Requirement 6.2: Record sent metadata
  if (status === 'sent') {
    patch.sent_at = now;
    patch.sent_by = meta.performedBy ?? null;
  }

  // Requirement 6.3: Record signed metadata
  if (status === 'signed') {
    patch.signed_at = now;
    patch.signed_by = meta.performedBy ?? null;
    if (meta.signedFileUrl) {
      patch.signed_file_url = meta.signedFileUrl;
    }
  }

  // Requirement 6.5: Record cancellation metadata
  if (status === 'cancelled') {
    patch.cancelled_at = now;
    patch.cancelled_by = meta.performedBy ?? null;
    patch.cancel_reason = meta.cancelReason;
  }

  const { data: updated, error } = await db
    .contracts()
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;

  await writeAuditLog(
    id,
    'status_changed',
    { status: current.status },
    {
      status,
      ...patch,
    },
    meta.performedBy ?? null,
  );

  return updated as Contract;
}

// ── Contract–Order linking ───────────────────────────────────────────────────

/**
 * Link an order to a contract.
 * Requirement 8.1: Allows linking one contract to multiple orders.
 * Requirement 8.4: Rejected when contract is 'signed'.
 */
export async function linkOrderToContract(
  contractId: string,
  orderId: string,
  linkedBy: string | null = null,
): Promise<ContractOrderLink> {
  const contract = await getContractById(contractId);

  if (contract.status === 'signed') {
    throw new Error(
      'Không thể thay đổi liên kết đơn hàng sau khi hợp đồng đã ký.',
    );
  }

  const inserted = await safeUpsertOne({
    table: 'contract_order_links',
    data: {
      contract_id: contractId,
      order_id: orderId,
      linked_at: new Date().toISOString(),
      linked_by: linkedBy,
    },
    conflictKey: 'id',
  });

  await writeAuditLog(
    contractId,
    'order_linked',
    null,
    { order_id: orderId },
    linkedBy,
  );

  return inserted as unknown as ContractOrderLink;
}

/**
 * Unlink an order from a contract.
 * Requirement 8.4: Rejected when contract is 'signed'.
 */
export async function unlinkOrderFromContract(
  contractId: string,
  orderId: string,
  performedBy: string | null = null,
): Promise<void> {
  const contract = await getContractById(contractId);

  if (contract.status === 'signed') {
    throw new Error(
      'Không thể thay đổi liên kết đơn hàng sau khi hợp đồng đã ký.',
    );
  }

  const { error } = await db
    .contractOrderLinks()
    .delete()
    .eq('contract_id', contractId)
    .eq('order_id', orderId);
  if (error) throw error;

  await writeAuditLog(
    contractId,
    'order_unlinked',
    { order_id: orderId },
    null,
    performedBy,
  );
}

// ── Cross-reference queries ──────────────────────────────────────────────────

/**
 * Get all contracts linked to a given order.
 * Requirement 8.2: Show contracts linked to an order.
 */
export async function getContractsByOrderId(
  orderId: string,
): Promise<Contract[]> {
  const { data, error } = await db
    .contractOrderLinks()
    .select('contract_id')
    .eq('order_id', orderId);
  if (error) throw error;

  const links = (data ?? []) as { contract_id: string }[];
  if (links.length === 0) return [];

  const contractIds = links.map((l) => l.contract_id);
  const { data: contracts, error: contractsError } = await db
    .contracts()
    .select('*')
    .in('id', contractIds)
    .order('created_at', { ascending: false });
  if (contractsError) throw contractsError;

  return (contracts ?? []) as Contract[];
}

/**
 * Get all orders linked to a given contract.
 * Requirement 8.3: Show orders linked to a contract.
 */
export async function getOrdersByContractId(contractId: string): Promise<
  {
    id: string;
    order_number: string;
    status: string;
    linked_at: string;
  }[]
> {
  const { data, error } = await db
    .contractOrderLinks()
    .select(
      `
      linked_at,
      orders:order_id (
        id,
        order_number,
        status
      )
    `,
    )
    .eq('contract_id', contractId)
    .order('linked_at', { ascending: false });
  if (error) throw error;

  return (
    (data ?? []) as unknown as {
      linked_at: string;
      orders: { id: string; order_number: string; status: string };
    }[]
  ).map((row) => ({
    ...row.orders,
    linked_at: row.linked_at,
  }));
}

// ── Audit log read ───────────────────────────────────────────────────────────

export async function getAuditLogs(
  contractId: string,
): Promise<ContractAuditLog[]> {
  const { data, error } = await db
    .contractAuditLogs()
    .select('*')
    .eq('contract_id', contractId)
    .order('performed_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ContractAuditLog[];
}

// ── Export ───────────────────────────────────────────────────────────────────

export async function exportContractPdf(contractId: string): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token ?? '';
  const { error: fnError } = await supabase.functions.invoke(
    'export-contract-pdf',
    {
      body: { contract_id: contractId },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );
  if (fnError) throw fnError;
}

// ── Link Picker ──────────────────────────────────────────────────────────────

export async function getAvailableOrdersForContract(
  excludeIds: string[],
): Promise<{ value: string; label: string; code: string }[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('id, order_number, customers(name)')
    .not('status', 'eq', 'cancelled')
    .order('order_date', { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? [])
    .filter((o) => !excludeIds.includes(o.id))
    .map((o) => ({
      value: o.id,
      label: o.order_number,
      code: (o.customers as { name: string } | null)?.name ?? '',
    }));
}

export async function getOrderOptions() {
  const { data, error } = await supabase
    .from('orders')
    .select('id, order_number, customers(name)')
    .not('status', 'eq', 'cancelled')
    .order('order_date', { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []).map((o) => ({
    value: o.id,
    label: o.order_number,
    code: (o.customers as { name: string } | null)?.name ?? '',
  }));
}

export async function getCustomerOptions() {
  const { data, error } = await supabase
    .from('customers')
    .select('id, code, name')
    .eq('status', 'active')
    .order('name');
  if (error) throw error;
  return (data ?? []).map((c) => ({
    value: c.id,
    label: c.name,
    code: c.code,
  }));
}

export async function getSupplierOptions() {
  const { data, error } = await supabase
    .from('suppliers')
    .select('id, code, name')
    .eq('status', 'active')
    .order('name');
  if (error) throw error;
  return (data ?? []).map((s) => ({
    value: s.id,
    label: s.name,
    code: s.code,
  }));
}

// ── Generate Contract ────────────────────────────────────────────────────────

export type GenerateContractResponse = {
  contractId: string;
  contractNumber: string;
  warning?: string;
};

export async function generateContract(
  payload: Record<string, unknown>,
): Promise<GenerateContractResponse> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token ?? '';
  const { data, error } =
    await supabase.functions.invoke<GenerateContractResponse>(
      'generate-contract',
      {
        body: payload,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      },
    );
  if (error) throw error;
  return data as GenerateContractResponse;
}
