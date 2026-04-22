import { z } from 'zod';

export const RefactorReportSchema = z.object({
  duplicate_code: z.object({
    found: z.boolean(),
    action: z.string(),
  }),
  vietnamese_strings: z.object({
    found: z.boolean(),
    action: z.string(),
  }),
  business_logic: z.object({
    found: z.boolean(),
    action: z.string(),
  }),
  validation: z.object({
    found: z.boolean(),
    action: z.string(),
  }),
  naming: z.object({
    found: z.boolean(),
    action: z.string(),
  }),
  database_safety: z.object({
    found: z.boolean(),
    action: z.string(),
  }),
  final_status: z.enum(['PRODUCTION READY', 'NEEDS REFACTOR']),
});

export type RefactorReport = z.infer<typeof RefactorReportSchema>;
