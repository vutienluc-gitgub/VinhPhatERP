import { untypedDb } from '@/services/supabase/untyped';
import type {
  ContractType,
  ContractTemplate,
  UpdateTemplateInput,
} from '@/schema';

// ── Service helpers ──────────────────────────────────────────────────────────

const db = {
  templates: () => untypedDb.from('contract_templates'),
};

// ── Service functions ────────────────────────────────────────────────────────

/**
 * Lay danh sach tat ca contract templates.
 * Requirement 3.1: Ho tro it nhat 2 loai template: sale va purchase.
 */
export async function getTemplates(): Promise<ContractTemplate[]> {
  const { data, error } = await db
    .templates()
    .select('*')
    .order('type')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ContractTemplate[];
}

/**
 * Lay mot template theo id.
 * Requirement 3.2: Cho phep Admin xem va chinh sua noi dung template.
 */
export async function getTemplateById(id: string): Promise<ContractTemplate> {
  const { data, error } = await db
    .templates()
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as ContractTemplate;
}

/**
 * Tao moi template.
 */
export async function createTemplate(data: {
  type: ContractType;
  name: string;
  content: string;
}): Promise<ContractTemplate> {
  const { data: created, error } = await db
    .templates()
    .insert({
      ...data,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return created as ContractTemplate;
}

/**
 * Cap nhat noi dung template.
 * Requirement 3.2: Cho phep Admin chinh sua noi dung dieu khoan co dinh.
 * Requirement 3.3: Chi ap dung cho hop dong moi, khong anh huong hop dong cu.
 */
export async function updateTemplate(
  id: string,
  data: UpdateTemplateInput,
): Promise<ContractTemplate> {
  const { data: updated, error } = await db
    .templates()
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return updated as ContractTemplate;
}

/**
 * Lay template active theo loai hop dong.
 */
export async function getActiveTemplateByType(
  type: ContractType,
): Promise<ContractTemplate | null> {
  const { data, error } = await db
    .templates()
    .select('*')
    .eq('type', type)
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as ContractTemplate | null;
}

/**
 * Xoa template.
 */
export async function deleteTemplate(id: string): Promise<void> {
  const { error } = await db.templates().delete().eq('id', id);
  if (error) throw error;
}
