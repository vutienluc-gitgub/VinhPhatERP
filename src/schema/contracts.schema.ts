import { z } from 'zod';

export const CONTRACT_TYPE_LABELS: Record<string, string> = {
  sales: 'Hợp đồng mua bán vải',
  weaving_service: 'Hợp đồng gia công dệt',
  dyeing_service: 'Hợp đồng gia công nhuộm',
  procurement: 'Hợp đồng cung ứng sợi/nguyên liệu',
};

export const CONTRACT_TEMPLATE_LABELS: Record<string, string> = {
  template_standard_sales: 'Mẫu hợp đồng thương mại chuẩn',
  template_processing: 'Mẫu hợp đồng dịch vụ dệt may',
  template_supplier: 'Mẫu hợp đồng thu mua nguyên liệu',
};

export const contractSchema = z.object({
  id: z.string().optional(),
  code: z.string(),
  title: z.string(),
  contract_type: z.string().default('sales'),
  partner_name: z.string(),
  status: z.string().default('draft'),
  total_value: z.number().default(0),
});

export default contractSchema;
