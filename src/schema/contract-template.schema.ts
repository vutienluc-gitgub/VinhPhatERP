import { z } from 'zod';

export const contractTemplateEditorSchema = z.object({
  name: z.string().trim().min(1, 'Tên mẫu không được để trống'),
  content: z.string().min(1, 'Nội dung mẫu không được để trống'),
});

export type ContractTemplateEditorValues = z.infer<
  typeof contractTemplateEditorSchema
>;
