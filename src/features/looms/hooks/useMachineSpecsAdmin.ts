import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { untypedDb as supabase } from '@/services/supabase/untyped';
import { safeUpsert } from '@/lib/db-guard';
import type { MachineSpecification } from '@/schema/yarn-engineering.schema';

export function useMachineSpecsAdmin() {
  return useQuery({
    queryKey: ['machine-specs-admin'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      const { data, error } = await (supabase.from as any)(
        'machine_specifications',
      )
        .select('*')
        .order('is_active', { ascending: false })
        .order('diameter', { ascending: true })
        .order('gauge', { ascending: true });

      if (error) throw error;
      return data as MachineSpecification[];
    },
  });
}

export function useUpsertMachineSpec() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: MachineSpecification) => {
      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(
          ([_, v]) => v !== '' && v !== undefined && v !== null,
        ),
      ) as unknown as MachineSpecification;

      return await safeUpsert({
        table: 'machine_specifications',
        data: cleanPayload,
        conflictKey: 'id',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machine-specs-admin'] });
      queryClient.invalidateQueries({ queryKey: ['machine-specifications'] }); // invalidates dropdowns
      toast.success('Lưu cấu hình máy thành công');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Lỗi: ${message}`);
      console.error('[MachineSpecMutation]', error);
    },
  });
}

export function useToggleMachineSpecStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    mutationFn: async ({
      id,
      is_active,
    }: {
      id: string;
      is_active: boolean;
    }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      const { error } = await (supabase.from as any)('machine_specifications')
        .update({ is_active })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['machine-specs-admin'] });
      queryClient.invalidateQueries({ queryKey: ['machine-specifications'] });
      toast.success(
        variables.is_active ? 'Đã khôi phục cấu hình' : 'Đã ẩn cấu hình',
      );
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Lỗi: ${message}`);
      console.error('[MachineSpecToggle]', error);
    },
  });
}
