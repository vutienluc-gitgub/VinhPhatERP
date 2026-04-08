import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log('--- Order Progress ---');
  const { data: progress } = await supabase
    .from('order_progress')
    .select('order_id, stage, status, orders(order_number)');
  if (progress) {
    console.log('Progress Rows Found:', progress.length);
    const summary = progress
      .map((p) => ({
        order: p.orders?.order_number,
        stage: p.stage,
        status: p.status,
      }))
      .slice(0, 30);
    console.table(summary);
  } else {
    console.log('No progress rows found.');
  }

  console.log('\n--- Work Orders In Progress ---');
  const { data: wos } = await supabase
    .from('work_orders')
    .select('work_order_number, status, order_id, orders(order_number)');
  if (wos) {
    console.log('Work Orders Found:', wos.length);
    const woSummary = wos.map((w) => ({
      number: w.work_order_number,
      status: w.status,
      order: w.orders?.order_number,
    }));
    console.table(woSummary);
  } else {
    console.log('No work orders found.');
  }
}

checkData();
