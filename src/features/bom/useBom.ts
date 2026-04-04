import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../services/supabase/client';
import { BomTemplate, BomVersion, BomFilter, FabricCatalog } from './types';
import { BomTemplateFormData } from './bom.module';

// Query keys
export const bomKeys = {
  all: ['bom'] as const,
  lists: () => [...bomKeys.all, 'list'] as const,
  list: (filters: BomFilter) => [...bomKeys.lists(), filters] as const,
  details: () => [...bomKeys.all, 'detail'] as const,
  detail: (id: string) => [...bomKeys.details(), id] as const,
  versions: (id: string) => [...bomKeys.all, 'versions', id] as const,
  fabricCatalogs: () => ['fabric_catalogs'] as const,
  yarnCatalogs: () => ['yarn_catalogs'] as const,
};

// ---------------------------------------------------------
// Queries
// ---------------------------------------------------------

export function useFabricCatalogs() {
  return useQuery({
    queryKey: bomKeys.fabricCatalogs(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fabric_catalogs')
        .select('*')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data as FabricCatalog[];
    },
  });
}

export function useYarnCatalogs() {
  return useQuery({
    queryKey: bomKeys.yarnCatalogs(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('yarn_catalogs')
        .select('*')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data;
    },
  });
}

export function useBomList(filters: BomFilter) {
  return useQuery({
    queryKey: bomKeys.list(filters),
    queryFn: async () => {
      let query = supabase
        .from('bom_templates')
        .select(`
          *,
          bom_yarn_items (*),
          fabric_catalogs (code, name),
          created_by_profile:profiles!created_by (full_name),
          approved_by_profile:profiles!approved_by (full_name)
        `)
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
          item =>
            item.code.toLowerCase().includes(search) ||
            item.name.toLowerCase().includes(search) ||
            item.fabric_catalogs?.name.toLowerCase().includes(search)
        );
      }

      return result as BomTemplate[];
    },
  });
}

export function useBomDetail(id: string | null) {
  return useQuery({
    queryKey: bomKeys.detail(id!),
    enabled: !!id,
    queryFn: async () => {
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
        .eq('id', id!)
        .single();
      
      if (error) throw error;
      return data as BomTemplate;
    },
  });
}

export function useBomVersions(templateId: string | null) {
  return useQuery({
    queryKey: bomKeys.versions(templateId!),
    enabled: !!templateId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bom_versions')
        .select(`
          *,
          created_by_profile:profiles!created_by (full_name)
        `)
        .eq('bom_template_id', templateId!)
        .order('version', { ascending: false });
        
      if (error) throw error;
      return data as BomVersion[];
    }
  });
}

// ---------------------------------------------------------
// Task-Based Mutations (No traditional CRUD)
// ---------------------------------------------------------

export function useDraftBom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: BomTemplateFormData) => {
      const auth = await supabase.auth.getUser();
      const userId = auth.data.user?.id;

      const { bom_yarn_items, ...headerData } = data;

      // 1. Insert header
      const { data: header, error: headerError } = await supabase
        .from('bom_templates')
        .insert([{
           ...headerData,
           status: 'draft',
           active_version: 1,
           created_by: userId,
        }])
        .select()
        .single();

      if (headerError) throw headerError;

      // 2. Insert items
      if (bom_yarn_items && bom_yarn_items.length > 0) {
        const itemsToInsert = bom_yarn_items.map((item, index) => ({
          bom_template_id: header.id,
          version: 1,
          yarn_catalog_id: item.yarn_catalog_id,
          ratio_pct: item.ratio_pct,
          consumption_kg_per_m: item.consumption_kg_per_m,
          notes: item.notes,
          sort_order: item.sort_order || index,
        }));

        const { error: itemsError } = await supabase
          .from('bom_yarn_items')
          .insert(itemsToInsert);

        if (itemsError) {
          // Rollback header if items fail
          await supabase.from('bom_templates').delete().eq('id', header.id);
          throw itemsError;
        }
      }

      return header;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bomKeys.all });
    },
  });
}

