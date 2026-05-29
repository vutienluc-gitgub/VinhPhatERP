import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://aws-1-ap-northeast-1.pooler.supabase.com',
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await supabase
    .from('looms')
    .select('*, supplier:suppliers(id, code, name), production_state:loom_production_states(efficiency_pct, current_work_order:work_orders(work_order_number, order:orders(order_number)))')
    .limit(1);

  if (error) {
    console.error('Supabase Error:', JSON.stringify(error, null, 2));
  } else {
    console.log('Success, found records:', data.length);
  }
}
run();
