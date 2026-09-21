import { z } from 'zod';

export const baseSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const company_settings_schema = baseSchema;
export default baseSchema;


// Auto-generated missing exports
export const rowsToSettingsMap: any = (...args: any[]) => ({});


// Auto-generated missing exports
export const settingsMapToUpsertRows: any = (...args: any[]) => ({});
