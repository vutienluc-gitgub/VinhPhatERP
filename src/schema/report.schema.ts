import { z } from 'zod';

export const reportsFilterSchema = z
  .object({
    dateFrom: z.string().trim().optional().or(z.literal('')),
    dateTo: z.string().trim().optional().or(z.literal('')),
    customerId: z.string().uuid().optional().or(z.literal('')),
    groupBy: z.enum(['day', 'week', 'month']),
  })
  .refine(
    (data) => {
      if (!data.dateFrom || !data.dateTo) return true;
      return data.dateTo >= data.dateFrom;
    },
    {
      message: 'Ngày kết thúc phải sau ngày bắt đầu',
      path: ['dateTo'],
    },
  );

export type ReportsFilterValues = z.infer<typeof reportsFilterSchema>;
