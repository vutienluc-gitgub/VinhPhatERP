import * as Schema from '@/schema/contracts.schema';

// ── Re-export constants ──────────────────────────────────────────────────────

export const CONTRACT_STATUSES = Schema.CONTRACT_STATUSES;
export const CONTRACT_TYPES = Schema.CONTRACT_TYPES;
export const PARTY_A_TYPES = Schema.PARTY_A_TYPES;
export const CONTRACT_STATUS_LABELS = Schema.CONTRACT_STATUS_LABELS;
export const CONTRACT_TYPE_LABELS = Schema.CONTRACT_TYPE_LABELS;

// ── Re-export schemas ────────────────────────────────────────────────────────

export const contractSchema = Schema.contractSchema;
export const contractTemplateSchema = Schema.contractTemplateSchema;
export const contractOrderLinkSchema = Schema.contractOrderLinkSchema;
export const contractAuditLogSchema = Schema.contractAuditLogSchema;
export const createContractInputSchema = Schema.createContractInputSchema;
export const updateContractInputSchema = Schema.updateContractInputSchema;

// ── Re-export types ─────────────────────────────────────────────────────────

export type ContractStatus = Schema.ContractStatus;
export type ContractType = Schema.ContractType;
export type PartyAType = Schema.PartyAType;
export type Contract = Schema.Contract;
export type ContractTemplate = Schema.ContractTemplate;
export type ContractOrderLink = Schema.ContractOrderLink;
export type ContractAuditLog = Schema.ContractAuditLog;
export type CreateContractInput = Schema.CreateContractInput;
export type UpdateContractInput = Schema.UpdateContractInput;

// ── Filter type ──────────────────────────────────────────────────────────────

export type ContractsFilter = {
  search?: string;
  status?: ContractStatus;
  type?: ContractType;
  partyAId?: string;
  dateFrom?: string;
  dateTo?: string;
};

// ── Utility functions ────────────────────────────────────────────────────────

/**
 * Tạo số hợp đồng theo định dạng chuẩn: {seq:03d}/{năm}/HĐNT–{prefix}/TKS
 *
 * @param seq   - Số thứ tự trong năm (>= 1)
 * @param year  - Năm (4 chữ số, VD: 2026)
 * @param type  - Loại hợp đồng ('sale' | 'purchase')
 * @param prefix - Tiền tố tuỳ chỉnh (mặc định: 'ĐKKH' cho sale, 'ĐKNH' cho purchase)
 * @returns Chuỗi số hợp đồng, VD: "001/2026/HĐNT–ĐKKH/TKS"
 */
export function formatContractNumber(
  seq: number,
  year: number,
  type: ContractType,
  prefix?: string,
): string {
  const resolvedPrefix = prefix ?? (type === 'sale' ? 'ĐKKH' : 'ĐKNH');
  const seqPadded = String(seq).padStart(3, '0');
  return `${seqPadded}/${year}/HĐNT\u2013${resolvedPrefix}/TKS`;
}

/**
 * Render template bằng cách thay thế tất cả {{placeholder}} bằng dữ liệu thực.
 * Placeholder không có trong data sẽ được giữ nguyên (không xoá).
 *
 * @param content - Nội dung template HTML có chứa {{placeholder}}
 * @param data    - Object chứa các cặp key-value để thay thế
 * @returns Nội dung đã được render, không còn placeholder nào có dữ liệu tương ứng
 */
export function renderTemplate(
  content: string,
  data: Record<string, string | null | undefined>,
): string {
  return content.replace(/\{\{([^}]+)\}\}/g, (match, key: string) => {
    const trimmedKey = key.trim();
    const value = data[trimmedKey];
    return value != null ? value : match;
  });
}
