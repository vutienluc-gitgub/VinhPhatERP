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
import { safeUpsert } from '@/lib/db-guard';

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
  await safeUpsert({
    table: TABLE,
    data: rows,
    conflictKey: 'key',
  });
}
