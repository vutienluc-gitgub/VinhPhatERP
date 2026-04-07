
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
  const orderId = '0e2a11d6-665a-4c0e-8b26-e4152bf273cd';
  const { data: order, error } = await supabase.from('orders').select('*').eq('id', orderId).single();
  if (error) {
    console.error("Error fetching order:", error);
  } else {
    console.log("Order status:", order.status);
  }

  // Check if any order has progress rows
  const { data: anyProgress } = await supabase.from('order_progress').select('order_id').limit(1);
  console.log("Any progress rows at all?", anyProgress);
}

runTest();
