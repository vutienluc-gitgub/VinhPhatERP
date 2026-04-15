import type { BomTemplateFormData } from '@/schema/bom.schema';
import type {
  BomTemplate,
  BomVersion,
  BomFilter,
  FabricCatalog,
} from '@/features/bom/types';
import { supabase } from '@/services/supabase/client';
import { untypedDb } from '@/services/supabase/untyped';

/* ── Reference data for BOM forms ── */

export async function fetchFabricCatalogsForBom(): Promise<FabricCatalog[]> {
  const { data, error } = await supabase
    .from('fabric_catalogs')
    .select('*')
    .eq('status', 'active')
    .order('name');
  if (error) throw error;
  return data as FabricCatalog[];
}

export async function fetchYarnCatalogsForBom() {
  const { data, error } = await supabase
    .from('yarn_catalogs')
    .select('*')
    .eq('status', 'active')
    .order('name');
  if (error) throw error;
  return data;
}

/* ── BOM list ── */

export async function fetchBomList(filters: BomFilter): Promise<BomTemplate[]> {
  let query = supabase
    .from('bom_templates')
    .select(
      `
      *,
      bom_yarn_items (*),
      fabric_catalogs (code, name),
      created_by_profile:profiles!created_by (full_name),
      approved_by_profile:profiles!approved_by (full_name)
    `,
    )
    .order('created_at', { ascending: false });

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;
  if (error) throw error;

  let result = data as unknown as BomTemplate[];
  if (filters.search) {
    const search = filters.search.toLowerCase();
    result = result.filter(
      (item) =>
        item.code.toLowerCase().includes(search) ||
        item.name.toLowerCase().includes(search) ||
        item.fabric_catalogs?.name.toLowerCase().includes(search),
    );
  }

  return result;
}

/* ── BOM detail ── */

export async function fetchBomById(id: string): Promise<BomTemplate> {
  const { data, error } = await supabase
    .from('bom_templates')
    .select(
      `
      *,
      bom_yarn_items (
        *,
        yarn_catalogs (code, name, composition, unit)
      ),
      fabric_catalogs (code, name, composition),
      created_by_profile:profiles!created_by (full_name),
      approved_by_profile:profiles!approved_by (full_name)
    `,
    )
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as BomTemplate;
}

/* ── BOM versions ── */

export async function fetchBomVersions(
  templateId: string,
): Promise<BomVersion[]> {
  const { data, error } = await supabase
    .from('bom_versions')
    .select(
      `
      *,
      created_by_profile:profiles!created_by (full_name)
    `,
    )
    .eq('bom_template_id', templateId)
    .order('version', { ascending: false });
  if (error) throw error;
  return data as BomVersion[];
}

/* ── Create BOM draft ── */

export async function createBomDraft(
  formData: BomTemplateFormData,
): Promise<{ id: string }> {
  const auth = await supabase.auth.getUser();
  const userId = auth.data.user?.id;

  const { bom_yarn_items: bomYarnItems, ...headerData } = formData;

  // Tự sinh mã BOM nếu chưa có: BOM-<mã sản phẩm mộc>-<mã sợi đầu tiên>
  let finalCode = headerData.code?.trim() || '';
  if (!finalCode) {
    const { data: fabric } = await supabase
      .from('fabric_catalogs')
      .select('code')
      .eq('id', headerData.target_fabric_id)
      .single();

    const firstYarnId = bomYarnItems?.[0]?.yarn_catalog_id;
    let yarnCode = '';
    if (firstYarnId) {
      const { data: yarn } = await supabase
        .from('yarn_catalogs')
        .select('code')
        .eq('id', firstYarnId)
        .single();
      yarnCode = yarn?.code ?? '';
    }

    const parts = ['BOM', fabric?.code ?? 'XX', yarnCode].filter(Boolean);
    const baseCode = parts.join('-');

    finalCode = baseCode;
    let counter = 1;
    let exists = true;
    // Check until we find a unique code
    while (exists) {
      const { data: existing } = await supabase
        .from('bom_templates')
        .select('id')
        .eq('code', finalCode)
        .maybeSingle();

      if (!existing) {
        exists = false;
        break;
      }
      counter++;
      finalCode = `${baseCode}-${counter.toString().padStart(2, '0')}`;
    }
  }

  const { data, error } = await untypedDb.rpc('atomic_create_bom', {
    p_header: {
      ...headerData,
      code: finalCode,
    },
    p_items: bomYarnItems,
    p_user_id: userId,
  });

  if (error) throw error;
  return data as { id: string };
}

/* ── Update BOM draft ── */

export async function updateBomDraft(
  id: string,
  formData: BomTemplateFormData,
): Promise<string> {
  const { bom_yarn_items: bomYarnItems, ...headerData } = formData;

  const { error } = await untypedDb.rpc('atomic_update_bom', {
    p_bom_id: id,
    p_header: headerData,
    p_items: bomYarnItems,
  });

  if (error) {
    if (error.message?.includes('BOM_NOT_DRAFT')) {
      throw new Error('Chỉ có thể sửa khi BOM đang ở trạng thái Nháp (Draft).');
    }
    throw error;
  }

  return id;
}

/* ── Approve BOM ── */

export async function approveBom(id: string, reason?: string): Promise<string> {
  const auth = await supabase.auth.getUser();
  const userId = auth.data.user?.id;

  const { error } = await untypedDb.rpc('atomic_approve_bom', {
    p_bom_id: id,
    p_reason: reason || null,
    p_user_id: userId,
  });

  if (error) {
    if (error.message?.includes('BOM_NOT_DRAFT')) {
      throw new Error('BOM đã được duyệt hoặc huỷ, không thể duyệt lại.');
    }
    if (error.message?.includes('BOM_EMPTY')) {
      throw new Error('Không thể duyệt BOM rỗng chưa có thành phần sợi.');
    }
    if (error.message?.includes('INVALID_RATIO_SUM')) {
      throw new Error('Tổng tỉ lệ nguyên liệu phải bằng 100%.');
    }
    throw error;
  }

  return id;
}

/* ── Deprecate BOM ── */

export async function deprecateBom(
  id: string,
  reason: string,
): Promise<string> {
  if (!reason)
    throw new Error('Bắt buộc phải có lý do khi ngưng áp dụng (Báo Phế).');

  // 1. Kiem tra status hien tai
  const { data: currentBom, error: fetchError } = await supabase
    .from('bom_templates')
    .select('status, notes')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;
  if (currentBom.status !== 'approved') {
    throw new Error('Chỉ có thể báo phế BOM đã được duyệt (approved).');
  }

  // 2. Wrap notes cu vao thay vi ghi de
  const updatedNotes = currentBom.notes
    ? `${currentBom.notes}\n[Báo phế]: ${reason}`
    : `[Báo phế]: ${reason}`;

  const { error } = await supabase
    .from('bom_templates')
    .update({
      status: 'deprecated',
      notes: updatedNotes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;
  return id;
}

/* ── Revise BOM (create new version) ── */

export async function reviseBom(id: string, reason: string): Promise<string> {
  if (!reason) throw new Error('Bày tỏ lý do vì sao lập phiên bản mới.');

  const { error } = await untypedDb.rpc('atomic_revise_bom', {
    p_bom_id: id,
    p_reason: reason,
  });

  if (error) {
    if (error.message?.includes('BOM_NOT_APPROVED')) {
      throw new Error('Chỉ lập version mới từ BOM đang duyệt.');
    }
    throw error;
  }

  return id;
}
