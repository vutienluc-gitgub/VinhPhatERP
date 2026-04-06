import { supabase } from '@/services/supabase/client'
import type { BomTemplate, BomVersion, BomFilter, FabricCatalog, BomYarnItem } from '@/features/bom/types'
import type { BomTemplateFormData } from '@/features/bom/bom.module'

/* ── Reference data for BOM forms ── */

export async function fetchFabricCatalogsForBom(): Promise<FabricCatalog[]> {
  const { data, error } = await supabase
    .from('fabric_catalogs')
    .select('*')
    .eq('status', 'active')
    .order('name')
  if (error) throw error
  return data as FabricCatalog[]
}

export async function fetchYarnCatalogsForBom() {
  const { data, error } = await supabase
    .from('yarn_catalogs')
    .select('*')
    .eq('status', 'active')
    .order('name')
  if (error) throw error
  return data
}

/* ── BOM list ── */

export async function fetchBomList(filters: BomFilter): Promise<BomTemplate[]> {
  let query = supabase
    .from('bom_templates')
    .select(`
      *,
      bom_yarn_items (*),
      fabric_catalogs (code, name),
      created_by_profile:profiles!created_by (full_name),
      approved_by_profile:profiles!approved_by (full_name)
    `)
    .order('created_at', { ascending: false })

  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query
  if (error) throw error

  let result = data as unknown as BomTemplate[]
  if (filters.search) {
    const search = filters.search.toLowerCase()
    result = result.filter(
      (item) =>
        item.code.toLowerCase().includes(search) ||
        item.name.toLowerCase().includes(search) ||
        item.fabric_catalogs?.name.toLowerCase().includes(search),
    )
  }

  return result
}

/* ── BOM detail ── */

export async function fetchBomById(id: string): Promise<BomTemplate> {
  const { data, error } = await supabase
    .from('bom_templates')
    .select(`
      *,
      bom_yarn_items (
        *,
        yarn_catalogs (code, name, composition, unit)
      ),
      fabric_catalogs (code, name, composition),
      created_by_profile:profiles!created_by (full_name),
      approved_by_profile:profiles!approved_by (full_name)
    `)
    .eq('id', id)
    .single()
  if (error) throw error
  return data as BomTemplate
}

/* ── BOM versions ── */

export async function fetchBomVersions(templateId: string): Promise<BomVersion[]> {
  const { data, error } = await supabase
    .from('bom_versions')
    .select(`
      *,
      created_by_profile:profiles!created_by (full_name)
    `)
    .eq('bom_template_id', templateId)
    .order('version', { ascending: false })
  if (error) throw error
  return data as BomVersion[]
}

/* ── Create BOM draft ── */

export async function createBomDraft(formData: BomTemplateFormData): Promise<{ id: string }> {
  const auth = await supabase.auth.getUser()
  const userId = auth.data.user?.id

  const { bom_yarn_items, ...headerData } = formData

  // Tự sinh mã BOM nếu chưa có: BOM-<mã sản phẩm mộc>-<mã sợi đầu tiên>
  let finalCode = headerData.code?.trim() || ''
  if (!finalCode) {
    const { data: fabric } = await supabase
      .from('fabric_catalogs')
      .select('code')
      .eq('id', headerData.target_fabric_id)
      .single()

    const firstYarnId = bom_yarn_items?.[0]?.yarn_catalog_id
    let yarnCode = ''
    if (firstYarnId) {
      const { data: yarn } = await supabase
        .from('yarn_catalogs')
        .select('code')
        .eq('id', firstYarnId)
        .single()
      yarnCode = yarn?.code ?? ''
    }

    const parts = ['BOM', fabric?.code ?? 'XX', yarnCode].filter(Boolean)
    finalCode = parts.join('-')
  }

  const { data: header, error: headerError } = await supabase
    .from('bom_templates')
    .insert([{
      ...headerData,
      code: finalCode,
      status: 'draft',
      active_version: 1,
      created_by: userId,
    }])
    .select()
    .single()

  if (headerError) throw headerError

  if (bom_yarn_items && bom_yarn_items.length > 0) {
    const itemsToInsert = bom_yarn_items.map((item, index) => ({
      bom_template_id: header.id,
      version: 1,
      yarn_catalog_id: item.yarn_catalog_id,
      ratio_pct: item.ratio_pct,
      consumption_kg_per_m: item.consumption_kg_per_m,
      notes: item.notes,
      sort_order: item.sort_order || index,
    }))

    const { error: itemsError } = await supabase
      .from('bom_yarn_items')
      .insert(itemsToInsert)

    if (itemsError) {
      await supabase.from('bom_templates').delete().eq('id', header.id)
      throw itemsError
    }
  }

  return header
}

