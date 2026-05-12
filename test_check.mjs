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
    .select('id')
    .eq('receipt_number', 'NS-034');
  
  if (receipts && receipts.length > 0) {
    const { data: items } = await supabase
      .from('yarn_receipt_items')
      .select('*')
      .eq('receipt_id', receipts[0].id);
    console.log(JSON.stringify(items, null, 2));
  }
}
check();
