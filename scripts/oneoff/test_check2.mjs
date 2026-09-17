import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data: receipts } = await supabase
    .from('yarn_receipts')
    .select('*')
    .eq('receipt_number', 'NS-034');
  console.log(JSON.stringify(receipts, null, 2));
}
check();