/* ── Update BOM draft ── */

export async function updateBomDraft(id: string, formData: BomTemplateFormData): Promise<string> {
  const { data: existing, error: checkErr } = await supabase
    .from('bom_templates')
    .select('status')
    .eq('id', id)
    .single()
  if (checkErr) throw checkErr
  if (existing.status !== 'draft') {
    throw new Error('Chỉ có thể sửa khi BOM đang ở trạng thái Nháp (Draft).')
  }

  const { bom_yarn_items, ...headerData } = formData

  const { error: updateErr } = await supabase
    .from('bom_templates')
    .update({ ...headerData, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (updateErr) throw updateErr

  const { error: delErr } = await supabase
    .from('bom_yarn_items')
    .delete()
    .eq('bom_template_id', id)
  if (delErr) throw delErr

  if (bom_yarn_items && bom_yarn_items.length > 0) {
    const itemsToInsert = bom_yarn_items.map((item, index) => ({
      bom_template_id: id,
      version: 1,
      yarn_catalog_id: item.yarn_catalog_id,
      ratio_pct: item.ratio_pct,
      consumption_kg_per_m: item.consumption_kg_per_m,
      notes: item.notes,
      sort_order: item.sort_order || index,
    }))

    const { error: insErr } = await supabase
      .from('bom_yarn_items')
      .insert(itemsToInsert)
    if (insErr) throw insErr
  }

  return id
}

/* ── Approve BOM ── */

export async function approveBom(id: string, reason?: string): Promise<string> {
  const auth = await supabase.auth.getUser()
  const userId = auth.data.user?.id

  const { data: bom, error: checkErr } = await supabase
    .from('bom_templates')
    .select('*, bom_yarn_items(*)')
    .eq('id', id)
    .single()
  if (checkErr) throw checkErr
  if (bom.status !== 'draft') {
    throw new Error('BOM đã được duyệt hoặc huỷ, không thể duyệt lại.')
  }
  if (!bom.bom_yarn_items || bom.bom_yarn_items.length === 0) {
    throw new Error('Không thể duyệt BOM rỗng chưa có thành phần sợi.')
  }

  const totalRatio = (bom.bom_yarn_items as BomYarnItem[]).reduce((sum, item) => sum + item.ratio_pct, 0)
  if (Math.abs(totalRatio - 100) > 0.01) {
    throw new Error('Tổng tỉ lệ nguyên liệu phải bằng 100%.')
  }

  const now = new Date().toISOString()

  const snapshotPayload = {
    bom_yarn_items: bom.bom_yarn_items,
    target_width_cm: bom.target_width_cm,
    target_gsm: bom.target_gsm,
    standard_loss_pct: bom.standard_loss_pct,
  }

  const { error: vErr } = await supabase
    .from('bom_versions')
    .insert([{
      bom_template_id: id,
      version: bom.active_version,
      change_reason: reason || 'Phê duyệt ban đầu',
      snapshot: snapshotPayload,
      created_by: userId,
    }])
  if (vErr) throw vErr

  const { error: updErr } = await supabase
    .from('bom_templates')
    .update({
      status: 'approved',
      approved_by: userId,
      approved_at: now,
      updated_at: now,
    })
    .eq('id', id)
  if (updErr) throw updErr

  return id
}

/* ── Deprecate BOM ── */

export async function deprecateBom(id: string, reason: string): Promise<string> {
  if (!reason) throw new Error('Bắt buộc phải có lý do khi ngưng áp dụng (Báo Phế).')

  const { error } = await supabase
    .from('bom_templates')
    .update({
      status: 'deprecated',
      notes: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw error
  return id
}

/* ── Revise BOM (create new version) ── */

export async function reviseBom(id: string, reason: string): Promise<string> {
  if (!reason) throw new Error('Bày tỏ lý do vì sao lập phiên bản mới.')

  const { data: bom, error: bomErr } = await supabase
    .from('bom_templates')
    .select('*, bom_yarn_items(*)')
    .eq('id', id)
    .single()
  if (bomErr) throw bomErr
  if (bom.status !== 'approved') throw new Error('Chỉ lập version mới từ BOM đang duyệt.')

  const newVersion = bom.active_version + 1

  const { error: updErr } = await supabase
    .from('bom_templates')
    .update({
      status: 'draft',
      active_version: newVersion,
      notes: reason,
      approved_by: null,
      approved_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (updErr) throw updErr

  if (bom.bom_yarn_items && bom.bom_yarn_items.length > 0) {
    const { error: itemsErr } = await supabase
      .from('bom_yarn_items')
      .update({ version: newVersion })
      .eq('bom_template_id', id)
    if (itemsErr) throw itemsErr
  }

  return id
}
