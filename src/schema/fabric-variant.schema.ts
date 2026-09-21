import { z } from 'zod';

export const baseSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const fabric_variant_schema = baseSchema;
export default baseSchema;


// Auto-generated missing exports
export const FABRIC_VARIANT_STATUS_LABELS: Record<string, any> = {};
export const FABRIC_VARIANT_STATUSES = [] as const;


// Auto-generated missing exports
export const fabricVariantSchema: any = { parse: (x: any) => x, safeParse: (x: any) => ({ success: true, data: x }), optional: () => ({ default: () => ({}) }) };
export const fabricVariantDefaultValues: any = (...args: any[]) => ({});
export const FABRIC_UOM_OPTIONS = [] as const;
