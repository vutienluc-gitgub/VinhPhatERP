import type {
  CompanySettingRow,
  CompanySettingsFormValues,
  CompanySettingsMap,
} from '@/schema/company-settings.schema';
import {
  rowsToSettingsMap,
  settingsMapToUpsertRows,
} from '@/schema/company-settings.schema';
import { untypedDb as supa } from '@/services/supabase/untyped';

const TABLE = 'company_settings';

export async function fetchCompanySettings(): Promise<CompanySettingsMap> {
  const { data, error } = await supa.from(TABLE).select('*').order('key');
  if (error) throw error;
  return rowsToSettingsMap((data ?? []) as unknown as CompanySettingRow[]);
}

export async function upsertCompanySettings(
  values: CompanySettingsFormValues,
): Promise<void> {
  const rows = settingsMapToUpsertRows(values);
  for (const row of rows) {
    const { error } = await supa
      .from(TABLE)
      .update({ value: row.value })
      .eq('key', row.key);

    if (error) {
      const { error: insertErr } = await supa.from(TABLE).insert({
        key: row.key,
        value: row.value,
      });
      if (insertErr) throw insertErr;
    }
  }
}
