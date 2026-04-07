
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '..', '.env.local');
let supabaseUrl, supabaseKey;

try {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    if (line.includes('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
    if (line.includes('VITE_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
  }
} catch (e) {
  console.error("Failed to read .env.local", e);
  process.exit(1);
}

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  console.log("Checking order_progress table logic...");
  
  const { data, error } = await supabase
    .from('order_progress')
    .select(`
      id, 
      order_id, 
      work_order_id, 
      stage, 
      status,
      work_orders(work_order_number)
    `)
    .limit(20);

  if (error) {
    console.error("Error fetching order_progress:", error);
    return;
  }
  
  console.log(`Fetched ${data.length} rows.`);
  
  const standalone = data.filter(r => !r.order_id && r.work_order_id);
  console.log(`Standalone LSX progress rows in sample: ${standalone.length}`);
  
  if (standalone.length > 0) {
    console.log("Sample standalone row:", JSON.stringify(standalone[0], null, 2));
  } else {
    // Check if there are any standalone at all
    const { count, error: countErr } = await supabase
      .from('order_progress')
      .select('id', { count: 'exact', head: true })
      .is('order_id', null)
      .not('work_order_id', 'is', null);
    
    if (countErr) {
      console.error("Error counting standalone:", countErr);
    } else {
      console.log(`Total standalone progress rows in DB: ${count}`);
    }
  }
}

runTest();
