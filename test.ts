import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY,
);

async function test() {
  const { data, error } = await supabase.rpc('current_tenant_id');
  console.log('Current Tenant ID:', data);
  console.log('Error:', error);
}

test();
