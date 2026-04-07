
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

async function checkStandalone() {
  console.log("Checking for any order_progress rows...");
  const { data: allProgress, error: err1 } = await supabase.from('order_progress').select('id, order_id, work_order_id').limit(10);
  if (err1) {
    console.error("Error:", err1);
  } else {
    console.log("Found progress rows:", allProgress.length);
    console.log("Sample:", JSON.stringify(allProgress, null, 2));
  }

  const { data: standaloneProgress, error: err2 } = await supabase
    .from('order_progress')
    .select('*, work_orders(work_order_number)')
    .is('order_id', null)
    .not('work_order_id', 'is', null);

  if (err2) {
    console.error("Error fetching standalone progress:", err2);
  } else {
    console.log("Found standalone progress records:", standaloneProgress.length);
    if (standaloneProgress.length > 0) {
      console.log("Sample standalone:", JSON.stringify(standaloneProgress[0], null, 2));
    }
  }
  
  const { data: standaloneWOs, error: err3 } = await supabase
    .from('work_orders')
    .select('id, work_order_number')
    .is('order_id', null);
  
  if (err3) {
    console.error("Error fetching standalone WOs:", err3);
  } else {
    console.log("Found standalone Work Orders in database:", standaloneWOs.length);
    for (const wo of standaloneWOs) {
        console.log(`- ${wo.work_order_number} (${wo.id})`);
    }
  }
}

checkStandalone();
