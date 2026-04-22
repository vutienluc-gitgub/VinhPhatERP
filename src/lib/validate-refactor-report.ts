import { RefactorReportSchema } from '@/schema/refactor-report.schema';

import { parseMarkdownToJson } from './parse-refactor-report';

export function validateRefactorReport(md: string) {
  const json = parseMarkdownToJson(md);

  const result = RefactorReportSchema.safeParse(json);

  if (!result.success) {
    console.error(result.error);
    throw new Error('❌ Invalid Refactor Report');
  }

  return result.data;
}
