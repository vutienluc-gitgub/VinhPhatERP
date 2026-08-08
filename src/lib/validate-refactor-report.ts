import { RefactorReportSchema } from '@/schema/refactor-report.schema';

import { parseMarkdownToJson } from './parse-refactor-report';

export function validateRefactorReport(md: string) {
  const json = parseMarkdownToJson(md);

  const result = RefactorReportSchema.safeParse(json);

  if (!result.success) {
    console.error(result.error);
    // eslint-disable-next-line no-restricted-syntax -- Allowed string emoji
    throw new Error('❌ Invalid Refactor Report');
  }

  return result.data;
}
