import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase/client';
import type { PostgrestError } from '@supabase/supabase-js';
import type {
  WorkOrder,
  WorkOrderWithRelations,
  WorkOrderFilter,
  WorkOrderYarnRequirementWithRelations
} from './types';
import type { CreateWorkOrderInput, CompleteWorkOrderInput } from './work-orders.module';
import type { BomYarnItem } from '../bom/types';

export function useWorkOrders(filter?: WorkOrderFilter, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['work_orders', filter, page, pageSize],
    queryFn: async () => {
      let query = supabase
        .from('work_orders')
        .select(`
          *,
          bom_template:bom_templates(
            id, code, name,
            target_fabric:fabric_catalogs(id, code, name)
          ),
          order:orders(
            id, order_number,
            customer:customers(id, name)
          )
        `, { count: 'exact' });

      if (filter?.status && filter.status !== 'all') {
        query = query.eq('status', filter.status);
      }

      if (filter?.search) {
        query = query.ilike('work_order_number', `%${filter.search}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { data: (data || []) as WorkOrderWithRelations[], count: count || 0 };
    },
  });
}

export function useWorkOrderDetail(id: string) {
  return useQuery({
    queryKey: ['work_order', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('work_orders')
        .select(`
          *,
          bom_template:bom_templates(
            id, code, name, target_width_cm, target_gsm,
            target_fabric:fabric_catalogs(id, code, name)
          ),
          order:orders(
            id, order_number,
            customer:customers(id, name)
          )
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as unknown as WorkOrderWithRelations;
    },
    enabled: !!id,
  });
}

export function useWorkOrderRequirements(workOrderId: string) {
  return useQuery({
    queryKey: ['work_order_requirements', workOrderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('work_order_y_requirements')
        .select(`
          *,
          yarn_catalog:yarn_catalogs(id, code, name, color_name)
        `)
        .eq('work_order_id', workOrderId)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      return (data || []) as WorkOrderYarnRequirementWithRelations[];
    },
    enabled: !!workOrderId,
  });
}

export function useCreateWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation<WorkOrder, PostgrestError, CreateWorkOrderInput>({
    mutationFn: async (input) => {
      // 1. Fetch the selected BOM template to get active_version and loss_pct
      const { data: bom, error: bomError } = await supabase
        .from('bom_templates')
        .select('*')
        .eq('id', input.bom_template_id)
        .single();
      if (bomError) throw bomError;
      if (bom.status !== 'approved') throw new Error('Chỉ được phép dùng BOM đã được duyệt (Approved).');

      const bomVersion = bom.active_version;
      const lossPct = bom.standard_loss_pct || 0;

      // 2. Fetch Yarn Items in that BOM Version
      const { data: bomYarns, error: yarnError } = await supabase
        .from('bom_yarn_items')
        .select('*')
        .eq('bom_template_id', input.bom_template_id)
        .eq('version', bomVersion);
      if (yarnError) throw yarnError;
      if (!bomYarns || bomYarns.length === 0) throw new Error('BOM không có định mức sợi nào.');

      // 3. Create the Work Order
      let targetKg = input.target_weight_kg || 0;

      // If weight is not provided, calculate from BOM consumption
      if (targetKg === 0 && input.target_quantity_m > 0) {
        const totalConsumptionPerM = bomYarns.reduce((sum, item) => sum + (item.consumption_kg_per_m || 0), 0);
        targetKg = input.target_quantity_m * totalConsumptionPerM;
      }

      const { data: workOrder, error: createError } = await supabase
        .from('work_orders')
        .insert({
          work_order_number: input.work_order_number,
          order_id: input.order_id || null,
          bom_template_id: input.bom_template_id,
          bom_version: bomVersion,
          target_quantity_m: input.target_quantity_m,
          target_weight_kg: targetKg,
          standard_loss_pct: lossPct,
          status: 'draft',
          start_date: input.start_date || null,
          end_date: input.end_date || null,
          notes: input.notes || null,
        })
        .select()
        .single();
      if (createError) throw createError;

      // 4. Calculate and generate Yarn Requirements
      if (targetKg > 0) {
        // Required Yarn = Target Kg / (1 - LossPct/100)
        const totalRequiredYarnKg = targetKg / (1 - lossPct / 100);
        
        const reqInserts = (bomYarns as BomYarnItem[]).map((yarn) => ({
          work_order_id: workOrder.id,
          yarn_catalog_id: yarn.yarn_catalog_id,
          bom_ratio_pct: yarn.ratio_pct,
          required_kg: totalRequiredYarnKg * (yarn.ratio_pct / 100),
          allocated_kg: 0,
        }));

        const { error: reqError } = await supabase
          .from('work_order_y_requirements')
          .insert(reqInserts);
          
        if (reqError) {
          // Rollback mechanism could go here if server-side transaction wasn't used
          console.error("Failed to allocate yarn requirements", reqError);
        }
      }

      return workOrder as WorkOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work_orders'] });
    },
  });
}

export function useStartWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation<WorkOrder, PostgrestError, string>({
    mutationFn: async (id) => {
      const { data, error } = await supabase
        .from('work_orders')
        .update({ status: 'in_progress', start_date: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as WorkOrder;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['work_orders'] });
      queryClient.invalidateQueries({ queryKey: ['work_order', data.id] });
    },
  });
}

export function useCompleteWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation<WorkOrder, PostgrestError, { id: string, input: CompleteWorkOrderInput }>({
    mutationFn: async ({ id, input }) => {
      const { data, error } = await supabase
        .from('work_orders')
        .update({ 
          status: 'completed',
          actual_yield_m: input.actual_yield_m,
          end_date: new Date().toISOString()
          // Note: actual_loss_pct would require comparing yarn allocated_kg vs actual_yield_m
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as WorkOrder;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['work_orders'] });
      queryClient.invalidateQueries({ queryKey: ['work_order', data.id] });
    },
  });
}

export function useCancelWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation<WorkOrder, PostgrestError, string>({
    mutationFn: async (id) => {
      const { data, error } = await supabase
        .from('work_orders')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as WorkOrder;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['work_orders'] });
      queryClient.invalidateQueries({ queryKey: ['work_order', data.id] });
    },
  });
}
