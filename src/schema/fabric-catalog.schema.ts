import { z } from 'zod'

export const FABRIC_CATALOG_STATUSES = ['active', 'inactive'] as const
export const FABRIC_CATALOG_STATUS_LABELS: Record<'active' | 'inactive', string> = {
  active: 'Đang dùng',
  inactive: 'Ngưng dùng',
}

export const fabricCatalogSchema = z.object({
  code: z.string().trim().min(2, 'Mã tối thiểu 2 ký tự').max(50, 'Mã tối đa 50 ký tự'),
  name: z.string().trim().min(2, 'Tên tối thiểu 2 ký tự').max(200, 'Tên tối đa 200 ký tự'),
  composition: z.string().trim().max(200).optional().or(z.literal('')),
  unit: z.string().trim().min(1, 'Chọn đơn vị').max(20).default('kg'),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
  status: z.enum(FABRIC_CATALOG_STATUSES),
})

export type FabricCatalogFormValues = z.infer<typeof fabricCatalogSchema>

export const fabricCatalogDefaultValues: FabricCatalogFormValues = {
  code: '',
  name: '',
  composition: '',
  unit: 'kg',
  notes: '',
  status: 'active',
}
