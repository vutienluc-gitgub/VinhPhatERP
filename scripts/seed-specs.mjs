import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
  if (!tenants || tenants.length === 0) return;
  const tenant_id = tenants[0].id;
  
  // Seed some dummy machine specs
  const dummySpecs = [
    {
      tenant_id,
      code: 'SJ-34-28-96',
      machine_type: 'single_jersey',
      diameter: 34,
      gauge: 28,
      feeder_count: 96,
      manufacturer: 'Terrot',
      machine_family: 'Single Jersey',
      source_type: 'auto_generated',
      is_active: true
    },
    {
      tenant_id,
      code: 'RIB-30-24-90',
      machine_type: 'rib',
      diameter: 30,
      gauge: 24,
      feeder_count: 90,
      manufacturer: 'Mayer & Cie',
      machine_family: 'Rib',
      source_type: 'manual',
      is_active: true
    }
  ];
  
  for (const spec of dummySpecs) {
    const { error } = await supabase.from('machine_specifications').insert(spec);
    if (error) console.error('Insert error:', error);
    else console.log('Inserted:', spec.code);
  }
}
main();
