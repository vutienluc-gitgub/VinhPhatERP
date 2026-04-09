/**
 * ContractTypes — domain types cho hợp đồng.
 * Pure TypeScript, không phụ thuộc React hay Supabase.
 */

export type ContractStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'active'
  | 'expired'
  | 'cancelled';

export type ContractTransition =
  | 'submit_for_approval'
  | 'approve'
  | 'reject'
  | 'activate'
  | 'expire'
  | 'cancel';

export type ContractParty = {
  name: string;
  address: string;
  tax_code: string | null;
  bank_account: string | null;
  representative: string;
  title: string;
};

export type ContractItem = {
  fabric_type: string;
  color_name: string | null;
  color_code: string | null;
  width_cm: number | null;
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
};

export type ContractTerms = {
  /** Điều 1: Hao hụt cho phép (%) */
  tolerance_pct: number;
  /** Điều 2: Thời gian giao hàng (ngày) */
  delivery_days: number;
  /** Điều 3: Địa điểm giao hàng */
  delivery_address: string;
  /** Điều 4: Điều khoản thanh toán */
  payment_terms: string;
  /** Điều 5: Phạt vi phạm (%) */
  penalty_pct: number;
};

export type Contract = {
  id: string;
  contract_number: string;
  status: ContractStatus;
  revision: number;
  parent_contract_id: string | null;
  customer_id: string;
  quotation_id: string | null;
  order_id: string | null;
  party_a: ContractParty;
  party_b: ContractParty;
  items: ContractItem[];
  terms: ContractTerms;
  signed_date: string;
  valid_until: string | null;
  notes: string | null;
  created_by: string;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Snapshot lưu khi tạo revision mới */
export type ContractSnapshot = Omit<
  Contract,
  'id' | 'created_at' | 'updated_at'
>;