export function useUpdateDraftBom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: BomTemplateFormData }) => {
      // 1. Verify status is draft
      const { data: existing, error: checkErr } = await supabase
        .from('bom_templates')
        .select('status')
        .eq('id', id)
        .single();
      
      if (checkErr) throw checkErr;
      if (existing.status !== 'draft') {
        throw new Error('Chỉ có thể sửa khi BOM đang ở trạng thái Nháp (Draft).');
      }

      const { bom_yarn_items, ...headerData } = data;

      // 2. Update header
      const { error: updateErr } = await supabase
        .from('bom_templates')
        .update({
          ...headerData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
        
      if (updateErr) throw updateErr;

      // 3. Replace all items for this draft version
      const { error: delErr } = await supabase
        .from('bom_yarn_items')
        .delete()
        .eq('bom_template_id', id);
        
      if (delErr) throw delErr;

      if (bom_yarn_items && bom_yarn_items.length > 0) {
        const itemsToInsert = bom_yarn_items.map((item, index) => ({
          bom_template_id: id,
          version: 1, // Updating draft version 1
          yarn_catalog_id: item.yarn_catalog_id,
          ratio_pct: item.ratio_pct,
          consumption_kg_per_m: item.consumption_kg_per_m,
          notes: item.notes,
          sort_order: item.sort_order || index,
        }));

        const { error: insErr } = await supabase
          .from('bom_yarn_items')
          .insert(itemsToInsert);

        if (insErr) throw insErr;
      }

      return id;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: bomKeys.all });
      queryClient.invalidateQueries({ queryKey: bomKeys.detail(variables.id) });
    },
  });
}

export function useApproveBom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const auth = await supabase.auth.getUser();
      const userId = auth.data.user?.id;

      // 1. Fetch current draft details
      const { data: bom, error: checkErr } = await supabase
        .from('bom_templates')
        .select('*, bom_yarn_items(*)')
        .eq('id', id)
        .single();

      if (checkErr) throw checkErr;
      if (bom.status !== 'draft') {
        throw new Error('BOM đã được duyệt hoặc huỷ, không thể duyệt lại.');
      }
      if (!bom.bom_yarn_items || bom.bom_yarn_items.length === 0) {
         throw new Error('Không thể duyệt BOM rỗng chưa có thành phần sợi.');
      }
      
      const totalRatio = bom.bom_yarn_items.reduce((sum, item) => sum + item.ratio_pct, 0);
      if (Math.abs(totalRatio - 100) > 0.01) {
         throw new Error('Tổng tỉ lệ nguyên liệu phải bằng 100%.');
      }

      const now = new Date().toISOString();

      // 2. Snapshot into bom_versions
      const snapshotPayload = {
         bom_yarn_items: bom.bom_yarn_items,
         target_width_cm: bom.target_width_cm,
         target_gsm: bom.target_gsm,
         standard_loss_pct: bom.standard_loss_pct,
      };

      const { error: vErr } = await supabase
        .from('bom_versions')
        .insert([{
          bom_template_id: id,
          version: bom.active_version,
          change_reason: reason || 'Phê duyệt ban đầu',
          snapshot: snapshotPayload,
          created_by: userId,
        }]);

      if (vErr) throw vErr;

      // 3. Mark as approved
      const { error: updErr } = await supabase
        .from('bom_templates')
        .update({
          status: 'approved',
          approved_by: userId,
          approved_at: now,
          updated_at: now
        })
        .eq('id', id);

      if (updErr) throw updErr;

      return id;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: bomKeys.all });
      queryClient.invalidateQueries({ queryKey: bomKeys.detail(variables.id) });
    },
  });
}

export function useDeprecateBom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      if (!reason) throw new Error('Bắt buộc phải có lý do khi ngưng áp dụng (Báo Phế).');
      
      const { error } = await supabase
        .from('bom_templates')
        .update({ 
           status: 'deprecated',
           notes: reason,
           updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: bomKeys.all });
      queryClient.invalidateQueries({ queryKey: bomKeys.detail(variables.id) });
    },
  });
}

export function useReviseBom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      if (!reason) throw new Error('Bày tỏ lý do vì sao lập phiên bản mới.');
      // 1. Get current BOM
      const { data: bom, error: bomErr } = await supabase
        .from('bom_templates')
        .select(`*, bom_yarn_items(*)`)
        .eq('id', id)
        .single();
        
      if (bomErr) throw bomErr;
      if (bom.status !== 'approved') throw new Error('Chỉ lập version mới từ BOM đang duyệt.');
      
      const newVersion = bom.active_version + 1;
      
      // We will clone this BOM into a NEW BOM entirely with -V2 suffix? 
      // OR in Textile ERP "bom_template" holds its identity, so we just increment active_version
      // and reset status back to "draft" for approval? 
      // Let's increment version, set status to draft, and let them update it.
      
      const { error: updErr } = await supabase
        .from('bom_templates')
        .update({
          status: 'draft', // Needs to be approved again
          active_version: newVersion,
          notes: reason,
          approved_by: null,
          approved_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
        
      if (updErr) throw updErr;
      
      // Update the yarn items to have the new version mapped
      // We just change their version number in DB so they belong to version 2
      if (bom.bom_yarn_items && bom.bom_yarn_items.length > 0) {
        const { error: itemsErr } = await supabase
          .from('bom_yarn_items')
          .update({ version: newVersion })
          .eq('bom_template_id', id);
          
        if (itemsErr) throw itemsErr;
      }
      
      return id;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: bomKeys.all });
      queryClient.invalidateQueries({ queryKey: bomKeys.detail(variables.id) });
    },
  });
}
