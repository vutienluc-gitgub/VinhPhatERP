import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const untypedDb = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: tenantData } = await untypedDb.from('tenants').select('id').limit(1).single();
  const tenantId = tenantData.id;

  let { data: supplierData } = await untypedDb.from('suppliers').select('id').limit(1).single();
  
  if (!supplierData) {
    const { data: sData } = await untypedDb.from('suppliers').insert([{
      tenant_id: tenantId,
      code: 'TEST-SUPPLIER',
      name: 'Test Supplier',
      supplier_type: 'yarn',
      phone: '123'
    }]).select('id').single();
    supplierData = sData;
  }

  const row = {
    tenant_id: tenantId,
    code: 'TEST-LOOM-999',
    name: 'Test Loom',
    loom_type: 'rapier',
    supplier_id: supplierData.id,
    status: 'active'
  };

  const { data, error } = await untypedDb
    .from('looms')
    .insert([row])
    .select('*, supplier:suppliers(id, code, name)')
    .single();

  console.log("ERROR:", error);

  if (!error && data) {
    await untypedDb.from('looms').delete().eq('id', data.id);
  }
}

test();
