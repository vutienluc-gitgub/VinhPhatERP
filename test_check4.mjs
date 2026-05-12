import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data: receipts } = await supabase
    .from('yarn_receipt_items')
    .select('id, tenant_id')
    .eq('receipt_id', 'ea6adb3d-e8ae-482c-9d97-0b2b2f1d7021');
  console.log('Service Items:', JSON.stringify(receipts, null, 2));
}
check();
