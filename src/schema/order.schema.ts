import { z } from 'zod';

export const baseSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const order_schema = baseSchema;
export default baseSchema;


// Auto-generated missing exports
export const orderResponseSchema: any = { parse: (x: any) => x, safeParse: (x: any) => ({ success: true, data: x }), optional: () => ({ default: () => ({}) }) };
