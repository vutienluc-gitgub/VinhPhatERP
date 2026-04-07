
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

async function listAllWOs() {
  console.log("Listing all Work Orders...");
  const { data, error } = await supabase
    .from('work_orders')
    .select('id, work_order_number, order_id, status, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error:", error);
  } else {
    console.log(`Found ${data.length} Work Orders.`);
    console.table(data);
  }
}

listAllWOs();
