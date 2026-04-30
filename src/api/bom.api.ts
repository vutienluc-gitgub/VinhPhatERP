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

  if (filters.search) {
    const search = `%${filters.search}%`;
    query = query.or(`code.ilike.${search},name.ilike.${search}`);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data as unknown as BomTemplate[];
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
  if (!userId) throw new Error('User not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', userId)
    .single();

  const tenantId = profile?.tenant_id;
  if (!tenantId)
    throw new Error(
      'User does not have an assigned tenant (tenant_id is missing).',
    );

  const { bom_yarn_items: bomYarnItems, ...headerData } = formData;

  // Tự sinh mã BOM nếu chưa có: BOM-XX-XX
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
      const { data: existing } = await untypedDb
        .from('bom_templates')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('code', finalCode)
        .maybeSingle();

      if (!existing) {
        exists = false;
        break;
      }
      counter++;
      finalCode = `${baseCode}-${counter.toString().padStart(2, '0')}`;
    }
  } else {
    // Verify if manually entered code already exists
    const { data: existing } = await untypedDb
      .from('bom_templates')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('code', finalCode)
      .maybeSingle();

    if (existing) {
      throw new Error(
        `Mã định mức "${finalCode}" đã tồn tại trên hệ thống. Vui lòng nhập mã khác.`,
      );
    }
  }

  const { data: bomId, error: rpcError } = await untypedDb.rpc(
    'rpc_create_bom',
    {
      p_header: {
        code: finalCode,
        name: headerData.name,
        target_fabric_id: headerData.target_fabric_id,
        target_width_cm: headerData.target_width_cm,
        target_gsm: headerData.target_gsm,
        standard_loss_pct: headerData.standard_loss_pct || 0,
        notes: headerData.notes,
      },
      p_items:
        bomYarnItems?.map((item) => ({
          yarn_catalog_id: item.yarn_catalog_id,
          ratio_pct: item.ratio_pct,
          consumption_kg_per_m: item.consumption_kg_per_m,
          notes: item.notes,
          sort_order: item.sort_order || 0,
        })) || [],
      p_user_id: userId,
    },
  );

  if (rpcError) {
    if (rpcError.message?.includes('BOM_CODE_EXISTS')) {
      throw new Error(
        `Mã định mức "${finalCode}" đã tồn tại trên hệ thống. Vui lòng nhập mã khác.`,
      );
    }
    if (rpcError.message?.includes('INVALID_RATIO_SUM')) {
      throw new Error('Tổng tỉ lệ nguyên liệu phải bằng 100%.');
    }
    throw rpcError;
  }

  if (!bomId) throw new Error('Tạo BOM thất bại không rõ nguyên nhân.');

  return { id: bomId as string };
}

/* ── Update BOM draft ── */

export async function updateBomDraft(
  id: string,
  formData: BomTemplateFormData,
): Promise<string> {
  const auth = await supabase.auth.getUser();
  const userId = auth.data.user?.id;
  if (!userId) throw new Error('User not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', userId)
    .single();

  const tenantId = profile?.tenant_id;
  if (!tenantId)
    throw new Error(
      'User does not have an assigned tenant (tenant_id is missing).',
    );

  const { bom_yarn_items: bomYarnItems, ...headerData } = formData;

  const { data: existingBom, error: fetchError } = await supabase
    .from('bom_templates')
    .select('status, active_version, code')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;
  if (existingBom.status !== 'draft') {
    throw new Error('Chỉ có thể sửa khi BOM đang ở trạng thái Nháp (Draft).');
  }

  // Use the atomic RPC to prevent race conditions and ensure old items are deleted properly
  const { error: rpcError } = await untypedDb.rpc('rpc_update_bom', {
    p_bom_id: id,
    p_header: {
      code: existingBom.code,
      name: headerData.name,
      target_fabric_id: headerData.target_fabric_id,
      target_width_cm: headerData.target_width_cm,
      target_gsm: headerData.target_gsm,
      standard_loss_pct: headerData.standard_loss_pct || 0,
      notes: headerData.notes,
    },
    p_items:
      bomYarnItems?.map((item) => ({
        yarn_catalog_id: item.yarn_catalog_id,
        ratio_pct: item.ratio_pct,
        consumption_kg_per_m: item.consumption_kg_per_m,
        notes: item.notes,
        sort_order: item.sort_order || 0,
      })) || [],
  });

  if (rpcError) throw rpcError;

  return id;
}

/* ── Approve BOM ── */

export async function approveBom(id: string, reason?: string): Promise<string> {
  const auth = await supabase.auth.getUser();
  const userId = auth.data.user?.id;

  const { error } = await untypedDb.rpc('rpc_approve_bom', {
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

  const auth = await supabase.auth.getUser();
  const userId = auth.data.user?.id;

  const { error } = await untypedDb.rpc('rpc_deprecate_bom', {
    p_bom_id: id,
    p_reason: reason,
    p_user_id: userId,
  });

  if (error) {
    if (error.message?.includes('BOM_NOT_APPROVED')) {
      throw new Error('Chỉ có thể báo phế BOM đã được duyệt (Approved).');
    }
    if (error.message?.includes('MISSING_REASON')) {
      throw new Error('Bắt buộc phải có lý do khi ngưng áp dụng.');
    }
    throw error;
  }
  return id;
}

/* ── Revise BOM (create new version) ── */

export async function reviseBom(id: string, reason: string): Promise<string> {
  if (!reason) throw new Error('Bày tỏ lý do vì sao lập phiên bản mới.');

  const { error } = await untypedDb.rpc('rpc_revise_bom', {
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
