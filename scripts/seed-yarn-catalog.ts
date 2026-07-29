import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!; // Use service role key to bypass RLS
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  const { data: tenants } = await supabase.from('tenants').select('id');
  if (!tenants || tenants.length === 0) {
    console.error(
      'No tenants found in the database. Seeding will fail if RLS requires it, assuming public schema.',
    );
  }

  const mockYarns = [
    {
      code: 'YS-MOCK-001',
      name: 'Sợi DTY 75D/72F Raw',
      denier: '75D',
      filament_count: '72F',
      yarn_type: 'DTY',
      color_status: 'raw_white',
      finish: 'semi_dull',
      intermingle: 'SIM',
    },
    {
      code: 'YS-MOCK-002',
      name: 'Sợi DTY 75D/144F Raw',
      denier: '75D',
      filament_count: '144F',
      yarn_type: 'DTY',
      color_status: 'raw_white',
      finish: 'semi_dull',
      intermingle: 'SIM',
    },
    {
      code: 'YS-MOCK-003',
      name: 'Sợi DTY 100D/96F Raw',
      denier: '100D',
      filament_count: '96F',
      yarn_type: 'DTY',
      color_status: 'raw_white',
      finish: 'semi_dull',
      intermingle: 'NIM',
    },
    {
      code: 'YS-MOCK-004',
      name: 'Sợi DTY 100D/144F Raw',
      denier: '100D',
      filament_count: '144F',
      yarn_type: 'DTY',
      color_status: 'raw_white',
      finish: 'semi_dull',
      intermingle: 'SIM',
    },
    {
      code: 'YS-MOCK-005',
      name: 'Sợi DTY 150D/48F Raw',
      denier: '150D',
      filament_count: '48F',
      yarn_type: 'DTY',
      color_status: 'raw_white',
      finish: 'semi_dull',
      intermingle: 'NIM',
    },
    {
      code: 'YS-MOCK-006',
      name: 'Sợi DTY 150D/48F DDB',
      denier: '150D',
      filament_count: '48F',
      yarn_type: 'DTY',
      color_status: 'dope_dyed',
      finish: 'semi_dull',
      intermingle: 'NIM',
    },
    {
      code: 'YS-MOCK-007',
      name: 'Sợi DTY 150D/144F Raw',
      denier: '150D',
      filament_count: '144F',
      yarn_type: 'DTY',
      color_status: 'raw_white',
      finish: 'semi_dull',
      intermingle: 'SIM',
    },
    {
      code: 'YS-MOCK-008',
      name: 'Sợi DTY 200D/288F Raw',
      denier: '200D',
      filament_count: '288F',
      yarn_type: 'DTY',
      color_status: 'raw_white',
      finish: 'semi_dull',
      intermingle: 'SIM',
    },
    {
      code: 'YS-MOCK-009',
      name: 'Sợi DTY 300D/96F Raw',
      denier: '300D',
      filament_count: '96F',
      yarn_type: 'DTY',
      color_status: 'raw_white',
      finish: 'semi_dull',
      intermingle: 'NIM',
    },
    {
      code: 'YS-MOCK-010',
      name: 'Sợi DTY 300D/96F Raw HIM',
      denier: '300D',
      filament_count: '96F',
      yarn_type: 'DTY',
      color_status: 'raw_white',
      finish: 'semi_dull',
      intermingle: 'HIM',
    },
  ];

  const tenantIds =
    tenants && tenants.length > 0 ? tenants.map((t) => t.id) : [null];

  for (const tenantId of tenantIds) {
    console.log(`\n--- Seeding for tenant: ${tenantId} ---`);
    for (const yarn of mockYarns) {
      const payload = {
        tenant_id: tenantId,
        code: yarn.code,
        name: yarn.name,
        denier: yarn.denier,
        filament_count: yarn.filament_count,
        yarn_type: yarn.yarn_type,
        color_status: yarn.color_status,
        finish: yarn.finish,
        intermingle: yarn.intermingle,
        status: 'active',
        unit: 'kg',
        category: 'Polyester',
        is_fancy: false,
      };

      console.log(`Inserting: ${yarn.code}...`);
      try {
        const { error } = await supabase
          .from('yarn_catalogs')
          .upsert({ ...payload }, { onConflict: 'code' });
        if (error) throw error;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.log(
          'Upsert failed, falling back to manual insert/update:',
          message,
        );
        // We have to be careful with unique 'code' constraint if we have multiple tenants.
        // Usually code is unique per tenant.
        const { data: existing } = await supabase
          .from('yarn_catalogs')
          .select('id')
          .eq('code', yarn.code)
          .eq('tenant_id', tenantId)
          .maybeSingle();
        if (existing) {
          const { error: updErr } = await supabase
            .from('yarn_catalogs')
            .update(payload)
            .eq('id', existing.id);
          if (updErr) console.error('Update failed:', updErr.message);
        } else {
          const { error: insErr } = await supabase
            .from('yarn_catalogs')
            .insert(payload);
          if (insErr) console.error('Insert failed:', insErr.message);
        }
      }
    }
  }

  console.log('Done seeding mock yarns.');
}

main().catch(console.error);
