export const VALUE_CHAINS = {
  SUPPLY: 'supply-chain',
  PRODUCTION: 'production-chain',
  SALES: 'sales-chain',
  FINANCE: 'finance-chain',
} as const;

export type ValueChainKey = (typeof VALUE_CHAINS)[keyof typeof VALUE_CHAINS];

export const VALUE_CHAIN_LABELS: Record<ValueChainKey, string> = {
  [VALUE_CHAINS.SUPPLY]: 'Chuỗi Cung Ứng & Nguyên Liệu',
  [VALUE_CHAINS.PRODUCTION]: 'Chuỗi Sản Xuất & Gia Công',
  [VALUE_CHAINS.SALES]: 'Chuỗi Bán Hàng & Phân Phối',
  [VALUE_CHAINS.FINANCE]: 'Chuỗi Tài Chính & Đối Tác',
};
