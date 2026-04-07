
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '..', '.env.local');
let supabaseUrl, supabaseKey;

try {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    if (line.includes('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
    if (line.includes('VITE_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
  }
} catch (e) {
  console.error(e);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  const tables = ['orders', 'work_orders', 'order_progress'];
  for (const table of tables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`${table}: Error ${error.message}`);
    } else {
      console.log(`${table}: ${count} rows`);
    }
  }

  // Check if any work_order has order_id = null
  const { count, error } = await supabase.from('work_orders').select('*', { count: 'exact', head: true }).is('order_id', null);
  console.log(`Standalone Work Orders (order_id IS NULL): ${count}`);

  // Fetch some sample work orders
  const { data: woData } = await supabase.from('work_orders').select('id, work_order_number, order_id').limit(5);
  console.log("Sample work orders:", JSON.stringify(woData, null, 2));

  // Fetch some order_progress items
  const { data: opData } = await supabase.from('order_progress').select('*').limit(5);
  console.log("Sample order progress:", JSON.stringify(opData, null, 2));
}

runTest();
