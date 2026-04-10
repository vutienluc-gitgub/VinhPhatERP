import { untypedDb } from '@/services/supabase/untyped';
import type { ColorFormValues, ColorInsert } from '@/schema/color.schema';

export const colorApi = {
  list: async () => {
    const { data, error } = await untypedDb
      .from('colors')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  upsert: async (values: ColorFormValues) => {
    const payload: ColorInsert = {
      code: values.code.trim().toUpperCase(),
      name: values.name.trim(),
      note: values.note || null,
      trend_year: values.trend_year || null,
    };

    const { data, error } = await untypedDb
      .from('colors')
      .upsert(payload, { onConflict: 'code' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  delete: async (code: string) => {
    const { error } = await untypedDb.from('colors').delete().eq('code', code);

    if (error) throw error;
  },
};
