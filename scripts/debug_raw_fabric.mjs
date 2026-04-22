import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env = fs.readFileSync('.env.local', 'utf8');

const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=(.*)/);

if (!urlMatch || !keyMatch) {
  console.log("Missing credentials");
  process.exit(1);
}

const supabase = createClient(
  urlMatch[1].trim().replace(/['"]/g, ''),
  keyMatch[1].trim().replace(/['"]/g, '')
);

async function main() {
  const { data, error } = await supabase
    .from('raw_fabric_rolls')
    .select('id, roll_number, lot_number, weight_kg, tenant_id, created_at')
    .order('created_at', { ascending: false })
    .limit(40);
    
  if (error) {
    console.error(error);
  } else {
    console.log(`Found ${data.length} recent rolls.`);
    console.log(data);
  }
}

main();
