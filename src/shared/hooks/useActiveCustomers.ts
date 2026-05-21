import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/services/supabase/client';

/**
 * Shared hook to fetch active customers for pickers/selects.
 * Used by both orders and quotations features.
 */
export function useActiveCustomers() {
  return useQuery({
    queryKey: ['customers', 'active-list'],
    queryFn: async () => {
      let query = supabase
        .from('customers')
        .select('id, code, name')
        .eq('status', 'active')
        .order('name');

      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, employee_id')
          .eq('id', userData.user.id)
          .single();
        if (profile?.role === 'sale' && profile.employee_id) {
          query = query.eq('salesperson_id', profile.employee_id);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}
