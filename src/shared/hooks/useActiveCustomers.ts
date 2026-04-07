import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/services/supabase/client'

/**
 * Shared hook to fetch active customers for pickers/selects.
 * Used by both orders and quotations features.
 */
export function useActiveCustomers() {
  return useQuery({
    queryKey: ['customers', 'active-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, code, name')
        .eq('status', 'active')
        .order('name')
      if (error) throw error
      return data ?? []
    },
  })
}
