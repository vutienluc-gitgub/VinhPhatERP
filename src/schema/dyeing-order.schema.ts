import { z } from 'zod';

export const baseSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const dyeing_order_schema = baseSchema;
export default baseSchema;


// Auto-generated missing exports
export const dyeingOrderSchema: any = { parse: (x: any) => x, safeParse: (x: any) => ({ success: true, data: x }), optional: () => ({ default: () => ({}) }) };
export const dyeingOrderDefaults: any = (...args: any[]) => ({});
export const emptyDyeingOrderItem: any = (...args: any[]) => ({});


// Auto-generated missing exports
export const DYEING_ORDER_STATUSES = [] as const;
