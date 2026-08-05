import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { untypedDb as supabase } from '@/services/supabase/untyped';
import { safeUpsert } from '@/lib/db-guard';
import type {
  FabricStructure,
  MachineSpecification,
  YarnKnittingEngineering,
} from '@/schema/yarn-engineering.schema';

export function useFabricStructures() {
  return useQuery({
    queryKey: ['fabric-structures'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fabric_structures')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as FabricStructure[];
    },
  });
}

export function useMachineSpecs() {
  return useQuery({
    queryKey: ['machine-specifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('machine_specifications')
        .select('*')
        .order('machine_type');

      if (error) throw error;
      return data as MachineSpecification[];
    },
  });
}

export function useYarnKnittingEngineering(yarnId?: string) {
  return useQuery({
    queryKey: ['yarn-knitting-engineering', yarnId],
    enabled: !!yarnId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('yarn_knitting_engineering')
        .select(
          `
          *,
          fabric_structure:fabric_structures(*),
          machine_spec:machine_specifications(*)
        `,
        )
        .eq('yarn_id', yarnId!);

      if (error) throw error;
      return data as (YarnKnittingEngineering & {
        fabric_structure: FabricStructure;
        machine_spec: MachineSpecification;
      })[];
    },
  });
}

export function useUpsertYarnKnittingEngineering() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: YarnKnittingEngineering) => {
      // Omit empty string fields to prevent type errors for UUIDs and Enums
      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(
          ([_, v]) => v !== '' && v !== undefined && v !== null,
        ),
      ) as unknown as YarnKnittingEngineering;

      return await safeUpsert({
        table: 'yarn_knitting_engineering',
        data: cleanPayload,
        conflictKey: 'id', // Wait, id might be undefined for new records
        // If id is missing, safeUpsert might fail if it strictly requires it.
        // We actually want a unique constraint upsert or just insert if no ID.
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['yarn-knitting-engineering', variables.yarn_id],
      });
      toast.success('Lưu cấu hình kỹ thuật thành công');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Lỗi: ${message}`);
      console.error('[YarnEngineeringMutation]', error);
    },
  });
}

export function useDeleteYarnKnittingEngineering() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('yarn_knitting_engineering')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['yarn-knitting-engineering'],
      });
      toast.success('Đã xóa cấu hình kỹ thuật');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Lỗi: ${message}`);
      console.error('[YarnEngineeringDelete]', error);
    },
  });
}
