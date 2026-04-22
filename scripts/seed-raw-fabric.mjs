import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load env
const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const serviceMatch = env.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=(.*)/);
if (!urlMatch || !serviceMatch) {
  console.error('Missing Supabase config');
  process.exit(1);
}
const supabaseUrl = urlMatch[1].trim().replace(/['\"]+/g, '');
const serviceKey = serviceMatch[1].trim().replace(/['\"]+/g, '');

const supabase = createClient(supabaseUrl, serviceKey);

async function run() {
  // Get tenant (fallback to first)
  const tenantSlug = 'default';
  let { data: tenant, error } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', tenantSlug)
    .single();
  if (error) {
    const fallback = await supabase.from('tenants').select('id').limit(1).single();
    if (fallback.error) {
      console.error('Cannot resolve tenant', fallback.error);
      return;
    }
    tenant = fallback.data;
  }
  const tenantId = tenant.id;
  console.log('Using tenant_id', tenantId);

  const roll = {
    roll_number: 'TEST-ROLL-001',
    fabric_type: 'Cotton',
    weight_kg: 10.5,
    length_m: 50,
    quality_grade: 'A',
    warehouse_location: 'WH-01',
    lot_number: 'LOT-001',
    status: 'in_stock',
    tenant_id: tenantId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data: inserted, error: insErr } = await supabase.from('raw_fabric_rolls').insert([roll]).select();
  if (insErr) {
    console.error('Insert error', insErr);
  } else {
    console.log('Inserted roll', inserted);
  }
}

run();
