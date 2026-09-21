import { z } from 'zod';

export const baseSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const weaving_invoice_schema = baseSchema;
export default baseSchema;
