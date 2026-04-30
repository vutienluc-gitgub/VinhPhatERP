import { supabase } from '@/services/supabase/client';
import type { ColorFormValues } from '@/schema/color.schema';
import { getTenantId } from '@/services/supabase/tenant';

export const colorApi = {
  list: async () => {
    const { data, error } = await supabase
      .from('colors')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  upsert: async (values: ColorFormValues) => {
    const tenantId = await getTenantId();
    const payload = {
      code: values.code.trim().toUpperCase(),
      name: values.name.trim(),
      note: values.note || null,
      trend_year: values.trend_year || null,
      tenant_id: tenantId,
    };

    const { data, error } = await supabase
      .from('colors')
      .upsert(payload, { onConflict: 'code' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  delete: async (code: string) => {
    const { error } = await supabase.from('colors').delete().eq('code', code);

    if (error) throw error;
  },
};
