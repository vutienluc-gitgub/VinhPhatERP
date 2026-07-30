import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  const { data: tenants } = await supabase.from('tenants').select('id');
  if (!tenants || tenants.length === 0) {
    console.error('No tenants found.');
    return;
  }

  const tenantIds =
    tenants && tenants.length > 0 ? tenants.map((t) => t.id) : [null];

  for (const tenantId of tenantIds) {
    const payload = {
      tenant_id: tenantId,
      code: 'CVC20/1W',
      name: 'Sợi CVC 20/1 W',
      category: 'Blend',
      yarn_type: 'SPN',
      count_ne: 'Ne 20',
      composition: '60% CO + 40% PE',
      color_status: 'raw_white',
      status: 'active',
      unit: 'kg',
      is_fancy: false,
      notes: 'CONTAMINATION-FREE, Lot No: XC3-CF262137N, Cone Colour: OFF',
    };

    console.log(`Inserting for tenant: ${tenantId}...`);
    try {
      const { data: existing } = await supabase
        .from('yarn_catalogs')
        .select('id')
        .eq('code', payload.code)
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (existing) {
        const { error: updErr } = await supabase
          .from('yarn_catalogs')
          .update(payload)
          .eq('id', existing.id);
        if (updErr) {
          console.error(
            `Update failed for tenant ${tenantId}:`,
            updErr.message,
          );
        } else {
          console.log(
            `Successfully updated CVC yarn in catalog for tenant ${tenantId}.`,
          );
        }
      } else {
        const { error: insErr } = await supabase
          .from('yarn_catalogs')
          .insert(payload);
        if (insErr) {
          console.error(
            `Insert failed for tenant ${tenantId}:`,
            insErr.message,
          );
        } else {
          console.log(
            `Successfully inserted CVC yarn into catalog for tenant ${tenantId}.`,
          );
        }
      }
    } catch (err: any) {
      console.error(`Error for tenant ${tenantId}:`, err.message);
    }
  }
}

main().catch(console.error);
