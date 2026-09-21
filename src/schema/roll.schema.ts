import { z } from 'zod';

export const baseSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const roll_schema = baseSchema;
export default baseSchema;


// Auto-generated missing exports
export const QUALITY_GRADE_LABELS: Record<string, any> = {};
export const ROLL_STATUS_LABELS: Record<string, any> = {};
