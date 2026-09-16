import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

const envRaw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
const env = {};
for (const line of envRaw.split('\n')) {
  if (!line.includes('=') || line.startsWith('#')) continue;
  const i = line.indexOf('=');
  env[line.slice(0, i).trim()] = line
    .slice(i + 1)
    .trim()
    .replace(/^["']|["']$/g, '');
}

const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_ANON_KEY,
);
const STAGES = [
  'warping',
  'weaving',
  'greige_check',
  'dyeing',
  'finishing',
  'final_check',
  'packing',
];

async function run() {
  // Check ALL orders and their statuses
  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, status')
    .limit(10);
  console.log('All orders:');
  console.table(orders);

  // Find the order linked to WOs
  const { data: wos } = await supabase
    .from('work_orders')
    .select('order_id')
    .limit(1);
  if (wos?.[0]?.order_id) {
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', wos[0].order_id)
      .single();
    console.log('\nOrder linked to WOs:', order);
  }

  // Backfill for ALL orders regardless of status
  const { data: allOrders } = await supabase
    .from('orders')
    .select('id, order_number, status');
  console.log(`\nTotal orders: ${allOrders?.length}`);

  for (const order of allOrders ?? []) {
    const { data: existing } = await supabase
      .from('order_progress')
      .select('id')
      .eq('order_id', order.id);
    if (existing?.length > 0) {
      console.log(
        `⏭  ${order.order_number} (${order.status}) — has ${existing.length} rows`,
      );
      continue;
    }
    const rows = STAGES.map((stage) => ({
      order_id: order.id,
      stage,
      status: 'pending',
    }));
    const { error } = await supabase.from('order_progress').insert(rows);
    if (error) console.error(`❌ ${order.order_number}:`, error.message);
    else
      console.log(
        `✅ ${order.order_number} (${order.status}) — created 7 rows`,
      );
  }

  const { data: final } = await supabase.from('order_progress').select('id');
  console.log('\nTotal progress rows now:', final?.length ?? 0);
}

run().catch((e) => console.error('Fatal:', e.message));
